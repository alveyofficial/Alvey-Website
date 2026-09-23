import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, BookMarked, MessageSquare, Bell, Users, ChevronRight, Clock, Star } from "lucide-react";
import { PageHeader, StatCard, EmptyState, LoadingSpinner, StatusBadge, Avatar } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [stats, setStats] = useState({
    tutors: 0, upcomingLessons: 0, pendingHomework: 0, unreadMessages: 0,
  });
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [pendingHomework, setPendingHomework] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Review state (preserved from original)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<{ id: string; rating: number; comment: string } | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }

      const [record, assigns, lessons, homework, notifications, conversations] =
        await Promise.all([
          DataStore.getUserRecord(uid),
          DataStore.getStudentAssignments(uid),
          DataStore.getLessonsForStudent(uid),
          DataStore.getHomeworkForStudent(uid),
          DataStore.getNotifications(uid),
          DataStore.getConversationsForStudent(uid),
        ]);

      setStudentName(record?.displayName || userData.user?.name || "");
      setAssignments(assigns);

      const now = new Date();
      const upcoming = lessons
        .filter((l: any) => new Date(l.starts_at) > now && l.status !== "cancelled")
        .slice(0, 5);
      const pendingHw = homework.filter((h: any) => h.status === "assigned" || h.status === "late");
      const unreadMsgs = conversations.reduce((s: number, c: any) => s + (c.studentUnreadCount || 0), 0);

      setStats({
        tutors: assigns.length,
        upcomingLessons: upcoming.length,
        pendingHomework: pendingHw.length,
        unreadMessages: unreadMsgs,
      });
      setUpcomingLessons(upcoming);
      setPendingHomework(pendingHw.slice(0, 3));
      setRecentNotifications(notifications.slice(0, 4));
      setLoading(false);
    })();
  }, []);

  const submitReview = async () => {
    if (!selectedTutor || rating < 1) return;
    const tutorId = selectedTutor.tutor?.id || selectedTutor.tutorId;
    if (!tutorId) return;
    setSubmittingReview(true);
    try {
      const { data: userData } = await appwrite.auth.getUser();
      const user = userData.user;
      if (!user?.id) return;
      let reviewId: string;
      if (editingReview && submittedReview) {
        await DataStore.updateReview(submittedReview.id, { rating, comment });
        reviewId = submittedReview.id;
      } else {
        const rev = await DataStore.submitReview({
          student_id: user.id, student_name: user.name || "Student",
          tutor_id: tutorId, rating, comment,
        });
        reviewId = rev.id;
      }
      setSubmittedReview({ id: reviewId, rating, comment });
      setEditingReview(false);
      toast.success("Review submitted — pending approval.");
      setTimeout(() => setReviewOpen(false), 1500);
    } catch {
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${studentName ? `, ${studentName.split(" ")[0]}` : ""}`}
        description="Here's your learning overview."
      />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="My Tutors"          value={stats.tutors}          color="text-blue-600 bg-blue-50 dark:bg-blue-950/30" />
        <StatCard icon={Calendar}     label="Upcoming Lessons"   value={stats.upcomingLessons}  color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" />
        <StatCard icon={BookMarked}   label="Pending Homework"   value={stats.pendingHomework}  color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        <StatCard icon={MessageSquare}label="Unread Messages"    value={stats.unreadMessages}   color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
      </div>

      {/* Review prompt — preserved from original */}
      {assignments.length > 0 && (
        <Card>
          <CardContent className="p-5">
            {submittedReview && !editingReview ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold">Your review for {assignments[0]?.tutor?.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= submittedReview.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pending approval.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setRating(submittedReview.rating); setComment(submittedReview.comment); setEditingReview(true); setSelectedTutor(assignments[0]); setReviewOpen(true); }}>
                  Edit Review
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold">How's learning with {assignments[0]?.tutor?.name || "your tutor"}?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Share your experience to help others.</p>
                </div>
                <Button size="sm" className="gap-2 shrink-0" onClick={() => { setSelectedTutor(assignments[0]); setRating(0); setComment(""); setEditingReview(false); setReviewOpen(true); }}>
                  <Star className="h-4 w-4" /> Submit Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming lessons */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Lessons</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/student/schedule">View all <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingLessons.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming lessons" description="Your scheduled lessons will appear here." />
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <Avatar name={l.tutorName || "Tutor"} src={l.tutorAvatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.tutorName || "Tutor"}</p>
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

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending homework */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Homework Due</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/student/homework">All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingHomework.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No pending homework.</p>
              ) : (
                <div className="space-y-2">
                  {pendingHomework.map((h: any) => (
                    <div key={h.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{h.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.tutorName}{h.dueDate ? ` · Due ${new Date(h.dueDate).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={h.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/student/notifications">All <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">You're all caught up.</p>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.map((n: any) => (
                    <div key={n.id} className={`p-2 rounded-lg border text-sm ${!n.is_read ? "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20" : ""}`}>
                      <p className="font-medium text-sm leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My Tutors",   href: "/student/my-tutors",   icon: Users },
          { label: "Homework",    href: "/student/homework",    icon: BookMarked },
          { label: "Chat",        href: "/student/chat",        icon: MessageSquare },
          { label: "Recordings",  href: "/student/recordings",  icon: Bell },
        ].map(({ label, href, icon: Icon }) => (
          <Button key={href} variant="outline" className="h-14 flex-col gap-1 text-sm" asChild>
            <Link to={href}><Icon className="h-5 w-5" />{label}</Link>
          </Button>
        ))}
      </div>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReview ? "Edit Your Review" : "Submit a Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Reviewing <span className="font-medium text-foreground">{selectedTutor?.tutor?.name || "your tutor"}</span>
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}>
                    <Star className={`h-7 w-7 transition-colors ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your experience with this tutor…"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={rating === 0 || submittingReview}
              onClick={submitReview}
            >
              {submittingReview ? "Submitting…" : editingReview ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
