/**
 * GET /api/public/stats
 *
 * Returns live platform stats (tutor count, member count, subject count, average rating).
 * Runs server-side only — uses the Firebase Admin SDK throughout so SSR context works.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // All Firestore/Auth access via Admin SDK — client SDK doesn't work in SSR context.
          const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

          const [tutorsSnap, catSnap, authUsers] = await Promise.all([
            adminDb.collection("tutor_profiles").where("active", "==", true).get(),
            adminDb.collection("subject_categories").where("active", "==", true).get(),
            adminAuth.listUsers(1000),
          ]);

          const tutors = tutorsSnap.docs.map((d) => d.data()) as Record<string, unknown>[];
          const memberCount = authUsers.users.length;

          // Subject count from the subject_categories collection; fall back to
          // unique subjects from tutor profiles if the collection is empty.
          let subjectCount: number;
          if (catSnap.size > 0) {
            subjectCount = catSnap.size;
          } else {
            const subjectSet = new Set<string>();
            for (const tutor of tutors) {
              const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
              subjects.forEach((s) => {
                if (typeof s === "string" && s.trim()) subjectSet.add(s);
              });
            }
            subjectCount = subjectSet.size;
          }

          let ratingSum = 0;
          let ratingCount = 0;
          for (const tutor of tutors) {
            // Firestore field is "rating"; rating_avg is the legacy mapped alias.
            const rating = Number((tutor as any).rating ?? (tutor as any).rating_avg ?? 0);
            if (Number.isFinite(rating) && rating > 0) {
              ratingSum += rating;
              ratingCount += 1;
            }
          }

          const payload = {
            tutors: tutors.length,
            members: memberCount,
            subjects: subjectCount,
            rating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0,
          };

          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        } catch (error) {
          console.error("Public stats route error:", error);
          return new Response(
            JSON.stringify({ tutors: 0, members: 0, subjects: 0, rating: 0 }),
            {
              status: 200,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            },
          );
        }
      },
    },
  },
});
