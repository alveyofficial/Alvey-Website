/**
 * POST /api/admin/resolve-student
 *
 * Looks up a Firebase Auth user by email and returns their UID.
 * Requires a valid Firebase ID token in the Authorization header.
 */

import { createFileRoute } from "@tanstack/react-router";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { adminAuth } from "@/lib/firebase-admin";

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

          try {
            await adminAuth.verifyIdToken(jwt);
          } catch {
            return Response.json({ error: "Forbidden." }, { status: 403 });
          }

          // Query Firestore users collection by email.
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
