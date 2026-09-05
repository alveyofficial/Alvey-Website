import { createFileRoute } from "@tanstack/react-router";
import { Account, Client, Query, Users } from "node-appwrite";

export const Route = createFileRoute("/api/admin/resolve-student")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { email } = await request.json();

          if (!email || typeof email !== "string") {
            return Response.json(
              { error: "Email is required." },
              { status: 400 }
            );
          }

          const authHeader = request.headers.get("authorization");
          const jwt = authHeader?.replace(/^Bearer\s+/i, "");

          if (!jwt) {
            return Response.json(
              { error: "Unauthorized." },
              { status: 401 }
            );
          }

          const endpoint =
            process.env.VITE_APPWRITE_ENDPOINT ||
            "https://fra.cloud.appwrite.io/v1";

          const projectId =
            process.env.VITE_APPWRITE_PROJECT_ID || "tutorslink";

          const apiKey = process.env.APPWRITE_API_KEY;

          if (!apiKey) {
            throw new Error("APPWRITE_API_KEY is not configured.");
          }

          // Verify the currently logged-in user.
          const userClient = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setJWT(jwt);

          const account = new Account(userClient);
          await account.get();

          // Use the server API key to look up the EXISTING Auth user.
          const adminClient = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);

          const users = new Users(adminClient);

          const result = await users.list([
            Query.equal("email", email.trim()),
          ]);

          if (result.users.length === 0) {
            return Response.json(
              { error: "No Appwrite Auth user exists with that email." },
              { status: 404 }
            );
          }

          if (result.users.length > 1) {
            return Response.json(
              { error: "Multiple Auth users found with that email." },
              { status: 409 }
            );
          }

          const user = result.users[0];

          return Response.json({
            userId: user.$id,
            email: user.email,
            name: user.name,
          });
        } catch (error) {
          console.error("Resolve student failed:", error);

          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to resolve student.",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});