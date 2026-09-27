import { createFileRoute } from "@tanstack/react-router";
import {
  Client as AppwriteServerClient,
  Databases,
  ID,
  Query,
} from "node-appwrite";

const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";

const APPWRITE_PROJECT_ID =
  process.env.VITE_APPWRITE_PROJECT_ID ||
  process.env.APPWRITE_PROJECT_ID ||
  "tutorslink";

const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";

const APPWRITE_DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ||
  process.env.VITE_APPWRITE_DATABASE_ID ||
  "Database";

const COLLECTIONS = {
  NEWSLETTER_SUBSCRIBERS: "newsletter_subscribers",
} as const;

function buildServerClient() {
  const client = new AppwriteServerClient()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return {
    databases: new Databases(client),
  };
}

export const Route = createFileRoute("/api/public/newsletter/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const email =
            typeof body?.email === "string"
              ? body.email.trim().toLowerCase()
              : "";

          if (!email) {
            return new Response(
              JSON.stringify({ error: "Email is required." }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(email)) {
            return new Response(
              JSON.stringify({ error: "Please enter a valid email address." }),
              {
                status: 400,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const { databases } = buildServerClient();

          const existing = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.NEWSLETTER_SUBSCRIBERS,
            [Query.equal("email", email), Query.limit(1)],
          );

          if (existing.documents.length > 0) {
            const subscriber = existing.documents[0];

            if (subscriber.status === "subscribed") {
              return new Response(
                JSON.stringify({
                  success: true,
                  message: "You're already subscribed.",
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" },
                },
              );
            }

            await databases.updateDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.NEWSLETTER_SUBSCRIBERS,
              subscriber.$id,
              {
                status: "subscribed",
                subscribedAt: new Date().toISOString(),
                unsubscribedAt: null,
              },
            );

            return new Response(
              JSON.stringify({
                success: true,
                message: "You're subscribed again!",
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" },
              },
            );
          }

          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.NEWSLETTER_SUBSCRIBERS,
            ID.unique(),
            {
              email,
              status: "subscribed",
              subscribedAt: new Date().toISOString(),
              unsubscribedAt: null,
            },
          );

          return new Response(
            JSON.stringify({
              success: true,
              message: "You're subscribed!",
            }),
            {
              status: 201,
              headers: { "content-type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Newsletter subscription error:", error);

          return new Response(
            JSON.stringify({
              error: "Unable to subscribe right now. Please try again later.",
            }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }
      },
    },
  },
});