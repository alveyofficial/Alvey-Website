import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { BookMarked, Plus, X, Download, Upload, Check, ChevronDown } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge, Avatar } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/homework")({
  component: TutorHomework,
});

const BUCKET = "homework-chat-files";

function TutorHomework() {
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  // Create dialog
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ studentId: "", title: "", instructions: "", dueDate: "" });
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // View submission dialog
  const [viewing, setViewing] = useState<any | null>(null);

  const load = async (uid: string) => {
    const [hw, sts] = await Promise.all([
      DataStore.getHomeworkForTutor(uid),
      DataStore.getStudentsForTutor(uid),
    ]);
    setHomework(hw);
    setStudents(sts);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setTutorId(uid);
      await load(uid);
      setLoading(false);
    })();
  }, []);

  const handleCreate = async () => {
    if (!tutorId || !form.studentId || !form.title.trim()) {
      toast.error("Please select a student and enter a title.");
      return;
    }
    setSubmitting(true);
    try {
      let fileIds: string[] = [];
      let fileNames: string[] = [];
      for (const f of attachFiles) {
        const { fileId, fileName } = await DataStore.uploadFile(f, BUCKET, tutorId);
        fileIds.push(fileId);
        fileNames.push(fileName);
      }
      await DataStore.createHomework({
        tutorId,
        studentId: form.studentId,
        title: form.title.trim(),
        instructions: form.instructions.trim(),
        dueDate: form.dueDate || undefined,
        fileIds,
        fileNames,
      });
      toast.success("Homework assigned.");
      setCreating(false);
      setForm({ studentId: "", title: "", instructions: "", dueDate: "" });
      setAttachFiles([]);
      await load(tutorId);
    } catch (e: any) {
      toast.error("Failed to create homework.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (hwId: string, status: string) => {
    await DataStore.updateHomeworkStatus(hwId, status);
    setHomework((prev) => prev.map((h) => h.id === hwId ? { ...h, status } : h));
    toast.success("Status updated.");
  };

  const statuses = ["assigned", "submitted", "late", "reviewed"];
  const filtered = filter === "all" ? homework : homework.filter((h) => h.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Homework"
        description="Assign homework, track submissions, and review student work."
        action={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Assign Homework
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", ...statuses].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            className="capitalize"
            onClick={() => setFilter(s)}
          >
            {s}
            {s !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({homework.filter((h) => h.status === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={filter === "all" ? "No homework assigned yet" : `No ${filter} homework`}
          description={filter === "all" ? "Click 'Assign Homework' to get started." : undefined}
          action={
            filter === "all"
              ? <Button onClick={() => setCreating(true)} variant="outline">Assign Homework</Button>
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((hw: any) => (
            <Card key={hw.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <Avatar name={hw.studentName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{hw.title}</p>
                    <StatusBadge status={hw.status || "assigned"} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hw.studentName}
                    {hw.dueDate && ` · Due ${new Date(hw.dueDate).toLocaleDateString()}`}
                  </p>
                  {hw.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{hw.instructions}</p>
                  )}

                  {/* Attachments */}
                  {Array.isArray(hw.fileIds) && hw.fileIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hw.fileIds.map((fid: string, i: number) => (
                        <a
                          key={fid}
                          href={DataStore.getFileDownloadUrl(BUCKET, fid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline border border-blue-200 rounded-md px-2 py-1"
                        >
                          <Download className="h-3 w-3" />
                          {hw.fileNames?.[i] || `File ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Submission */}
                  {(hw.status === "submitted" || hw.status === "late") && Array.isArray(hw.submissionFileIds) && hw.submissionFileIds.length > 0 && (
                    <div className="mt-2 p-2 border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 mb-1.5">
                        Student Submission{hw.submittedAt ? ` · ${new Date(hw.submittedAt).toLocaleDateString()}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {hw.submissionFileIds.map((fid: string, i: number) => (
                          <a
                            key={fid}
                            href={DataStore.getFileDownloadUrl(BUCKET, fid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline border border-emerald-300 rounded-md px-2 py-1"
                          >
                            <Download className="h-3 w-3" />
                            {hw.submissionFileNames?.[i] || `Submission ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status changer */}
                <div className="shrink-0">
                  <Select
                    value={hw.status}
                    onValueChange={(v) => handleStatusChange(hw.id, v)}
                  >
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student…" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Chapter 5 exercises"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Describe the task…"
                rows={3}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attachments <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setAttachFiles(Array.from(e.target.files || []))}
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Choose files
              </Button>
              {attachFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {attachFiles.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs border rounded-md px-2 py-0.5">
                      {f.name}
                      <button onClick={() => setAttachFiles(attachFiles.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
