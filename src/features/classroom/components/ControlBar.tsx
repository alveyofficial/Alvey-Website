/**
 * src/features/classroom/components/ControlBar.tsx
 *
 * Mic / camera / leave controls for the classroom.
 * Only calls hook action callbacks — zero SDK imports.
 */

import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConnectionState } from "../video/types";

interface ControlBarProps {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  connectionState: ConnectionState;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

export function ControlBar({
  isMicEnabled,
  isCameraEnabled,
  connectionState,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: ControlBarProps) {
  const isConnecting = connectionState === "connecting";
  const isConnected = connectionState === "connected";

  return (
    <div
      className="flex items-center justify-center gap-3 py-3 px-4 bg-zinc-900 rounded-xl border border-zinc-800"
      role="toolbar"
      aria-label="Session controls"
    >
      {/* Mic toggle */}
      <Button
        variant={isMicEnabled ? "secondary" : "destructive"}
        size="icon"
        disabled={!isConnected}
        onClick={onToggleMic}
        title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
        aria-label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
        aria-pressed={!isMicEnabled}
        className="h-11 w-11 rounded-full"
      >
        {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      {/* Camera toggle */}
      <Button
        variant={isCameraEnabled ? "secondary" : "destructive"}
        size="icon"
        disabled={!isConnected}
        onClick={onToggleCamera}
        title={isCameraEnabled ? "Stop camera" : "Start camera"}
        aria-label={isCameraEnabled ? "Stop camera" : "Start camera"}
        aria-pressed={!isCameraEnabled}
        className="h-11 w-11 rounded-full"
      >
        {isCameraEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      {/* Connecting indicator */}
      {isConnecting && (
        <div
          className="flex items-center gap-1.5 text-xs text-zinc-400 px-2"
          aria-live="polite"
          aria-label="Connecting to session"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Connecting…
        </div>
      )}

      {/* Leave button — always enabled */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeave}
        title="Leave session"
        aria-label="Leave session"
        className="h-11 w-11 rounded-full ml-3"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
