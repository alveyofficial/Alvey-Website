/**
 * GET /api/sitemap
 *
 * Returns active tutor IDs for sitemap generation.
 *
 * TODO: Replace the Firestore fetch below with Firebase Admin SDK once
 * a service account key is configured (FIREBASE_SERVICE_ACCOUNT_JSON env var).
 * For now it falls back to the static list so the build doesn't break.
 */

import { createFileRoute } from "@tanstack/react-router";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

const FALLBACK_TUTOR_IDS = ["tutor_1", "tutor_2", "tutor_3", "tutor_4"];

async function getActiveTutorIds(): Promise<string[]> {
  try {
    const q = query(
      collection(db, "tutor_profiles"),
      where("active", "==", true),
      limit(500),
    );
    const snap = await getDocs(q);
    const ids = snap.docs.map((d) => d.id).filter(Boolean);
    return ids.length > 0 ? ids : FALLBACK_TUTOR_IDS;
  } catch {
    return FALLBACK_TUTOR_IDS;
  }
}

export const Route = createFileRoute("/api/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const tutorIds = await getActiveTutorIds();
          return new Response(JSON.stringify({ tutorIds }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=3600",
            },
          });
        } catch (error) {
          console.error("Sitemap API error:", error);
          return new Response(
            JSON.stringify({ tutorIds: FALLBACK_TUTOR_IDS }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    },
  },
});
