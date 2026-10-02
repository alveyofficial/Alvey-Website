import { createFileRoute } from "@tanstack/react-router";
import { Account, Client, Teams } from "node-appwrite";

export const Route = createFileRoute("/api/admin/add-tutor-to-team")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { userId } = await request.json();

          if (!userId || typeof userId !== "string") {
            return Response.json(
              { error: "User ID is required." },
              { status: 400 },
            );
          }

          const authHeader = request.headers.get("authorization");
          const jwt = authHeader?.replace(/^Bearer\s+/i, "");

          if (!jwt) {
            return Response.json(
              { error: "Unauthorized." },
              { status: 401 },
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

          // Verify the currently logged-in admin session.
          const userClient = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setJWT(jwt);

          const account = new Account(userClient);
          await account.get();

          // Server-side Appwrite client.
          const adminClient = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);

          const teams = new Teams(adminClient);

          const membership = await teams.createMembership({
            teamId: "tutors",
            userId,
            roles: ["tutor"],
          });

          return Response.json({
            success: true,
            membershipId: membership.$id,
            userId: membership.userId,
            teamId: membership.teamId,
          });
        } catch (error: any) {
          console.error("Add tutor to team failed:", error);

          if (error?.code === 409) {
            return Response.json(
              {
                error: "User is already a member of the tutors team.",
              },
              { status: 409 },
            );
          }

          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to add tutor to team.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});