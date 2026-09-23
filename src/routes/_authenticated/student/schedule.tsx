import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/schedule")({
  component: StudentSchedule,
});

type ViewMode = "day" | "week" | "month";

function StudentSchedule() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const data = await DataStore.getLessonsForStudent(uid);
        setLessons(data);
      }
      setLoading(false);
    })();
  }, []);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const d = new Date(l.starts_at);
      if (viewMode === "day") return d.toDateString() === currentDate.toDateString();
      if (viewMode === "week") {
        const ws = new Date(currentDate); ws.setDate(ws.getDate() - ws.getDay());
        const we = new Date(ws); we.setDate(we.getDate() + 7);
        return d >= ws && d < we;
      }
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [lessons, currentDate, viewMode]);

  const formatRange = () => {
    if (viewMode === "day") return currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (viewMode === "week") {
      const s = new Date(currentDate); s.setDate(s.getDate() - s.getDay());
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return `${s.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const duration = (s: string, e: string) => {
    const m = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`;
  };

  const grouped: Record<string, any[]> = {};
  filtered.forEach((l) => {
    const k = new Date(l.starts_at).toDateString();
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(l);
  });
  const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Schedule" description={`All times in ${userTz}`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[200px] text-center">{formatRange()}</span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          {(["day", "week", "month"] as ViewMode[]).map((m) => (
            <Button key={m} variant={viewMode === m ? "default" : "ghost"} size="sm" onClick={() => setViewMode(m)} className="capitalize">{m}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No lessons" description={`No lessons scheduled for this ${viewMode}.`} />
      ) : (
        <div className="space-y-6">
          {sortedKeys.map((dateKey) => (
            <div key={dateKey}>
              {viewMode !== "day" && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {fmtDate(grouped[dateKey][0].starts_at)}
                </p>
              )}
              <div className="space-y-3">
                {grouped[dateKey].map((l: any) => (
                  <Card key={l.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={l.tutorName || "Tutor"} src={l.tutorAvatar} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{l.tutorName || "Tutor"}</p>
                          <p className="text-sm text-muted-foreground">
                            {l.subject || "Lesson"}{l.academic_level ? ` · ${l.academic_level}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {fmtTime(l.starts_at)} – {fmtTime(l.ends_at)}
                            <span className="text-muted-foreground/60 ml-1">({duration(l.starts_at, l.ends_at)})</span>
                          </p>
                          {l.notes && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{l.notes}</p>}
                        </div>
                      </div>
                      <StatusBadge status={l.status || "scheduled"} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
