import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Star, MessageSquare, ExternalLink } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/my-tutors")({
  component: StudentMyTutors,
});

function StudentMyTutors() {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        setStudentId(uid);
        const data = await DataStore.getStudentAssignments(uid);
        setAssignments(data);
      }
      setLoading(false);
    })();
  }, []);

  const handleStartChat = async (tutorId: string) => {
    if (!studentId) return;
    setStartingChat(tutorId);
    try {
      await DataStore.getOrCreateConversation(studentId, tutorId);
      toast.success("Conversation opened.");
      navigate({ to: "/student/chat" });
    } catch {
      toast.error("Failed to start conversation.");
    } finally {
      setStartingChat(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="My Tutors"
        description={`${assignments.length} tutor${assignments.length !== 1 ? "s" : ""} assigned to your account`}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tutors assigned yet"
          description="Once Alvey assigns a tutor to your account, they'll appear here with their full profile."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {assignments.map((a: any) => {
            const tutor = a.tutor;
            if (!tutor) return null;
            const tutorId = tutor.id || a.tutorId;
            return (
              <Card key={a.$id || tutorId} className="overflow-hidden">
                {/* Header */}
                <div className="p-5 flex items-start gap-4 border-b">
                  <Avatar name={tutor.name || "Tutor"} src={tutor.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-base">{tutor.name}</p>
                        {tutor.headline && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{tutor.headline}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {tutor.is_verified && <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>}
                        {tutor.is_featured && <Badge className="bg-amber-500 text-white text-xs">Featured</Badge>}
                      </div>
                    </div>
                    {tutor.rating_avg > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{tutor.rating_avg.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({tutor.rating_count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {tutor.about && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">About</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{tutor.about}</p>
                    </div>
                  )}

                  {tutor.subjects?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.subjects.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tutor.levels?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Levels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.levels.map((l: string) => (
                          <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tutor.languages?.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      🌐 {tutor.languages.join(", ")}
                    </p>
                  )}

                  {a.remainingClasses > 0 && (
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      {a.remainingClasses} class{a.remainingClasses !== 1 ? "es" : ""} remaining
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={startingChat === tutorId}
                      onClick={() => handleStartChat(tutorId)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {startingChat === tutorId ? "Opening…" : "Message"}
                    </Button>
                    {tutor.slug && (
                      <Button size="sm" variant="outline" className="gap-1.5" asChild>
                        <a href={`/tutors/${tutor.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Profile
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
