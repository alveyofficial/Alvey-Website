/**
 * GET /api/sitemap
 *
 * Dynamic sitemap endpoint — called by the sitemap generation script at build
 * time (and optionally at runtime for a fully up-to-date sitemap).
 *
 * Returns the list of active tutor IDs so the build script can include them
 * in public/sitemap.xml without bundling Appwrite server SDK into the client.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Client as AppwriteServerClient, Databases, Query } from "node-appwrite";

const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID =
  process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || "tutorslink";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const APPWRITE_DATABASE_ID =
  process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || "Database";

const FALLBACK_TUTOR_IDS = ["tutor_1", "tutor_2", "tutor_3", "tutor_4"];

async function getActiveTutorIds(): Promise<string[]> {
  if (!APPWRITE_API_KEY) return FALLBACK_TUTOR_IDS;
  try {
    const client = new AppwriteServerClient()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);
    const result = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      "tutor_profiles",
      [Query.equal("active", true), Query.limit(500)],
    );
    const ids = result.documents.map((d) => d.$id as string).filter(Boolean);
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
