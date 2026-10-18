/**
 * src/routes/_authenticated/student/lessons.tsx
 *
 * Lists the student's scheduled lessons with a "Join Session" button
 * that links to the live classroom route.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video, Clock, BookOpen, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState, LoadingSpinner } from "@/components/portal-shared";
import { DataStore } from "@/lib/data-store";
import { firebase, db } from "@/integrations/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { PostClassSummary } from "@/features/classroom/components/PostClassSummary";

export const Route = createFileRoute("/_authenticated/student/lessons")({
  head: () => ({
    meta: [
      { title: "My Lessons · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: StudentLessonsPage,
});

/** Returns true if the lesson is joinable right now (within 15 min of start time). */
function isJoinable(lesson: { starts_at?: string; status?: string }): boolean {
  if (!lesson.starts_at) return lesson.status === "confirmed" || lesson.status === "scheduled";
  const start = new Date(lesson.starts_at).getTime();
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;
  // Allow joining 15 minutes before until 2 hours after start
  return now >= start - fifteenMin && now <= start + 2 * 60 * 60 * 1000;
}

function formatLessonTime(starts_at?: string, ends_at?: string): string {
  if (!starts_at) return "TBD";
  const start = new Date(starts_at);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  if (ends_at) {
    const end = new Date(ends_at);
    return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return start.toLocaleString(undefined, opts);
}

function lessonStatusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
    case "scheduled":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function StudentLessonsPage() {
  const [lessons, setLessons] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await firebase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        const results = await DataStore.getLessonsForStudent(uid);
        setLessons(results);
      }
      setLoading(false);
    })();
  }, []);

  const [endedSessions, setEndedSessions] = useState<Array<{ id: string; lessonId?: string; subject?: string }>>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await firebase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;

      const q = query(
        collection(db, "sessions"),
        where("studentId", "==", uid),
        where("status", "==", "ended"),
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const sessions = snap.docs.map((d) => ({
          id: d.id,
          lessonId: d.data().lessonId as string | undefined,
          subject: d.data().subject as string | undefined,
        }));
        setEndedSessions(sessions);
      });

      return unsubscribe;
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Lessons"
        description="Join your scheduled live sessions or review completed ones."
      />

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons scheduled"
          description="Your confirmed lessons will appear here with a Join button when it's time to start."
        />
      ) : (
        <div className="space-y-4">
          {(lessons as Array<{
            id: string;
            subject?: string;
            starts_at?: string;
            ends_at?: string;
            tutorName?: string;
            status?: string;
            academic_level?: string;
          }>).map((lesson) => {
            const joinable = isJoinable(lesson);
            return (
              <Card key={lesson.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {lesson.subject ?? "Lesson"}
                        {lesson.academic_level && (
                          <span className="text-muted-foreground font-normal ml-1.5 text-sm">
                            · {lesson.academic_level}
                          </span>
                        )}
                      </CardTitle>
                      {lesson.tutorName && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          with {lesson.tutorName}
                        </p>
                      )}
                    </div>
                    <Badge variant={lessonStatusVariant(lesson.status)} className="capitalize shrink-0">
                      {lesson.status ?? "scheduled"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {formatLessonTime(lesson.starts_at, lesson.ends_at)}
                  </div>

                  {(lesson.status === "confirmed" || lesson.status === "scheduled") && (
                    <Button
                      asChild
                      size="sm"
                      variant={joinable ? "default" : "outline"}
                      className="gap-2 shrink-0"
                    >
                      <Link
                        to="/student/classroom/$lessonId"
                        params={{ lessonId: lesson.id }}
                      >
                        <Video className="h-4 w-4" aria-hidden="true" />
                        {joinable ? "Join Session" : "Preview Room"}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Sessions */}
      {endedSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Past Sessions</h2>
          </div>
          <div className="space-y-4">
            {endedSessions.map((session) => (
              <PostClassSummary
                key={session.id}
                sessionId={session.id}
                subject={session.subject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
