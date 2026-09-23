import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Video, Plus, Upload, X, Play, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, LoadingSpinner, Avatar } from "@/components/portal-shared";
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
import { appwrite, ID } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/recordings")({
  component: TutorRecordings,
});

const BUCKET = "6a161d75000df19d01fb"; // Tutors Link bucket

// Returns the best URL to use for playback
function getPlaybackUrl(rec: any): string {
  if (rec.externalUrl) return rec.externalUrl;
  if (rec.fileId) return DataStore.getFileDownloadUrl(BUCKET, rec.fileId);
  return "";
}

// Whether the recording can be played inline (Appwrite-hosted file, not external)
function isInlineVideo(rec: any): boolean {
  return !rec.externalUrl && !!rec.fileId;
}

function TutorRecordings() {
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", subject: "", studentIds: [] as string[],
    externalUrl: "", recordedAt: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (uid: string) => {
    const [recs, sts] = await Promise.all([
      DataStore.getRecordingsForTutor(uid),
      DataStore.getStudentsForTutor(uid),
    ]);
    setRecordings(recs);
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

  const toggleStudent = (sid: string) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(sid)
        ? f.studentIds.filter((id) => id !== sid)
        : [...f.studentIds, sid],
    }));
  };

  const handleCreate = async () => {
    if (!tutorId || !form.title.trim()) {
      toast.error("Please enter a title."); return;
    }
    if (!videoFile && !form.externalUrl.trim()) {
      toast.error("Upload a video file or enter an external URL."); return;
    }
    setUploading(true);
    try {
      let fileId: string | undefined;
      let fileName: string | undefined;
      if (videoFile) {
        const result = await appwrite.storage.createFile({
          bucketId: BUCKET,
          fileId: ID.unique(),
          file: videoFile,
        });
        fileId = result.$id;
        fileName = videoFile.name;
      }
      await DataStore.createRecording({
        tutorId,
        studentIds: form.studentIds,
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        fileId,
        fileName,
        externalUrl: form.externalUrl.trim() || undefined,
        storageProvider: videoFile ? "appwrite" : "external",
        recordedAt: form.recordedAt || new Date().toISOString(),
      });
      toast.success("Recording saved.");
      setCreating(false);
      setForm({ title: "", description: "", subject: "", studentIds: [], externalUrl: "", recordedAt: "" });
      setVideoFile(null);
      await load(tutorId);
    } catch {
      toast.error("Failed to save recording.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recording?")) return;
    await DataStore.deleteRecording(id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    toast.success("Recording deleted.");
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Recordings"
        description="Upload and manage class recordings for your students."
        action={
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add Recording
          </Button>
        }
      />

      {recordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No recordings yet"
          description="Upload a class recording and share it with your students."
          action={<Button onClick={() => setCreating(true)} variant="outline">Add Recording</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((rec: any) => {
            const viewUrl = getPlaybackUrl(rec);
            const inline = isInlineVideo(rec);
            return (
              <Card key={rec.id} className="overflow-hidden">
                {/* Thumbnail / player */}
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                  {inline && viewUrl ? (
                    <video
                      src={viewUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                      aria-label={`Recording: ${rec.title}`}
                    />
                  ) : viewUrl ? (
                    /* External URL — show thumbnail with play overlay */
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Video className="h-10 w-10 text-muted-foreground" />
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label={`Watch ${rec.title}`}
                      >
                        <Play className="h-10 w-10 text-white fill-white" />
                      </a>
                    </div>
                  ) : (
                    <Video className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm line-clamp-1">{rec.title}</p>
                  {rec.subject && <p className="text-xs text-muted-foreground mt-0.5">{rec.subject}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.recordedAt
                      ? new Date(rec.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "Date unknown"}
                    {formatDuration(rec.durationSeconds) && ` · ${formatDuration(rec.durationSeconds)}`}
                  </p>
                  {Array.isArray(rec.studentIds) && rec.studentIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shared with {rec.studentIds.length} student{rec.studentIds.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {viewUrl && !inline && (
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" asChild>
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="h-3.5 w-3.5" /> Open
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(rec.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Class Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Algebra Session — Week 3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="What was covered in this session?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Recorded Date</Label>
              <Input
                type="datetime-local"
                value={form.recordedAt}
                onChange={(e) => setForm({ ...form, recordedAt: e.target.value })}
              />
            </div>

            {/* Video source */}
            <div className="space-y-1.5">
              <Label>Video File <span className="text-muted-foreground font-normal">(or use external URL below)</span></Label>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                {videoFile ? videoFile.name : "Choose video file"}
              </Button>
              {videoFile && (
                <button className="ml-2 text-muted-foreground" onClick={() => setVideoFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>External URL <span className="text-muted-foreground font-normal">(YouTube, Zoom, etc.)</span></Label>
              <Input
                placeholder="https://…"
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              />
            </div>

            {/* Students */}
            {students.length > 0 && (
              <div className="space-y-1.5">
                <Label>Share with students</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                  {students.map((s) => (
                    <button
                      key={s.studentId}
                      type="button"
                      onClick={() => toggleStudent(s.studentId)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        form.studentIds.includes(s.studentId)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-border text-muted-foreground hover:border-blue-400"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={uploading}>
              {uploading ? "Saving…" : "Save Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
