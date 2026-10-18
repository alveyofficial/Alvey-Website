/**
 * src/features/classroom/video/providers/daily.ts
 *
 * ⚠️  THIS IS THE ONLY FILE IN THE ENTIRE FRONTEND ALLOWED TO IMPORT @daily-co/daily-js.
 *
 * All UI components and hooks must go through useVideoRoom() instead.
 * Enforced by the ESLint no-restricted-imports rule in eslint.config.js.
 *
 * To migrate to LiveKit later:
 *   1. Create providers/livekit.ts implementing the same VideoRoomProvider interface.
 *   2. In useVideoRoom.ts, change the single import line from DailyProvider to LiveKitProvider.
 *   3. Delete (or archive) this file.
 */

import DailyIframe, {
  type DailyCall,
  type DailyParticipant,
  type DailyEventObjectParticipant,
  type DailyEventObjectParticipantLeft,
  type DailyEventObjectParticipants,
  type DailyEventObjectNoPayload,
  type DailyEventObjectFatalError,
} from "@daily-co/daily-js";
import type {
  VideoRoomProvider,
  VideoRoomState,
  Participant,
  ConnectionState,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDailyParticipant(p: DailyParticipant, isLocal: boolean): Participant {
  const videoState = p.tracks?.video;
  const audioState = p.tracks?.audio;

  // prefer persistentTrack (non-destructive) then fall back to the live track
  const videoTrack =
    (videoState?.persistentTrack ?? videoState?.track ?? null) as MediaStreamTrack | null;
  const audioTrack =
    (audioState?.persistentTrack ?? audioState?.track ?? null) as MediaStreamTrack | null;

  return {
    id: p.session_id,
    displayName: p.user_name || (isLocal ? "You" : "Participant"),
    isLocal,
    // Convention: tutor's user_name contains the word "tutor" (set by the Cloud Function token)
    isTutor: (p.user_name ?? "").toLowerCase().includes("tutor"),
    videoTrack: {
      track: videoTrack,
      isEnabled: videoState?.state === "playable",
    },
    audioTrack: {
      track: audioTrack,
      isEnabled: audioState?.state === "playable",
    },
    isScreenSharing: false,
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE: VideoRoomState = {
  connectionState: "idle",
  participants: [],
  localParticipant: null,
  isMicEnabled: true,
  isCameraEnabled: true,
  error: null,
};

// ---------------------------------------------------------------------------
// DailyProvider
// ---------------------------------------------------------------------------

export class DailyProvider implements VideoRoomProvider {
  private call: DailyCall | null = null;
  private state: VideoRoomState = { ...INITIAL_STATE };
  private listeners = new Set<(state: VideoRoomState) => void>();

  // ── Internal state management ──────────────────────────────────────────

  private emit(): void {
    const snapshot: VideoRoomState = {
      ...this.state,
      participants: [...this.state.participants],
    };
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private patch(update: Partial<VideoRoomState>): void {
    this.state = { ...this.state, ...update };
    this.emit();
  }

  private setConnectionState(connectionState: ConnectionState): void {
    this.patch({ connectionState });
  }

  private syncParticipants(): void {
    if (!this.call) return;
    const raw = this.call.participants();
    const participants = Object.entries(raw).map(([key, p]) =>
      mapDailyParticipant(p, key === "local"),
    );
    const localParticipant = participants.find((p) => p.isLocal) ?? null;
    this.patch({ participants, localParticipant });
  }

  // ── VideoRoomProvider implementation ───────────────────────────────────

  async join(token: string, roomUrl: string): Promise<void> {
    // Clean up any existing call first
    if (this.call) await this.leave();

    this.patch({ connectionState: "connecting", error: null });

    this.call = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: true,
    });

    // ── Event bindings ──────────────────────────────────────────────────

    this.call.on("joined-meeting", (_e: DailyEventObjectParticipants | undefined) => {
      this.syncParticipants();
      this.patch({
        connectionState: "connected",
        isMicEnabled: this.call?.localAudio() ?? true,
        isCameraEnabled: this.call?.localVideo() ?? true,
      });
    });

    this.call.on("participant-joined", (_e: DailyEventObjectParticipant | undefined) => {
      this.syncParticipants();
    });

    this.call.on("participant-updated", (_e: DailyEventObjectParticipant | undefined) => {
      this.syncParticipants();
      this.patch({
        isMicEnabled: this.call?.localAudio() ?? this.state.isMicEnabled,
        isCameraEnabled: this.call?.localVideo() ?? this.state.isCameraEnabled,
      });
    });

    this.call.on("participant-left", (_e: DailyEventObjectParticipantLeft | undefined) => {
      this.syncParticipants();
    });

    this.call.on("left-meeting", (_e: DailyEventObjectNoPayload | undefined) => {
      this.patch({
        connectionState: "disconnected",
        participants: [],
        localParticipant: null,
      });
    });

    this.call.on("error", (e: DailyEventObjectFatalError | undefined) => {
      this.patch({
        connectionState: "error",
        error: e?.errorMsg ?? "Unknown video error",
      });
    });

    try {
      await this.call.join({ url: roomUrl, token });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.patch({ connectionState: "error", error: msg });
      throw err;
    }
  }

  async leave(): Promise<void> {
    if (!this.call) return;
    try {
      await this.call.leave();
      await this.call.destroy();
    } finally {
      this.call = null;
      this.patch({ ...INITIAL_STATE });
    }
  }

  async toggleMic(): Promise<void> {
    if (!this.call) return;
    const next = !this.call.localAudio();
    await this.call.setLocalAudio(next);
    this.patch({ isMicEnabled: next });
  }

  async toggleCamera(): Promise<void> {
    if (!this.call) return;
    const next = !this.call.localVideo();
    await this.call.setLocalVideo(next);
    this.patch({ isCameraEnabled: next });
  }

  getState(): VideoRoomState {
    return { ...this.state, participants: [...this.state.participants] };
  }

  onStateChange(callback: (state: VideoRoomState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
