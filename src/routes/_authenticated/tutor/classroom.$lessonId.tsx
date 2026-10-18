/**
 * src/routes/_authenticated/tutor/classroom.$lessonId.tsx
 *
 * Tutor-facing classroom page.
 * Joins the session as role="tutor" and renders the full ClassroomLayout.
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
  "/_authenticated/tutor/classroom/$lessonId",
)({
  head: () => ({
    meta: [
      { title: "Live Session · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TutorClassroomPage,
});

function TutorClassroomPage() {
  const { lessonId } = useParams({
    from: "/_authenticated/tutor/classroom/$lessonId",
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
        await session.startSession(lessonId, "tutor");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const goBack = () => void navigate({ to: "/tutor" });

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
        <button onClick={goBack} className="text-blue-400 text-sm underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  // ── Ended ────────────────────────────────────────────────────────────────
  if (session.sessionStatus === "ended") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-300 font-medium text-lg">Session ended</p>
        <p className="text-zinc-500 text-sm">Post-class notes will be available for your student shortly.</p>
        <button onClick={goBack} className="text-blue-400 text-sm underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  // ── Active classroom ─────────────────────────────────────────────────────
  return (
    <ClassroomLayout
      lessonId={lessonId}
      role="tutor"
      session={session}
      onLeave={() => void navigate({ to: "/tutor" })}
      aiMessages={messages}
      onAskQuestion={askQuestion}
    />
  );
}
