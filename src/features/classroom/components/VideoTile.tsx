/**
 * src/features/classroom/components/VideoTile.tsx
 *
 * Renders a single participant's video stream.
 * Consumes only the agnostic Participant type — zero video SDK imports.
 */

import { useEffect, useRef } from "react";
import type { Participant } from "../video/types";

interface VideoTileProps {
  participant: Participant;
}

export function VideoTile({ participant }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    const track = participant.videoTrack.track;
    if (!el || !track) return;

    el.srcObject = new MediaStream([track]);

    return () => {
      el.srcObject = null;
    };
  }, [participant.videoTrack.track]);

  const hasVideo =
    participant.videoTrack.isEnabled && participant.videoTrack.track !== null;

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center">
      {/* Video element — always rendered so the ref is available */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal} // never echo local audio
        className={`w-full h-full object-cover ${hasVideo ? "block" : "hidden"}`}
        aria-label={`Video feed for ${participant.displayName}`}
      />

      {/* Avatar placeholder when video is off */}
      {!hasVideo && (
        <div
          className="flex flex-col items-center gap-2 text-zinc-400"
          aria-label={`${participant.displayName} has camera off`}
        >
          <div className="h-14 w-14 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold text-white uppercase select-none">
            {participant.displayName[0] ?? "?"}
          </div>
          <span className="text-xs">{participant.displayName}</span>
        </div>
      )}

      {/* Name + mute overlay */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1.5">
        {!participant.audioTrack.isEnabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3 text-red-400"
            aria-label="Muted"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
        <span>{participant.displayName}{participant.isLocal ? " (You)" : ""}</span>
        {participant.isTutor && (
          <span className="bg-blue-600 text-white text-[10px] px-1 rounded">Tutor</span>
        )}
      </div>
    </div>
  );
}
