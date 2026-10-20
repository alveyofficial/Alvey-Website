/**
 * functions/src/payment/analyzeReceipt.ts
 *
 * Analyzes an STC Pay receipt image using Gemini AI and saves the
 * extracted verification data back to the booking document in Firestore.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

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

interface AnalyzeReceiptData {
  bookingId: string;
  imageBase64: string;
  mimeType: string;
}

interface GeminiExtracted {
  extractedAmount: number;
  referenceNumber: string;
  transactionDate: string;
  recipientMatch: boolean;
}

interface GeminiVerification {
  extractedAmount: number;
  referenceNumber: string;
  transactionDate: string;
  recipientMatch: boolean;
  confidenceStatus: "100% Match" | "Partial Match" | "No Match" | "Unable to Extract";
  rawJson: string;
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// Confidence calculation
// ---------------------------------------------------------------------------

function calcConfidence(
  extracted: number,
  expected: number,
): GeminiVerification["confidenceStatus"] {
  if (expected <= 0) return "Unable to Extract";
  const diff = Math.abs(extracted - expected);
  if (diff <= 0.01) return "100% Match";
  if (diff <= 5) return "Partial Match";
  return "No Match";
}

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

export const analyzeReceipt = onCall<AnalyzeReceiptData>(
  {
    secrets: [GEMINI_API_KEY],
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; geminiVerification: GeminiVerification }> => {
    // ── Auth guard ──────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to analyze a receipt.");
    }

    const { bookingId, imageBase64, mimeType } = request.data;

    if (!bookingId || !imageBase64) {
      throw new HttpsError("invalid-argument", "bookingId and imageBase64 are required.");
    }

    // ── Verify caller owns this booking ────────────────────────────────────
    const bookingSnap = await db.collection("bookings").doc(bookingId).get();
    if (!bookingSnap.exists) {
      throw new HttpsError("not-found", "Booking not found.");
    }

    const bookingDoc = bookingSnap.data()!;
    if (bookingDoc.studentId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You are not the owner of this booking.");
    }

    // ── Status guard — only allow analysis on pending/unverified bookings ──
    if (!["awaiting_payment", "verifying_receipt"].includes(bookingDoc.status)) {
      throw new HttpsError(
        "failed-precondition",
        "Receipt analysis is only valid for pending bookings.",
      );
    }

    const expectedAmount: number = bookingDoc.totalAmountSAR ?? 0;

    // ── Gemini analysis ────────────────────────────────────────────────────
    const genai = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = [
      "Analyze this STC Pay payment receipt and extract the following information.",
      "Return ONLY a valid JSON object with no markdown, no code fences, and no extra text.",
      "The JSON must have exactly these keys:",
      '{ "extractedAmount": <number in SAR>, "referenceNumber": <STC Pay transaction/reference ID string>, "transactionDate": <date string as shown on receipt>, "recipientMatch": <true if recipient name contains "Alvey" or a similar education company name> }',
    ].join(" ");

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    let parsed: GeminiExtracted;
    let rawJson = "";

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      // Strip markdown code fences if present
      rawJson = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = JSON.parse(rawJson) as GeminiExtracted;
    } catch (err) {
      logger.error("Gemini analysis failed:", err);
      // Return a safe "Unable to Extract" result rather than throwing
      const fallback: GeminiVerification = {
        extractedAmount: 0,
        referenceNumber: "",
        transactionDate: "",
        recipientMatch: false,
        confidenceStatus: "Unable to Extract",
        rawJson: rawJson || "{}",
        analyzedAt: new Date().toISOString(),
      };
      await db.collection("bookings").doc(bookingId).update({ geminiVerification: fallback });
      return { success: true, geminiVerification: fallback };
    }

    const geminiVerification: GeminiVerification = {
      extractedAmount: typeof parsed.extractedAmount === "number" ? parsed.extractedAmount : 0,
      referenceNumber: parsed.referenceNumber ?? "",
      transactionDate: parsed.transactionDate ?? "",
      recipientMatch: Boolean(parsed.recipientMatch),
      confidenceStatus: calcConfidence(parsed.extractedAmount ?? 0, expectedAmount),
      rawJson: rawJson,
      analyzedAt: new Date().toISOString(),
    };

    await db.collection("bookings").doc(bookingId).update({ geminiVerification });
    logger.info(`Receipt analyzed for booking ${bookingId}: ${geminiVerification.confidenceStatus}`);

    return { success: true, geminiVerification };
  },
);
