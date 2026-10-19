/**
 * functions/src/classroom/createClassSession.ts
 *
 * Creates or retrieves a video session for a confirmed lesson.
 *
 * Returns a provider-agnostic { roomUrl, token, sessionId } payload.
 * No Daily.co-specific fields are exposed to the client — only the internals
 * of this file call the Daily REST API.
 *
 * ── Migration note ────────────────────────────────────────────────────────
 * To migrate to LiveKit, replace the two `dailyRequest` calls in this file
 * (room creation + token minting) with LiveKit Room Service SDK calls.
 * The returned shape and all Firestore writes remain unchanged.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

const DAILY_API_KEY = defineSecret("DAILY_API_KEY");

// Cloud Run agent URL (not secret — just a config value)
const AGENT_URL = "https://alvey-classroom-agent-1020096383368.me-central1.run.app";

// ---------------------------------------------------------------------------
// Admin SDK initialisation (idempotent)
// ---------------------------------------------------------------------------

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateClassSessionData {
  lessonId: string;
  role: "tutor" | "student";
}

interface ClassSessionResponse {
  roomUrl: string;
  token: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Daily REST helper (no extra npm deps — Node 18+ fetch is available)
// ---------------------------------------------------------------------------

async function dailyRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `https://api.daily.co/v1${path}`;
  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Daily API ${method} ${path} → ${resp.status}: ${text}`);
  }

  return resp.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

export const createClassSession = onCall<
  CreateClassSessionData,
  Promise<ClassSessionResponse>
>(
  {
    secrets: [DAILY_API_KEY],
    enforceAppCheck: false, // Enable once App Check is configured in the console
  },
  async (request): Promise<ClassSessionResponse> => {
    // ── Auth guard ─────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to join a session.",
      );
    }

    const { lessonId, role } = request.data;
    const callerUid = request.auth.uid;

    if (!lessonId || !role) {
      throw new HttpsError("invalid-argument", "lessonId and role are required.");
    }

    // ── Verify caller is a participant of this lesson ──────────────────────
    const lessonDoc = await db.collection("lessons").doc(lessonId).get();
    if (!lessonDoc.exists) {
      throw new HttpsError("not-found", "Lesson not found.");
    }

    const lesson = lessonDoc.data()!;
    const isTutor = role === "tutor";

    if (lesson.studentId !== callerUid && lesson.tutorId !== callerUid) {
      throw new HttpsError(
        "permission-denied",
        "You are not a participant of this lesson.",
      );
    }

    const apiKey = DAILY_API_KEY.value();

    // Deterministic room name prevents duplicate rooms on repeated calls
    const roomName = `alvey-${lessonId}`;

    // ── Get or create Daily room ───────────────────────────────────────────
    let roomUrl: string;
    try {
      const existing = await dailyRequest<{ url: string }>(
        "GET",
        `/rooms/${roomName}`,
        apiKey,
      );
      roomUrl = existing.url;
      logger.info(`Reusing existing Daily room: ${roomName}`);
    } catch {
      // Room doesn't exist — create it
      const threeHoursFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 3;
      const created = await dailyRequest<{ url: string }>("POST", "/rooms", apiKey, {
        name: roomName,
        privacy: "private",
        properties: {
          exp: threeHoursFromNow,
          enable_chat: false,
          enable_screenshare: true,
          max_participants: 5, // tutor + student + AI bot + 2 buffer
        },
      });
      roomUrl = created.url;
      logger.info(`Created new Daily room: ${roomName}`);
    }

    // ── Mint a scoped meeting token ────────────────────────────────────────
    const threeHoursFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 3;
    const tokenResp = await dailyRequest<{ token: string }>(
      "POST",
      "/meeting-tokens",
      apiKey,
      {
        properties: {
          room_name: roomName,
          user_id: callerUid,
          user_name: isTutor
            ? (lesson.tutorName as string | undefined) ?? "Tutor"
            : (lesson.studentName as string | undefined) ?? "Student",
          is_owner: isTutor, // Tutors are room owners
          exp: threeHoursFromNow,
        },
      },
    );

    // ── Persist / update session document ─────────────────────────────────
    const sessionId = `${lessonId}-session`;
    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      await sessionRef.set({
        sessionId,
        lessonId,
        tutorId: lesson.tutorId as string,
        studentId: lesson.studentId as string,
        status: "active",
        providerRoomName: roomName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── Mint a bot token and trigger the AI agent ─────────────────────
      try {
        const botTokenResp = await dailyRequest<{ token: string }>(
          "POST",
          "/meeting-tokens",
          apiKey,
          {
            properties: {
              room_name: roomName,
              user_name: "Alvey AI",
              is_owner: false,
              exp: threeHoursFromNow,
            },
          },
        );

        // Fire-and-forget POST to the Cloud Run agent (10s timeout)
        fetch(`${AGENT_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomUrl,
            token: botTokenResp.token,
            sessionId,
          }),
          signal: AbortSignal.timeout(10000),
        }).catch((e) => logger.error(`Agent trigger failed: ${e}`));

        logger.info(`AI agent triggered for session ${sessionId}`);
      } catch (e) {
        logger.error(`Bot token/trigger failed: ${e}`);
        // Non-fatal — the video session still works without the AI bot
      }
    }

    // ── Return provider-agnostic payload ───────────────────────────────────
    return {
      roomUrl,
      token: tokenResp.token,
      sessionId,
    };
  },
);
