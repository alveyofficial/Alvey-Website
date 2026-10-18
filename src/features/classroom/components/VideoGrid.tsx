/**
 * src/features/classroom/components/VideoGrid.tsx
 *
 * Renders participant video tiles in a responsive grid.
 * Consumes the agnostic Participant[] array from useVideoRoom() — no SDK imports.
 */

import type { Participant } from "../video/types";
import { VideoTile } from "./VideoTile";

interface VideoGridProps {
  participants: Participant[];
}

function gridColsClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

export function VideoGrid({ participants }: VideoGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-500 text-sm">
        Waiting for participants to join…
      </div>
    );
  }

  return (
    <div
      className={`grid ${gridColsClass(participants.length)} gap-3 flex-1`}
      role="region"
      aria-label="Video participants"
    >
      {participants.map((p) => (
        <VideoTile key={p.id} participant={p} />
      ))}
    </div>
  );
}
