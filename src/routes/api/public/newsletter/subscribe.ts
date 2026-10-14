/**
 * POST /api/public/newsletter/subscribe
 *
 * Subscribes an email address to the Alvey newsletter.
 * Runs server-side only — uses the Firebase Admin SDK.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/newsletter/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const jsonHeaders = { "content-type": "application/json" };

        try {
          const { adminDb } = await import("@/lib/firebase-admin");

          // Parse and validate request body
          let email: string;
          try {
            const body = await request.json();
            email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
          } catch {
            return new Response(JSON.stringify({ error: "Invalid request body" }), {
              status: 400,
              headers: jsonHeaders,
            });
          }

          if (!email || !email.includes("@")) {
            return new Response(JSON.stringify({ error: "A valid email address is required" }), {
              status: 400,
              headers: jsonHeaders,
            });
          }

          // Check for existing subscriber
          const existing = await adminDb
            .collection("newsletter_subscribers")
            .where("email", "==", email)
            .limit(1)
            .get();

          if (!existing.empty) {
            const doc = existing.docs[0];
            const data = doc.data();

            if (data.status === "subscribed") {
              return new Response(JSON.stringify({ ok: true, message: "You're already subscribed." }), {
                status: 200,
                headers: jsonHeaders,
              });
            }

            // Re-subscribe
            await doc.ref.update({
              status: "subscribed",
              resubscribedAt: new Date().toISOString(),
            });

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: jsonHeaders,
            });
          }

          // New subscriber
          await adminDb.collection("newsletter_subscribers").add({
            email,
            status: "subscribed",
            subscribedAt: new Date().toISOString(),
          });

          return new Response(JSON.stringify({ ok: true }), {
            status: 201,
            headers: jsonHeaders,
          });
        } catch (error) {
          console.error("Newsletter subscribe error:", error);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      },
    },
  },
});
