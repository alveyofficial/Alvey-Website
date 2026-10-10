// /api/chatbot — thin proxy to the alvey-ai-brain Cloud Function.
// All AI logic lives in functions/alvey-ai-brain/src/main.js.
// This route:
//   1. Resolves the current user identity from the Firebase session cookie / Authorization header.
//   2. Forwards the request body + identity to the AI Cloud Function via HTTP.
//   3. Returns the function's response verbatim.
//
// TODO: Full server-side Firebase Auth verification requires the Firebase Admin SDK
// (initialized with a service-account key). Until FIREBASE_SERVICE_ACCOUNT_JSON is
// set, identity resolution gracefully falls back to anonymous (no userId/userRole).

import { createFileRoute } from "@tanstack/react-router";

const AI_FUNCTION_URL = process.env.AI_FUNCTION_URL || "";

// ---------------------------------------------------------------------------
// Message normalisation
// ---------------------------------------------------------------------------
type ChatMessage = { role: "user" | "assistant"; content: string };

function normalizeMessages(body: {
  message?: unknown;
  history?: unknown;
  messages?: unknown;
}): ChatMessage[] | undefined {
  if (Array.isArray(body.messages)) {
    return (body.messages as { role?: string; content?: string }[])
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .map((m): ChatMessage => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content! }));
  }
  if (typeof body.message !== "string") return undefined;
  const history = Array.isArray(body.history) ? body.history : [];
  return [
    ...(history as { role?: string; content?: string }[])
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .map((m): ChatMessage => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content! })),
    { role: "user" as const, content: body.message as string },
  ];
}

// ---------------------------------------------------------------------------
// Resolve identity — reads the Bearer token from Authorization header and
// verifies it with Firebase Admin SDK.
// ---------------------------------------------------------------------------
async function resolveCurrentUser(
  request: Request,
): Promise<{ userId: string | null; userRole: string | null }> {
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "") || null;

  if (!idToken) return { userId: null, userRole: null };

  try {
    // Dynamic import — firebase-admin must not load during SSR page renders
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const role = userDoc.exists ? (userDoc.data()?.role as string | undefined) ?? null : null;
    return { userId: uid, userRole: role };
  } catch {
    return { userId: null, userRole: null };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export const Route = createFileRoute("/api/chatbot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { currentUrl } = body;

          const messages = normalizeMessages(body);
          if (!messages?.length) {
            return new Response(JSON.stringify({ error: "Invalid chat message." }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          if (!AI_FUNCTION_URL) {
            return new Response(
              JSON.stringify({ error: "AI backend not configured. Set AI_FUNCTION_URL." }),
              { status: 503, headers: { "content-type": "application/json" } },
            );
          }

          const { userId, userRole } = await resolveCurrentUser(request);

          const fnResponse = await fetch(AI_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages,
              currentUrl: currentUrl || "/",
              ...(userId ? { userId, userRole } : {}),
            }),
          });

          if (!fnResponse.ok) {
            const errData = await fnResponse.json().catch(() => ({}));
            return new Response(
              JSON.stringify({ error: (errData as { error?: string }).error || "AI function error." }),
              { status: fnResponse.status, headers: { "content-type": "application/json" } },
            );
          }

          const data = await fnResponse.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        } catch (err: unknown) {
          console.error("Chatbot proxy error:", err);
          const detail = err instanceof Error ? err.message : "Unknown error";
          return new Response(
            JSON.stringify({ error: "Unable to process chat request.", details: detail }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
