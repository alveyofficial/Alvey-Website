import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { BookMarked, Download, Upload, X, Check } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/homework")({
  component: StudentHomework,
});

const BUCKET = "homework-chat-files";

function StudentHomework() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  // Submission dialog
  const [submitting, setSubmitting] = useState<any | null>(null);
  const [submitFiles, setSubmitFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (uid: string) => {
    const hw = await DataStore.getHomeworkForStudent(uid);
    setHomework(hw);
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setStudentId(uid);
      await load(uid);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!studentId || !submitting) return;
    if (submitFiles.length === 0) { toast.error("Please attach at least one file."); return; }
    setUploading(true);
    try {
      const fileIds: string[] = [];
      const fileNames: string[] = [];
      for (const f of submitFiles) {
        const { fileId, fileName } = await DataStore.uploadFile(f, BUCKET, studentId);
        fileIds.push(fileId); fileNames.push(fileName);
      }
      await DataStore.submitHomework(submitting.id, studentId, fileIds, fileNames);
      toast.success("Homework submitted!");
      setSubmitting(null);
      setSubmitFiles([]);
      await load(studentId);
    } catch {
      toast.error("Failed to submit homework.");
    } finally {
      setUploading(false);
    }
  };

  const statuses = ["assigned", "submitted", "late", "reviewed"];
  const filtered = filter === "all" ? homework : homework.filter((h) => h.status === filter);

  const isOverdue = (hw: any) =>
    hw.dueDate && new Date(hw.dueDate) < new Date() && (hw.status === "assigned" || hw.status === "late");

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Homework"
        description="View assigned homework, download resources, and submit your work."
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
          description={filter === "all" ? "Your tutor will assign homework here when ready." : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((hw: any) => (
            <Card key={hw.id} className={isOverdue(hw) ? "border-red-300" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{hw.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From {hw.tutorName}
                      {hw.dueDate && (
                        <span className={isOverdue(hw) ? " text-red-500 font-medium" : ""}>
                          {" · Due "}{new Date(hw.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          {isOverdue(hw) && " (overdue)"}
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={hw.status || "assigned"} />
                </div>

                {hw.instructions && (
                  <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/40 rounded-lg">
                    {hw.instructions}
                  </p>
                )}

                {/* Tutor attachments */}
                {Array.isArray(hw.fileIds) && hw.fileIds.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Resources from tutor:</p>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                )}

                {/* Student submission */}
                {Array.isArray(hw.submissionFileIds) && hw.submissionFileIds.length > 0 && (
                  <div className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Your submission{hw.submittedAt ? ` · ${new Date(hw.submittedAt).toLocaleDateString()}` : ""}
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

                {/* Submit / resubmit button */}
                {hw.status !== "reviewed" && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant={hw.status === "submitted" ? "outline" : "default"}
                      className="gap-2"
                      onClick={() => { setSubmitting(hw); setSubmitFiles([]); }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {hw.status === "submitted" || hw.status === "late" ? "Resubmit" : "Submit Work"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit dialog */}
      <Dialog open={!!submitting} onOpenChange={(o) => { if (!o) { setSubmitting(null); setSubmitFiles([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Submitting: <span className="font-medium text-foreground">{submitting?.title}</span>
            </p>
            <div>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setSubmitFiles(Array.from(e.target.files || []))}
              />
              <Button type="button" variant="outline" size="sm" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Choose files to submit
              </Button>
              {submitFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {submitFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs border rounded-md px-3 py-1.5">
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      <button onClick={() => setSubmitFiles(submitFiles.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitting(null)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={uploading || submitFiles.length === 0}>
              {uploading ? "Uploading…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
