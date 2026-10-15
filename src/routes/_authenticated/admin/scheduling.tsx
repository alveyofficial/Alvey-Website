import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, Plus, X, AlertCircle, CheckCircle, Users, Receipt } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import type { UserRecord, Tutor, Booking } from "@/lib/data-store";
import { firebase, getCurrentUser } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/admin/scheduling")({
  component: AdminScheduling,
});

interface Lesson {
  id: string;
  tutor_id: string;
  student_id: string;
  subject?: string;
  academic_level?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes?: string;
  student?: { display_name: string };
  tutor?: { display_name: string };
}

function AdminScheduling() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [students, setStudents] = useState<UserRecord[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);

  // Pending receipts
  const [receipts, setReceipts] = useState<Booking[]>([]);
  const [moderating, setModerating] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const [form, setForm] = useState({
    student_id: "",
    tutor_id: "",
    date: "",
    start_time: "",
    end_time: "",
    subject: "",
    academic_level: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allLessons, allStudents, allTutors, subjs, lvls, pendingReceipts] = await Promise.all([
      DataStore.getAllLessons(),
      DataStore.getAllStudents(),
      DataStore.getAllTutors(),
      DataStore.getSubjects(),
      DataStore.getLevels(),
      DataStore.getAllPendingReceipts(),
    ]);
    setLessons(allLessons);
    setStudents(allStudents);
    setTutors(allTutors);
    setSubjects(subjs);
    setLevels(lvls);
    setReceipts(pendingReceipts);
    setLoading(false);
  };

  const checkConflicts = (
    tutorId: string,
    startsAt: string,
    endsAt: string,
    excludeId?: string,
  ) => {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();
    return lessons.filter((l) => {
      if (l.id === excludeId) return false;
      if (l.tutor_id !== tutorId) return false;
      if (l.status === "cancelled") return false;
      const lStart = new Date(l.starts_at).getTime();
      const lEnd = new Date(l.ends_at).getTime();
      return start < lEnd && end > lStart;
    });
  };

  const handleCreateTime = async () => {
    if (!form.student_id || !form.tutor_id || !form.date || !form.start_time || !form.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startsAt = new Date(`${form.date}T${form.start_time}`).toISOString();
    const endsAt = new Date(`${form.date}T${form.end_time}`).toISOString();

    if (new Date(startsAt) >= new Date(endsAt)) {
      toast.error("End time must be after start time");
      return;
    }

    const conflicts = checkConflicts(form.tutor_id, startsAt, endsAt);
    if (conflicts.length > 0) {
      setConflict(`This tutor has a scheduling conflict with another lesson at this time.`);
      return;
    }

    const { data: userData } = await firebase.auth.getUser();
    const result = await DataStore.createLesson({
      tutor_id: form.tutor_id,
      student_id: form.student_id,
      starts_at: startsAt,
      ends_at: endsAt,
      subject: form.subject,
      academic_level: form.academic_level,
      notes: form.notes,
      created_by: userData.user?.id,
    });

    if (result) {
      toast.success("Lesson created and notifications sent");
      setShowCreate(false);
      setForm({
        student_id: "",
        tutor_id: "",
        date: "",
        start_time: "",
        end_time: "",
        subject: "",
        academic_level: "",
        notes: "",
      });
      setConflict(null);
      loadData();
    } else {
      toast.error("Failed to create lesson");
    }
  };

  const handleCancel = async (id: string) => {
    await DataStore.cancelLesson(id);
    toast.success("Lesson cancelled");
    loadData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await DataStore.updateLessonStatus(id, status);
    toast.success(`Lesson marked as ${status}`);
    loadData();
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApproveReceipt = async (bookingId: string) => {
    setModerating(bookingId);
    try {
      await DataStore.moderateReceipt(bookingId, "approve");
      setReceipts((prev) => prev.filter((r) => r.id !== bookingId));
      toast.success("Receipt approved — booking confirmed.");
    } catch {
      toast.error("Failed to approve receipt.");
    } finally {
      setModerating(null);
    }
  };

  const handleRejectReceipt = async () => {
    if (!rejectDialogId) return;
    setModerating(rejectDialogId);
    try {
      await DataStore.moderateReceipt(rejectDialogId, "reject", adminNote || undefined);
      setReceipts((prev) => prev.filter((r) => r.id !== rejectDialogId));
      toast.success("Receipt rejected — student notified to re-upload.");
    } catch {
      toast.error("Failed to reject receipt.");
    } finally {
      setModerating(null);
      setRejectDialogId(null);
      setAdminNote("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Scheduling"
        description="View, create, and manage all scheduled lessons across the platform."
        action={
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Schedule Lesson
          </Button>
        }
      />

      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="receipts" className="gap-2">
            Pending Receipts
            {receipts.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {receipts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Lessons tab ── */}
        <TabsContent value="lessons">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : lessons.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Lessons"
              description="No lessons have been scheduled yet."
              action={
                <Button className="gap-2" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" /> Schedule Lesson
                </Button>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {lessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{l.subject || "Untitled Lesson"}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.student?.display_name || "Student"} with{" "}
                            {l.tutor?.display_name || "Tutor"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {formatDateTime(l.starts_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={l.status} />
                        {l.status === "scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(l.id, "completed")}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleCancel(l.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Pending Receipts tab ── */}
        <TabsContent value="receipts">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Pending Receipts"
              description="Payment receipts awaiting verification will appear here."
            />
          ) : (
            <div className="space-y-3">
              {receipts.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {r.referenceCode}
                          </Badge>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {r.studentName} → {r.tutorName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {r.preferredDate} at {r.preferredTime}
                        </p>
                        {r.receiptUploadedAt && (
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(r.receiptUploadedAt as any).toLocaleString?.() ?? r.receiptUploadedAt}
                          </p>
                        )}
                        {r.receiptUrl && (
                          <a
                            href={r.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                          >
                            <Receipt className="h-3 w-3" /> View Receipt
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={moderating === r.id}
                          onClick={() => handleApproveReceipt(r.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {moderating === r.id ? "Approving…" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={moderating === r.id}
                          onClick={() => { setRejectDialogId(r.id); setAdminNote(""); }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Reject dialog ── */}
      <Dialog open={!!rejectDialogId} onOpenChange={(open) => { if (!open) { setRejectDialogId(null); setAdminNote(""); } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reject Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The student will be notified and asked to re-upload their payment receipt.
            </p>
            <div className="space-y-1.5">
              <Label>Rejection reason (optional)</Label>
              <Textarea
                placeholder="e.g. Image is unclear, wrong amount shown…"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogId(null); setAdminNote(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectReceipt} disabled={!!moderating}>
              {moderating ? "Rejecting…" : "Reject Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setConflict(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm({ ...form, student_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id as string} value={s.id as string}>
                      {(s.name || s.email) as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tutor</Label>
              <Select
                value={form.tutor_id}
                onValueChange={(v) => setForm({ ...form, tutor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => (
                    <SelectItem key={t.id as string} value={t.id as string}>
                      {t.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm({ ...form, subject: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic Level</Label>
              <Select
                value={form.academic_level}
                onValueChange={(v) => setForm({ ...form, academic_level: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Internal notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            {conflict && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{conflict}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTime}>Create Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
