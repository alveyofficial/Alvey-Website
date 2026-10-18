/**
 * src/features/classroom/video/types.ts
 *
 * Provider-agnostic video room contract.
 * Zero runtime dependencies — pure TypeScript types only.
 *
 * Nothing outside of useVideoRoom.ts and providers/daily.ts
 * should need to import anything beyond this file.
 */

export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface MediaTrack {
  track: MediaStreamTrack | null;
  isEnabled: boolean;
}

export interface Participant {
  id: string;
  displayName: string;
  isLocal: boolean;
  isTutor: boolean;
  videoTrack: MediaTrack;
  audioTrack: MediaTrack;
  isScreenSharing: boolean;
}

export interface VideoRoomState {
  connectionState: ConnectionState;
  participants: Participant[];
  localParticipant: Participant | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  error: string | null;
}

export interface VideoRoomActions {
  joinRoom: (token: string, roomUrl: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
}

/** The shape returned by useVideoRoom() — what all UI components receive */
export type VideoRoomHook = VideoRoomState & VideoRoomActions;

/**
 * Provider interface — implemented by daily.ts, livekit.ts, etc.
 * Swap the provider in useVideoRoom.ts by returning a different implementation.
 */
export interface VideoRoomProvider {
  join(token: string, roomUrl: string): Promise<void>;
  leave(): Promise<void>;
  toggleMic(): Promise<void>;
  toggleCamera(): Promise<void>;
  getState(): VideoRoomState;
  /** Subscribe to state changes. Returns an unsubscribe function. */
  onStateChange(callback: (state: VideoRoomState) => void): () => void;
}
