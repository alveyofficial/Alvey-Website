/**
 * POST /api/admin/resolve-student
 *
 * Looks up a Firebase Auth user by email and returns their UID.
 *
 * TODO: Full server-side lookup requires the Firebase Admin SDK initialized with a
 * service-account key (FIREBASE_SERVICE_ACCOUNT_JSON env var). Until that is set up,
 * this route falls back to querying the Firestore `users` collection by email —
 * which works as long as user records are written there on sign-up (auth.tsx does this).
 */

import { createFileRoute } from "@tanstack/react-router";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export const Route = createFileRoute("/api/admin/resolve-student")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { email } = await request.json();

          if (!email || typeof email !== "string") {
            return Response.json({ error: "Email is required." }, { status: 400 });
          }

          const authHeader = request.headers.get("authorization");
          const jwt = authHeader?.replace(/^Bearer\s+/i, "");

          if (!jwt) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
          }

          // Query Firestore users collection by email as a fallback.
          // When Firebase Admin SDK is available, replace this with:
          // const userRecord = await adminAuth.getUserByEmail(email.trim());
          const q = query(
            collection(db, "users"),
            where("email", "==", email.trim()),
            limit(2),
          );
          const snap = await getDocs(q);

          if (snap.empty) {
            return Response.json(
              { error: "No user found with that email in the users collection." },
              { status: 404 },
            );
          }

          if (snap.size > 1) {
            return Response.json(
              { error: "Multiple users found with that email." },
              { status: 409 },
            );
          }

          const userDoc = snap.docs[0];
          const data = userDoc.data();

          return Response.json({
            userId: userDoc.id,
            email: data.email,
            name: data.displayName || data.name || "",
          });
        } catch (error) {
          console.error("Resolve student failed:", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Failed to resolve student.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
