/**
 * functions/src/classroom/ingestSessionEnd.ts
 *
 * Webhook called by the Pipecat agent when a session ends.
 * Receives a provider-agnostic payload, verifies the HMAC signature,
 * marks the session as ended, stores the raw transcript, and triggers
 * Gemini 1.5 Pro to generate structured post-class notes.
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = defineSecret("SESSION_WEBHOOK_SECRET");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

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

interface TranscriptEntry {
  speaker: "tutor" | "student" | "ai";
  text: string;
  timestamp: number;
}

interface SessionEndPayload {
  sessionId: string;
  rawTranscript: TranscriptEntry[];
  duration: number;       // seconds
  participants: string[]; // Firebase UIDs
}

interface PostClassNotes {
  keyTopics: string[];
  studentProgress: string;
  areasForImprovement: string[];
  homeworkSuggestions: string[];
  nextSessionRecommendations: string;
  overallSummary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTranscriptForPrompt(entries: TranscriptEntry[]): string {
  if (!entries || entries.length === 0) return "(No transcript available)";
  return entries
    .map((e) => `[${e.speaker.toUpperCase()}]: ${e.text}`)
    .join("\n");
}

async function generatePostClassNotes(
  apiKey: string,
  transcript: TranscriptEntry[],
): Promise<PostClassNotes> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const formattedTranscript = formatTranscriptForPrompt(transcript);

  const prompt = `You are an expert educational analyst. Analyze this tutoring session transcript and generate structured post-class notes.

Session Transcript:
${formattedTranscript}

Generate a comprehensive JSON object with exactly this structure (no markdown, just raw JSON):
{
  "keyTopics": ["array of main topics covered in the session"],
  "studentProgress": "paragraph describing what the student learned and how they progressed",
  "areasForImprovement": ["array of specific areas where the student struggled or needs more practice"],
  "homeworkSuggestions": ["array of specific homework or practice exercises to reinforce learning"],
  "nextSessionRecommendations": "paragraph with recommendations for what to cover in the next session",
  "overallSummary": "2-3 sentence summary of the entire session"
}

Respond with ONLY the JSON object, no explanation, no markdown fences.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned) as PostClassNotes;
}

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

export const ingestSessionEnd = onRequest(
  {
    secrets: [WEBHOOK_SECRET, GEMINI_API_KEY],
    cors: false,
    timeoutSeconds: 120, // Gemini call can take ~30s on long transcripts
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // -- HMAC signature verification ----------------------------------------
    const signature = req.headers["x-alvey-signature"] as string | undefined;
    if (!signature) {
      logger.warn("Missing X-Alvey-Signature header");
      res.status(401).json({ error: "Missing signature" });
      return;
    }

    const secret = WEBHOOK_SECRET.value();
    const bodyStr = JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", secret)
      .update(bodyStr)
      .digest("hex");

    let sigValid = false;
    try {
      sigValid = crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expected, "hex"),
      );
    } catch {
      sigValid = false;
    }

    if (!sigValid) {
      logger.warn("Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // -- Validate payload ----------------------------------------------------
    const payload = req.body as SessionEndPayload;
    const { sessionId, rawTranscript, duration, participants } = payload;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    // -- Look up session -----------------------------------------------------
    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      logger.error(`Session not found: ${sessionId}`);
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // -- Mark session as ended -----------------------------------------------
    await sessionRef.update({
      status: "ended",
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      duration: duration ?? 0,
      participantUids: participants ?? [],
    });

    // -- Store raw transcript ------------------------------------------------
    await sessionRef.collection("post_class_notes").doc("raw").set({
      rawTranscript: rawTranscript ?? [],
      status: "pending_summary",
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Session ${sessionId} ended and transcript stored.`);

    // Respond immediately so the agent process is not blocked
    res.status(200).json({ ok: true, sessionId });

    // -- Generate structured post-class notes with Gemini -------------------
    try {
      const summaryRef = sessionRef.collection("post_class_notes").doc("summary");

      // Mark as generating so the UI can show a skeleton
      await summaryRef.set({
        status: "generating",
        sessionId,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const notes = await generatePostClassNotes(
        GEMINI_API_KEY.value(),
        rawTranscript ?? [],
      );

      await summaryRef.set({
        ...notes,
        status: "ready",
        sessionId,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Post-class notes generated for session ${sessionId}.`);
    } catch (err) {
      logger.error(`Gemini summary generation failed for ${sessionId}:`, err);
      // Write error state so the UI can show a fallback
      await sessionRef.collection("post_class_notes").doc("summary").set({
        status: "error",
        sessionId,
        errorMessage: err instanceof Error ? err.message : String(err),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);
