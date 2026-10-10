/**
 * POST /api/send-email
 *
 * Admin-only endpoint to send emails via Resend.
 * Supports individual sends (to) or topic-based broadcasts (topic).
 *
 * Request body:
 *   { to?: string, topic?: 'students'|'tutors'|'staff'|'newsletter', subject: string, html: string }
 *
 * Requires a valid Firebase ID token with admin: true in the Authorization header.
 */

import { createFileRoute } from "@tanstack/react-router";
import { sendEmail } from "@/lib/resend";

type Topic = "students" | "tutors" | "staff" | "newsletter";

export const Route = createFileRoute("/api/send-email")({
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
          // 2. Parse body
          // ------------------------------------------------------------------
          const body = await request.json().catch(() => null);
          if (!body) {
            return Response.json({ error: "Request body is required." }, { status: 400 });
          }

          const { to, topic, subject, html } = body as {
            to?: string;
            topic?: Topic;
            subject?: string;
            html?: string;
          };

          if (!subject || typeof subject !== "string") {
            return Response.json({ error: "subject (string) is required." }, { status: 400 });
          }
          if (!html || typeof html !== "string") {
            return Response.json({ error: "html (string) is required." }, { status: 400 });
          }
          if (!to && !topic) {
            return Response.json({ error: "Either 'to' or 'topic' is required." }, { status: 400 });
          }

          // ------------------------------------------------------------------
          // 3. Resolve recipients
          // ------------------------------------------------------------------
          let recipients: string[] = [];

          if (to) {
            recipients = [to];
          } else if (topic) {
            const usersRef = adminDb.collection("users");
            let snapshot;

            if (topic === "newsletter") {
              snapshot = await usersRef
                .where("emailSubscriptions.newsletter", "==", true)
                .get();
            } else {
              // Map topic to role value
              const roleMap: Record<string, string> = {
                students: "student",
                tutors: "tutor",
                staff: "staff",
              };
              snapshot = await usersRef
                .where("role", "==", roleMap[topic] ?? topic)
                .get();
            }

            recipients = snapshot.docs
              .map((d) => d.data().email as string | undefined)
              .filter((e): e is string => Boolean(e));
          }

          if (recipients.length === 0) {
            return Response.json({ sent: 0, failed: 0, message: "No recipients found." });
          }

          // ------------------------------------------------------------------
          // 4. Send emails
          // ------------------------------------------------------------------
          let sent = 0;
          let failed = 0;

          const results = await Promise.allSettled(
            recipients.map((email) =>
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

          return Response.json({ sent, failed });
        } catch (error) {
          console.error("send-email error:", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Failed to send email.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
