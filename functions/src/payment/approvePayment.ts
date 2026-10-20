/**
 * functions/src/payment/approvePayment.ts
 *
 * Admin-only Cloud Function that:
 * 1. Confirms a booking after receipt verification
 * 2. Syncs the payment to Zoho Books (contact, invoice, payment recording)
 * 3. Writes a Payment document to Firestore with commission metadata
 *
 * On Zoho failure, the booking is still confirmed and a payment doc with
 * status "zoho_error" is written — the admin can reconcile manually.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_ORG_ID,
  ZOHO_ACCOUNTS,
  upsertContact,
  createInvoice,
  recordPayment,
} from "../zoho/zohoService.js";

// ---------------------------------------------------------------------------
// Admin SDK initialisation (idempotent)
// ---------------------------------------------------------------------------

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApprovePaymentData {
  bookingId: string;
  extraAmountSAR?: number;
  extraAmountDescription?: string;
}

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

export const approvePayment = onCall<ApprovePaymentData>(
  {
    secrets: [ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID],
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; zohoError?: string }> => {
    // ── Auth guard: admin custom claim ──────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    if (!(request.auth.token as Record<string, unknown>)["admin"]) {
      throw new HttpsError("permission-denied", "Admin only.");
    }

    const { bookingId, extraAmountSAR, extraAmountDescription } = request.data;

    if (!bookingId) {
      throw new HttpsError("invalid-argument", "bookingId is required.");
    }

    // ── Read booking ────────────────────────────────────────────────────────
    const bookingSnap = await db.collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) {
      throw new HttpsError("not-found", "Booking not found.");
    }

    const booking = bookingSnap.data()!;

    if (booking.status !== "verifying_receipt") {
      throw new HttpsError(
        "failed-precondition",
        `Booking is in status "${booking.status}", expected "verifying_receipt".`,
      );
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10); // YYYY-MM-DD

    // ── Confirm the booking first (before Zoho, so it's always confirmed) ──
    await db.collection("bookings").doc(bookingId).update({
      status: "confirmed",
      confirmedAt: now,
    });

    // ── Zoho sync (wrapped in try/catch so Zoho failure doesn't block) ─────
    const studentId: string = booking.studentId ?? "";
    const studentName: string = booking.studentName ?? "Unknown Student";
    const tutorId: string = booking.tutorId ?? "";
    const tutorName: string = booking.tutorName ?? "Unknown Tutor";
    const tenant: "main" | "effat" = booking.tenant ?? "main";
    const classQty: number = booking.classQty ?? 1;
    const classRateSAR: number = booking.classRateSAR ?? 0;
    const discountSAR: number = booking.discountSAR ?? 0;
    const platformFeesSAR: number = booking.platformFeesSAR ?? 5;
    const totalAmountSAR: number = booking.totalAmountSAR ?? classQty * classRateSAR - discountSAR + 5;
    const referenceNumber: string =
      booking.geminiVerification?.referenceNumber || booking.referenceCode || bookingId;

    // Commission calculation (20% on class fees only, excluding platform fee)
    const classFeeTotal = classQty * classRateSAR - discountSAR;
    const commissionRatePct = 20;
    const tutorPayoutSAR = classFeeTotal * 0.8;

    // Build line items
    const classDescription =
      tenant === "effat"
        ? `Effat University - ${booking.courseName ?? "One-on-One Classes"}`
        : "One-on-One Classes";

    const lineItems = [
      {
        description: classDescription,
        account_id: ZOHO_ACCOUNTS.COURSE_FEE_CLEARING,
        quantity: classQty,
        rate: classRateSAR,
      },
      {
        description: "Platform / Registration Fee",
        account_id: ZOHO_ACCOUNTS.OTHER_CHARGES,
        quantity: 1,
        rate: platformFeesSAR,
      },
    ];

    if (extraAmountSAR && extraAmountSAR > 0) {
      lineItems.push({
        description: extraAmountDescription ?? "Additional Amount",
        account_id: ZOHO_ACCOUNTS.OTHER_CHARGES,
        quantity: 1,
        rate: extraAmountSAR,
      });
    }

    const effectiveTotalSAR = totalAmountSAR + (extraAmountSAR ?? 0);

    let zohoContactId = "";
    let zohoInvoiceId = "";
    let zohoPaymentId = "";
    let zohoError: string | null = null;

    try {
      // ── Zoho secrets ────────────────────────────────────────────────────
      const clientId = ZOHO_CLIENT_ID.value();
      const clientSecret = ZOHO_CLIENT_SECRET.value();
      const refreshToken = ZOHO_REFRESH_TOKEN.value();
      const orgId = ZOHO_ORG_ID.value();

      // ── Get or create student Zoho contact ─────────────────────────────
      const userSnap = await db.collection("users").doc(studentId).get();
      const userData = userSnap.exists ? userSnap.data()! : {};
      const studentEmail: string = userData.email ?? `${studentId}@alvey.study`;

      zohoContactId = userData.zohoContactId ?? "";

      if (!zohoContactId) {
        zohoContactId = await upsertContact(
          studentEmail,
          studentName,
          clientId,
          clientSecret,
          refreshToken,
          orgId,
        );
      }

      // ── Create Zoho invoice ─────────────────────────────────────────────
      zohoInvoiceId = await createInvoice(
        {
          contactId: zohoContactId,
          lineItems,
          discountSAR,
          referenceNumber,
          notes: `Alvey Education — Booking ${booking.referenceCode ?? bookingId}`,
        },
        clientId,
        clientSecret,
        refreshToken,
        orgId,
      );

      // ── Record Zoho payment ─────────────────────────────────────────────
      zohoPaymentId = await recordPayment(
        {
          invoiceId: zohoInvoiceId,
          amountSAR: effectiveTotalSAR,
          referenceNumber,
          paymentDate: today,
        },
        clientId,
        clientSecret,
        refreshToken,
        orgId,
      );

      // ── Update student's Zoho contact ID ───────────────────────────────
      await db.collection("users").doc(studentId).update({ zohoContactId });

      logger.info(`Zoho sync complete for booking ${bookingId}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Zoho sync failed for booking ${bookingId}:`, errMsg);
      zohoError = errMsg;
    }

    // ── Write payment document ──────────────────────────────────────────────
    const paymentStatus = zohoError ? "zoho_error" : "zoho_synced";

    const subtotalSAR = classQty * classRateSAR;

    await db.collection("payments").add({
      bookingId,
      studentId,
      studentName,
      tenant,
      source: tenant === "effat" ? "effat.alvey.study" : "alvey.study",
      lineItems: lineItems.map((li) => ({
        description: li.description,
        accountId: li.account_id,
        quantity: li.quantity,
        rateSAR: li.rate,
        amountSAR: li.quantity * li.rate,
      })),
      subtotalSAR,
      discountSAR,
      platformFeesSAR,
      totalSAR: effectiveTotalSAR,
      tutorId,
      tutorName,
      commissionRatePct,
      tutorPayoutSAR,
      stcPayReference: referenceNumber,
      receiptUrl: booking.receiptUrl ?? "",
      zohoContactId,
      zohoInvoiceId,
      zohoPaymentId,
      status: paymentStatus,
      zohoError,
      createdAt: now,
      approvedAt: now,
      zohoSyncedAt: zohoError ? null : now,
    });

    if (zohoError) {
      return { success: true, zohoError };
    }

    return { success: true };
  },
);
