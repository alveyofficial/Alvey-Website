/**
 * POST /api/admin/send-broadcast
 *
 * Admin-only endpoint to send broadcast emails to an audience group.
 *
 * Request body:
 *   { audience: 'students'|'tutors'|'staff'|'newsletter', subject: string, html: string }
 *
 * - 'newsletter': queries users where emailSubscriptions.newsletter == true
 * - 'students'|'tutors'|'staff': queries users where role == the singular form
 *
 * Sends in batches of 50 with a 1-second pause between batches to respect
 * Resend rate limits.
 *
 * Note: Full collection scans are acceptable here since this is admin-only
 * and user counts are small. Add Firestore composite indexes if needed later.
 */

import { createFileRoute } from "@tanstack/react-router";
import { sendEmail } from "@/lib/resend";

type Audience = "students" | "tutors" | "staff" | "newsletter";

export const Route = createFileRoute("/api/admin/send-broadcast")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

        try {
          // ------------------------------------------------------------------
          // 1. Verify admin token
          // ------------------------------------------------------------------
          const authHeader = request.headers.get("authorization") ?? "";
          const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();

          if (!idToken) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
          }

          let callerToken;
          try {
            callerToken = await adminAuth.verifyIdToken(idToken);
          } catch {
            return Response.json({ error: "Invalid token." }, { status: 401 });
          }

          if (callerToken.admin !== true) {
            return Response.json(
              { error: "Forbidden. Admin privileges required." },
              { status: 403 },
            );
          }

          // ------------------------------------------------------------------
          // 2. Parse and validate body
          // ------------------------------------------------------------------
          const body = await request.json().catch(() => null);
          if (!body) {
            return Response.json({ error: "Request body is required." }, { status: 400 });
          }

          const { audience, subject, html } = body as {
            audience?: Audience;
            subject?: string;
            html?: string;
          };

          const validAudiences: Audience[] = ["students", "tutors", "staff", "newsletter"];
          if (!audience || !validAudiences.includes(audience)) {
            return Response.json(
              { error: `audience must be one of: ${validAudiences.join(", ")}.` },
              { status: 400 },
            );
          }
          if (!subject || typeof subject !== "string") {
            return Response.json({ error: "subject (string) is required." }, { status: 400 });
          }
          if (!html || typeof html !== "string") {
            return Response.json({ error: "html (string) is required." }, { status: 400 });
          }

          // ------------------------------------------------------------------
          // 3. Query recipients
          // ------------------------------------------------------------------
          const usersRef = adminDb.collection("users");
          let snapshot;

          if (audience === "newsletter") {
            snapshot = await usersRef
              .where("emailSubscriptions.newsletter", "==", true)
              .get();
          } else {
            const roleMap: Record<Audience, string> = {
              students: "student",
              tutors: "tutor",
              staff: "staff",
              newsletter: "newsletter",
            };
            snapshot = await usersRef
              .where("role", "==", roleMap[audience])
              .get();
          }

          const emails = snapshot.docs
            .map((d) => d.data().email as string | undefined)
            .filter((e): e is string => Boolean(e));

          if (emails.length === 0) {
            return Response.json({ sent: 0, failed: 0 });
          }

          // ------------------------------------------------------------------
          // 4. Send in batches of 50 with 1s delay between batches
          // ------------------------------------------------------------------
          let sent = 0;
          let failed = 0;
          const BATCH_SIZE = 50;

          for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
              batch.map((email) =>
                sendEmail({ from: "noreply@alvey.study", to: email, subject, html }),
              ),
            );

            for (const result of results) {
              if (result.status === "fulfilled" && !("error" in result.value)) {
                sent += 1;
              } else {
                failed += 1;
              }
            }

            // Pause between batches (skip wait after last batch)
            if (i + BATCH_SIZE < emails.length) {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }

          console.log(
            `Broadcast sent by ${callerToken.uid}: audience=${audience}, sent=${sent}, failed=${failed}`,
          );

          return Response.json({ sent, failed });
        } catch (error) {
          console.error("send-broadcast error:", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Failed to send broadcast.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
