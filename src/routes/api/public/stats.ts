import { createFileRoute } from "@tanstack/react-router";
import { Client as AppwriteServerClient, Databases, Users, Query } from "node-appwrite";

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID =
  process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || "tutorslink";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const APPWRITE_DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || "Database";
const COLLECTIONS = {
  TUTOR_PROFILES: "tutor_profiles",
} as const;

function buildServerClient() {
  const client = new AppwriteServerClient()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return {
    databases: new Databases(client),
    users: new Users(client),
  };
}

async function listActiveTutors(databases: Databases) {
  try {
    const result = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.TUTOR_PROFILES, [
      Query.equal("active", true),
    ]);
    return result.documents as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { databases, users } = buildServerClient();
          const [tutors, usersResult] = await Promise.all([
            listActiveTutors(databases),
            users.list([]),
          ]);

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
            members: usersResult.total,
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
            JSON.stringify({
              tutors: 0,
              members: 0,
              subjects: 0,
              rating: 0,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
              },
            },
          );
        }
      },
    },
  },
});
