/**
 * GET /api/public/stats
 *
 * Returns live platform stats (tutor count, subject count, average rating).
 * Uses the Firebase client-side SDK since this is a public, read-only endpoint.
 * Full user count requires Firebase Admin SDK — falls back to 0 until configured.
 */

import { createFileRoute } from "@tanstack/react-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

async function listActiveTutors() {
  try {
    const q = query(collection(db, "tutor_profiles"), where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data()) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const tutors = await listActiveTutors();

          const subjectSet = new Set<string>();
          let ratingSum = 0;
          let ratingCount = 0;

          for (const tutor of tutors) {
            const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
            subjects.forEach((subject) => {
              if (typeof subject === "string" && subject.trim()) {
                subjectSet.add(subject);
              }
            });

            const rating = Number(tutor.rating ?? tutor.rating_avg ?? 0);
            if (Number.isFinite(rating) && rating > 0) {
              ratingSum += rating;
              ratingCount += 1;
            }
          }

          const payload = {
            tutors: tutors.length,
            // TODO: populate with Firebase Admin SDK user count
            members: 0,
            subjects: subjectSet.size,
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
