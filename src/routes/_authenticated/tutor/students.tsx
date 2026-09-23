import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, BookMarked, MessageSquare, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/students")({
  component: TutorStudents,
});

function TutorStudents() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      const data = await DataStore.getStudentsForTutor(uid);
      setStudents(data);
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="My Students"
        description={`${students.length} student${students.length !== 1 ? "s" : ""} assigned to you`}
      />

      {students.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No matching students" : "No students assigned yet"}
          description={
            search
              ? "Try a different name or email."
              : "When admin assigns students to you, they'll appear here."
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.studentId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={s.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email || "No email on record"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.remainingClasses > 0
                        ? `${s.remainingClasses} classes remaining`
                        : "Classes: not set"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
                    <Link to="/tutor/homework">
                      <BookMarked className="h-3.5 w-3.5" /> Homework
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
                    <Link to="/tutor/chat">
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
