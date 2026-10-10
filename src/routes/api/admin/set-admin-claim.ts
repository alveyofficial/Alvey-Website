/**
 * POST /api/admin/set-admin-claim
 *
 * Sets or revokes custom claims on a Firebase Auth user.
 * Only callable by an existing admin (verified via their ID token).
 *
 * Request body: { uid: string, grant: boolean, role?: 'student'|'tutor'|'staff'|'admin' }
 *   uid   — the target user's Firebase Auth UID
 *   grant — true to grant, false to revoke all claims
 *   role  — optional; defaults to 'admin'. When 'admin': sets { admin: true, role: 'admin' }.
 *           When 'student'|'tutor'|'staff': sets { role } (no admin: true).
 *           When grant=false: sets null (removes all claims).
 */

import { createFileRoute } from "@tanstack/react-router";

const VALID_ROLES = ["student", "tutor", "staff", "admin"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

export const Route = createFileRoute("/api/admin/set-admin-claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Dynamic import — firebase-admin must not load during SSR page renders
        const { adminAuth } = await import("@/lib/firebase-admin");

        try {
          // ------------------------------------------------------------------
          // 1. Verify the caller is an authenticated admin
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

          if (!callerToken.admin) {
            return Response.json(
              { error: "Forbidden. Admin privileges required." },
              { status: 403 },
            );
          }

          // ------------------------------------------------------------------
          // 2. Parse and validate body
          // ------------------------------------------------------------------
          const body = await request.json().catch(() => null);

          if (!body || typeof body.uid !== "string" || !body.uid.trim()) {
            return Response.json(
              { error: "uid (string) is required." },
              { status: 400 },
            );
          }

          if (typeof body.grant !== "boolean") {
            return Response.json(
              { error: "grant (boolean) is required." },
              { status: 400 },
            );
          }

          const { uid, grant } = body as { uid: string; grant: boolean; role?: string };

          // Validate and default role
          const rawRole = body.role as string | undefined;
          if (rawRole !== undefined && !VALID_ROLES.includes(rawRole as ValidRole)) {
            return Response.json(
              { error: `role must be one of: ${VALID_ROLES.join(", ")}.` },
              { status: 400 },
            );
          }
          const role: ValidRole = (rawRole as ValidRole) ?? "admin";

          // ------------------------------------------------------------------
          // 3. Prevent self-demotion (safety guard)
          // ------------------------------------------------------------------
          if (!grant && uid === callerToken.uid) {
            return Response.json(
              { error: "You cannot revoke your own admin privileges." },
              { status: 400 },
            );
          }

          // ------------------------------------------------------------------
          // 4. Set the custom claim
          //    Passing null removes the claim entirely when revoking,
          //    which keeps the token payload clean.
          // ------------------------------------------------------------------
          let claims: Record<string, unknown> | null;
          if (!grant) {
            claims = null;
          } else if (role === "admin") {
            claims = { admin: true, role: "admin" };
          } else {
            claims = { role };
          }

          await adminAuth.setCustomUserClaims(uid, claims);

          const action = grant ? `granted (role: ${role})` : "revoked";
          console.log(`Claims ${action} for uid: ${uid} by ${callerToken.uid}`);

          return Response.json({
            success: true,
            message: `Claims ${action} for user ${uid}.`,
          });
        } catch (error) {
          console.error("set-admin-claim error:", error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to set admin claim.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
