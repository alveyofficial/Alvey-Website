/**
 * src/routes/_authenticated/student/classroom.$lessonId.tsx
 *
 * Student-facing classroom page.
 * Joins the session as role="student" and renders the full ClassroomLayout.
 */

import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { firebase } from "@/integrations/firebase/client";
import { useClassSession } from "@/features/classroom/hooks/useClassSession";
import { useAiChat } from "@/features/classroom/hooks/useAiChat";
import { useLiveNotifications } from "@/features/classroom/hooks/useLiveNotifications";
import { ClassroomLayout } from "@/features/classroom/components/ClassroomLayout";
import { LoadingSpinner } from "@/components/portal-shared";

export const Route = createFileRoute(
  "/_authenticated/student/classroom/$lessonId",
)({
  head: () => ({
    meta: [
      { title: "Live Session · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: StudentClassroomPage,
});

function StudentClassroomPage() {
  const { lessonId } = useParams({
    from: "/_authenticated/student/classroom/$lessonId",
  });
  const navigate = useNavigate();
  const session = useClassSession();
  const { messages, askQuestion } = useAiChat(session.sessionId);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useLiveNotifications({ sessionId: session.sessionId, currentUserId });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await firebase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      setCurrentUserId(data.user.id);
      if (!cancelled && session.sessionStatus === "idle") {
        await session.startSession(lessonId, "student");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // ── Loading / connecting ─────────────────────────────────────────────────
  if (session.sessionStatus === "idle" || session.sessionStatus === "loading") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-zinc-400 text-sm">Setting up your session…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (session.sessionStatus === "error") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-red-400 font-medium">Failed to join session</p>
        <p className="text-zinc-500 text-sm">{session.sessionError}</p>
        <button
          onClick={() => void navigate({ to: "/student/lessons" })}
          className="text-blue-400 text-sm underline"
        >
          Back to lessons
        </button>
      </div>
    );
  }

  // ── Ended ────────────────────────────────────────────────────────────────
  if (session.sessionStatus === "ended") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-300 font-medium text-lg">Session ended</p>
        <p className="text-zinc-500 text-sm">Post-class notes will appear shortly in your lessons page.</p>
        <button
          onClick={() => void navigate({ to: "/student/lessons" })}
          className="text-blue-400 text-sm underline"
        >
          Back to lessons
        </button>
      </div>
    );
  }

  // ── Active classroom ─────────────────────────────────────────────────────
  return (
    <ClassroomLayout
      lessonId={lessonId}
      role="student"
      session={session}
      onLeave={() => void navigate({ to: "/student/lessons" })}
      aiMessages={messages}
      onAskQuestion={askQuestion}
    />
  );
}
