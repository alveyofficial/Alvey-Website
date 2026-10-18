/**
 * src/features/classroom/video/useVideoRoom.ts
 *
 * The single point of contact between the React UI and the video layer.
 * Exposes only provider-agnostic state and actions — no SDK types leak out.
 *
 * ── Migration note ──────────────────────────────────────────────────────────
 * To swap Daily.co for LiveKit, change the one import below:
 *   import { LiveKitProvider } from "./providers/livekit";
 * and replace `new DailyProvider()` with `new LiveKitProvider()`.
 * Nothing else in the codebase needs to change.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
// ↓ This is the ONLY import of the concrete provider — swap here for LiveKit
import { DailyProvider } from "./providers/daily";
import type { VideoRoomHook, VideoRoomState } from "./types";

const INITIAL_STATE: VideoRoomState = {
  connectionState: "idle",
  participants: [],
  localParticipant: null,
  isMicEnabled: true,
  isCameraEnabled: true,
  error: null,
};

export function useVideoRoom(): VideoRoomHook {
  const providerRef = useRef<DailyProvider | null>(null);
  const [state, setState] = useState<VideoRoomState>(INITIAL_STATE);

  /** Lazily create the provider once per hook instance */
  function getProvider(): DailyProvider {
    if (!providerRef.current) {
      providerRef.current = new DailyProvider();
    }
    return providerRef.current;
  }

  // Subscribe to state changes and clean up on unmount
  useEffect(() => {
    const provider = getProvider();
    const unsubscribe = provider.onStateChange(setState);
    return () => {
      unsubscribe();
      // Gracefully leave the room when the hook unmounts
      provider.leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinRoom = useCallback(async (token: string, roomUrl: string): Promise<void> => {
    await getProvider().join(token, roomUrl);
  }, []);

  const leaveRoom = useCallback(async (): Promise<void> => {
    await getProvider().leave();
  }, []);

  const toggleMic = useCallback(async (): Promise<void> => {
    await getProvider().toggleMic();
  }, []);

  const toggleCamera = useCallback(async (): Promise<void> => {
    await getProvider().toggleCamera();
  }, []);

  return {
    ...state,
    joinRoom,
    leaveRoom,
    toggleMic,
    toggleCamera,
  };
}
