/**
 * src/features/classroom/components/ClassroomLayout.tsx
 *
 * Top-level classroom composer.
 * Imports ZERO video SDK symbols — only consumes hook outputs and sub-components.
 * Self-contained: can be mounted on any route or subdomain.
 *
 * onLeave callback is passed in from the route so ClassroomLayout has
 * no knowledge of routing paths — it's 100% portable.
 */

import { VideoGrid } from "./VideoGrid";
import { ControlBar } from "./ControlBar";
import { AiChatSidebar, type AiMessage } from "./AiChatSidebar";
import type { UseClassSessionReturn } from "../hooks/useClassSession";

interface ClassroomLayoutProps {
  lessonId: string;
  role: "tutor" | "student";
  session: UseClassSessionReturn;
  /** Called after endSession() completes — route handles navigation */
  onLeave: () => void;
  aiMessages?: AiMessage[];
  onAskQuestion?: (question: string) => Promise<void>;
}

export function ClassroomLayout({
  lessonId: _lessonId,
  role: _role,
  session,
  onLeave,
  aiMessages = [],
  onAskQuestion = async () => {},
}: ClassroomLayoutProps) {
  const handleLeave = async () => {
    await session.endSession();
    onLeave();
  };

  return (
    <div
      className="flex h-screen bg-zinc-950 overflow-hidden"
      aria-label="Live classroom session"
    >
      {/* ── Main video area ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 p-4 gap-4">
        {/* Error banner */}
        {session.error && (
          <div
            role="alert"
            className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="font-medium">Error:</span>
            {session.error}
          </div>
        )}

        {/* Video grid — takes all available vertical space */}
        <VideoGrid participants={session.participants} />

        {/* Control bar — anchored to bottom */}
        <ControlBar
          isMicEnabled={session.isMicEnabled}
          isCameraEnabled={session.isCameraEnabled}
          connectionState={session.connectionState}
          onToggleMic={() => void session.toggleMic()}
          onToggleCamera={() => void session.toggleCamera()}
          onLeave={() => void handleLeave()}
        />
      </div>

      {/* ── AI Chat Sidebar ─────────────────────────────────────── */}
      <aside
        className="w-80 shrink-0 flex flex-col h-full"
        aria-label="AI assistant chat"
      >
        <AiChatSidebar
          sessionId={session.sessionId}
          messages={aiMessages}
          onAskQuestion={onAskQuestion}
        />
      </aside>
    </div>
  );
}
