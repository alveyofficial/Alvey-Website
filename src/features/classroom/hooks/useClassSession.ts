/**
 * src/features/classroom/hooks/useClassSession.ts
 *
 * Orchestrates the full session lifecycle:
 *   1. Calls the `createClassSession` Cloud Function to get a provider-agnostic
 *      { roomUrl, token, sessionId } payload.
 *   2. Hands the token + roomUrl to useVideoRoom to establish the video call.
 *   3. Exposes session state alongside all video state/actions.
 */

import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/integrations/firebase/client";
import { useVideoRoom } from "../video/useVideoRoom";
import type { VideoRoomHook } from "../video/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStatus = "idle" | "loading" | "ready" | "ended" | "error";

interface ClassSessionPayload {
  sessionId: string;
  roomUrl: string;
}

export interface UseClassSessionReturn extends VideoRoomHook {
  sessionStatus: SessionStatus;
  sessionId: string | null;
  sessionError: string | null;
  startSession: (lessonId: string, role: "tutor" | "student") => Promise<void>;
  endSession: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useClassSession(): UseClassSessionReturn {
  const videoRoom = useVideoRoom();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [session, setSession] = useState<ClassSessionPayload | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const startSession = useCallback(
    async (lessonId: string, role: "tutor" | "student"): Promise<void> => {
      setSessionStatus("loading");
      setSessionError(null);

      try {
        const callFn = httpsCallable<
          { lessonId: string; role: "tutor" | "student" },
          { roomUrl: string; token: string; sessionId: string }
        >(functions, "createClassSession");

        const result = await callFn({ lessonId, role });
        const { roomUrl, token, sessionId } = result.data;

        setSession({ sessionId, roomUrl });
        await videoRoom.joinRoom(token, roomUrl);
        setSessionStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start session.";
        setSessionError(msg);
        setSessionStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoRoom.joinRoom],
  );

  const endSession = useCallback(async (): Promise<void> => {
    await videoRoom.leaveRoom();
    setSessionStatus("ended");
    setSession(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRoom.leaveRoom]);

  return {
    ...videoRoom,
    sessionStatus,
    sessionId: session?.sessionId ?? null,
    sessionError,
    startSession,
    endSession,
  };
}
