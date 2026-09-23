import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Calendar, Star, Bell, DollarSign, BookMarked,
  MessageSquare, Video, ChevronRight, Clock,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState, LoadingSpinner, StatusBadge, Avatar } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/")({
  component: TutorDashboard,
});

function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState("");
  const [stats, setStats] = useState({
    students: 0,
    upcomingLessons: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    avgRating: 0,
    pendingEarnings: 0,
  });
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [pendingHomework, setPendingHomework] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setTutorId(uid);
      setTutorName(userData.user?.name || "Tutor");

      const [students, lessons, notifications, tutor, homework, payments, conversations] =
        await Promise.all([
          DataStore.getStudentsForTutor(uid),
          DataStore.getLessonsForTutor(uid),
          DataStore.getNotifications(uid),
          DataStore.getTutorById(uid),
          DataStore.getHomeworkForTutor(uid),
          DataStore.getPaymentsForTutor(uid),
          DataStore.getConversationsForTutor(uid),
        ]);

      const now = new Date();
      const upcoming = lessons
        .filter((l: any) => new Date(l.starts_at) > now && l.status !== "cancelled")
        .slice(0, 5);

      const unreadMsgs = conversations.reduce(
        (sum: number, c: any) => sum + (c.tutorUnreadCount || 0), 0
      );
      const unreadNotifs = notifications.filter((n: any) => !n.is_read).length;
      const pendingPay = payments
        .filter((p: any) => p.status === "pending")
        .reduce((sum: number, p: any) => sum + (p.amountGbp || 0), 0);
      const submittedHw = homework.filter((h: any) => h.status === "submitted" || h.status === "late").length;

      setStats({
        students: students.length,
        upcomingLessons: upcoming.length,
        unreadMessages: unreadMsgs,
        unreadNotifications: unreadNotifs,
        avgRating: tutor?.rating_avg || 0,
        pendingEarnings: pendingPay,
      });
      setUpcomingLessons(upcoming);
      setRecentNotifications(notifications.slice(0, 5));
      setPendingHomework(submittedHw);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${tutorName ? `, ${tutorName.split(" ")[0]}` : ""}`}
        description="Here's your teaching overview for today."
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users}         label="Active Students"      value={stats.students}       color="text-blue-600 bg-blue-50 dark:bg-blue-950/30" />
        <StatCard icon={Calendar}      label="Upcoming Lessons"     value={stats.upcomingLessons} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" />
        <StatCard icon={BookMarked}    label="Submissions to Review" value={pendingHomework}       color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={MessageSquare} label="Unread Messages"      value={stats.unreadMessages}  color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard icon={Star}          label="Average Rating"       value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} color="text-purple-600 bg-purple-50 dark:bg-purple-950/30" />
        <StatCard icon={DollarSign}    label="Pending Earnings (£)" value={stats.pendingEarnings ? `£${stats.pendingEarnings.toFixed(2)}` : "£0.00"} color="text-rose-600 bg-rose-50 dark:bg-rose-950/30" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Lessons */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Lessons</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tutor/schedule">View all <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingLessons.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming lessons" description="Your scheduled lessons will appear here." />
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <Avatar name={l.studentName || "Student"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.studentName || "Student"}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.subject || "Lesson"}{l.academic_level ? ` · ${l.academic_level}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />{fmt(l.starts_at)}
                      </p>
                    </div>
                    <StatusBadge status={l.status || "scheduled"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tutor/notifications">All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentNotifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-sm ${!n.is_read ? "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20" : ""}`}
                  >
                    <p className="font-medium text-sm leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My Students",  href: "/tutor/students",   icon: Users },
          { label: "Homework",     href: "/tutor/homework",   icon: BookMarked },
          { label: "Chat",         href: "/tutor/chat",       icon: MessageSquare },
          { label: "Recordings",   href: "/tutor/recordings", icon: Video },
        ].map(({ label, href, icon: Icon }) => (
          <Button key={href} variant="outline" className="h-14 flex-col gap-1 text-sm" asChild>
            <Link to={href}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
