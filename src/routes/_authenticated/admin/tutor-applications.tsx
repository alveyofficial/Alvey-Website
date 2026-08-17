import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Archive,
  Search,
  Filter,
  X,
  Save,
  User,
  Mail,
  Phone,
  BookOpen,
  Globe,
  DollarSign,
  Clock,
  FileCheck,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/admin/tutor-applications")({
  component: AdminTutorApplications,
});

// ─── Review Modal ────────────────────────────────────────────────────────────

function ReviewModal({
  app,
  onClose,
  onAction,
}: {
  app: Record<string, unknown>;
  onClose: () => void;
  onAction: () => void;
}) {
  const [notes, setNotes] = useState((app.internalNotes || app.internal_notes || "") as string);
  const [status, setStatus] = useState((app.status || "pending") as string);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  const id = (app.$id || app.id) as string;

  const appName =
    (app.full_name ||
      app.fullName ||
      app.email ||
      app.Email_address ||
      "Applicant") as string;

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await DataStore.updateTutorApplicationStatus(
        id,
        status as "pending" | "under_review" | "approved" | "rejected",
        notes,
      );
      toast.success("Notes saved");
      onAction();
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setActing("approve");
    try {
      // 1. Update application status
      await DataStore.updateTutorApplicationStatus(id, "approved", notes);

      // 2. Build tutor from application data
      const userId = (app.applicantUserId || app.applicant_user_id) as string | undefined;
      const name = (app.full_name || app.fullName || app.email || "New Tutor") as string;
      const email = (app.email || app.Email_address || "") as string;

      const subjects = Array.isArray(app.subjects)
        ? (app.subjects as string[])
        : app.subjectName
          ? [(app.subjectName as string)]
          : ["General"];

      const levels = Array.isArray(app.levels)
        ? (app.levels as string[])
        : app.teachingLevel
          ? [(app.teachingLevel as string)]
          : ["General"];

      const languages = Array.isArray(app.languagesSpoken)
        ? (app.languagesSpoken as string[])
        : Array.isArray(app.languages)
          ? (app.languages as string[])
          : ["English"];

      const tutorId = userId || `tutor_${id}`;

      await DataStore.saveTutor({
        id: tutorId,
        name,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&size=256`,
        headline: (app.headline as string) || "Professional Educator",
        about: ((app.teachingExperience || app.cover_letter || "") as string),
        hourly_rate: Number(app.oneOnOneRateUsd ?? app.hourlyRate ?? 40),
        rating_avg: 5.0,
        rating_count: 0,
        years_experience: Number(app.yearsExperience ?? app.years_experience ?? 1),
        languages,
        subjects,
        levels,
        is_featured: false,
        is_verified: true,
        availability: "Contact for availability",
      });

      // 3. Assign role
      if (userId) {
        await DataStore.assignUserRole(userId, "tutor");
      }

      // 4. Add to tutors team
      if (email) {
        await DataStore.addToTeam("tutors", email, userId);
      }

      toast.success(`${name} approved — tutor profile created and added to Tutors team`);
      onAction();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve application");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    setActing("reject");
    try {
      await DataStore.updateTutorApplicationStatus(id, "rejected", notes);
      toast.success("Application rejected and archived");
      onAction();
      onClose();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setActing(null);
    }
  };

  const field = (label: string, value: unknown, mono = false): JSX.Element | null => {
    if (!value && value !== 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`text-sm ${mono ? "font-mono" : ""}`}>{String(value)}</p>
      </div>
    );
  };

  const arrayField = (label: string, value: unknown): JSX.Element | null => {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    if (arr.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {arr.map((v, i) => (
            <Badge key={i} variant="secondary">
              {String(v)}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" /> Tutor Application — {appName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left / main info ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Personal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {field("Full Name", app.full_name || app.fullName)}
                {field("Email", app.email || app.Email_address)}
                {field("Phone", app.phoneNumber || app.phone)}
                {field("Discord", app.discordUsername || app.discord_username)}
                {field("Instagram", app.instagramHandle || app.instagram_handle)}
                {field("Country", app.countryOfResidence || app.country_of_residence)}
                {field("Date of Birth", app.dateOfBirth || app.date_of_birth)}
                {arrayField("Languages", app.languagesSpoken || app.languagesFluent || app.languages)}
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" /> Qualifications & Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {field("Highest Qualification", app.highestQualification || app.highest_qualification)}
                {field("Subject Name", app.subjectName || app.subject_name)}
                {field("Subject Code", app.subjectCode || app.subject_code)}
                {field("Exam Board", app.examBoard || app.exam_board)}
                {field("Teaching Level", app.teachingLevel || app.teaching_level)}
                {field("Teaching Format", app.teachingFormat || app.teaching_format)}
                {field("Qualification Link", app.highestQualificationLink || app.qualification_link)}
              </CardContent>
            </Card>

            {/* Exam results */}
            {(app.examResultSummary || app.exam_result_summary) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-600" /> Exam Result Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {(app.examResultSummary || app.exam_result_summary) as string}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Teaching experience */}
            {(app.teachingExperience || app.cover_letter) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" /> Teaching Experience / Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {(app.teachingExperience || app.cover_letter) as string}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Rates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" /> Rates & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                {field("1-on-1 Rate (USD)", app.oneOnOneRateUsd != null ? `$${app.oneOnOneRateUsd}` : null)}
                {field("Group Rate (USD)", app.groupRateUsd != null ? `$${app.groupRateUsd}` : null)}
                {field("Max Group Students", app.maxGroupStudents)}
                {field("Weekly Classes / Student", app.weeklyClassesPerStudent)}
                {field("Class Duration (min)", app.classDurationMinutes)}
                {field("Years Experience", app.yearsExperience || app.years_experience)}
              </CardContent>
            </Card>
          </div>

          {/* ── Right / actions ──────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusBadge status={(app.status || "pending") as string} />
                <div className="space-y-1.5">
                  <Label className="text-xs">Change Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Applied{" "}
                  {new Date(
                    (app.$createdAt || app.createdAt || app.created_at || Date.now()) as string,
                  ).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(app.status === "pending" || app.status === "under_review" || !app.status) && (
                  <>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                      onClick={handleApprove}
                      disabled={acting !== null}
                    >
                      {acting === "approve" ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve & Create Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 gap-2"
                      onClick={handleReject}
                      disabled={acting !== null}
                    >
                      {acting === "reject" ? (
                        <span className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Reject & Archive
                    </Button>
                  </>
                )}
                {app.status === "approved" && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 gap-2"
                    onClick={handleReject}
                    disabled={acting !== null}
                  >
                    <XCircle className="h-4 w-4" /> Revoke & Archive
                  </Button>
                )}
                {app.status === "rejected" && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                    onClick={handleApprove}
                    disabled={acting !== null}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve & Create Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Add reviewer notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminTutorApplications() {
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active"); // active = non-archived
  const [reviewing, setReviewing] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await DataStore.getTutorApplicationsFromDB();
    setApplications(data);
    setLoading(false);
  };

  const handleQuickApprove = async (app: Record<string, unknown>) => {
    const id = (app.$id || app.id) as string;
    const name = (app.full_name || app.fullName || "Applicant") as string;
    const email = (app.email || "") as string;
    const userId = (app.applicantUserId || app.applicant_user_id) as string | undefined;

    const subjects = Array.isArray(app.subjects)
      ? (app.subjects as string[])
      : app.subjectName
        ? [(app.subjectName as string)]
        : ["General"];
    const levels = Array.isArray(app.levels)
      ? (app.levels as string[])
      : app.teachingLevel
        ? [(app.teachingLevel as string)]
        : ["General"];
    const languages = Array.isArray(app.languagesSpoken)
      ? (app.languagesSpoken as string[])
      : Array.isArray(app.languages)
        ? (app.languages as string[])
        : ["English"];

    const tutorId = userId || `tutor_${id}`;

    await DataStore.updateTutorApplicationStatus(id, "approved");
    await DataStore.saveTutor({
      id: tutorId,
      name,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&size=256`,
      headline: "Professional Educator",
      about: ((app.teachingExperience || app.cover_letter || "") as string),
      hourly_rate: Number(app.oneOnOneRateUsd ?? 40),
      rating_avg: 5.0,
      rating_count: 0,
      years_experience: Number(app.yearsExperience ?? 1),
      languages,
      subjects,
      levels,
      is_featured: false,
      is_verified: true,
      availability: "Contact for availability",
    });
    if (userId) await DataStore.assignUserRole(userId, "tutor");
    if (email) await DataStore.addToTeam("tutors", email, userId);

    toast.success(`${name} approved — tutor profile created`);
    loadApplications();
  };

  const handleQuickReject = async (id: string) => {
    await DataStore.updateTutorApplicationStatus(id, "rejected");
    toast.success("Application rejected and archived");
    loadApplications();
  };

  // Active = not rejected/archived; archived = rejected
  const active = applications.filter(
    (a) => a.status !== "rejected",
  );
  const visible = (filterStatus === "active" ? active : applications).filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(a.full_name || a.fullName || "").toLowerCase().includes(q) ||
      String(a.email || "").toLowerCase().includes(q) ||
      String(a.subjectName || (Array.isArray(a.subjects) ? a.subjects[0] : "") || "")
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Tutor Applications"
        description="Review and approve tutor applications."
        action={
          <Link to="/admin/tutor-applications-archived">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Archive className="h-4 w-4" /> View Archived
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or subject…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["active", "all"].map((f) => (
            <Button
              key={f}
              variant={filterStatus === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(f)}
              className="capitalize"
            >
              {f === "active" ? "Active" : "All"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Applications"
          description="There are no tutor applications to review."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((app) => {
            const id = (app.$id || app.id) as string;
            const name = (app.full_name || app.fullName || "Applicant") as string;
            const email = (app.email || "") as string;
            const subjects = Array.isArray(app.subjects)
              ? (app.subjects as string[]).join(", ")
              : String(app.subjectName || "");
            const appliedDate = new Date(
              (app.$createdAt || app.createdAt || app.created_at || Date.now()) as string,
            ).toLocaleDateString();

            return (
              <Card key={id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {email}
                        {subjects ? ` · ${subjects}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">Applied {appliedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={(app.status || "pending") as string} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setReviewing(app)}
                    >
                      <Eye className="h-4 w-4" /> Review
                    </Button>
                    {(app.status === "pending" || app.status === "under_review" || !app.status) && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                          onClick={() => handleQuickApprove(app)}
                        >
                          <CheckCircle className="h-4 w-4" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 gap-1.5"
                          onClick={() => handleQuickReject(id)}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          app={reviewing}
          onClose={() => setReviewing(null)}
          onAction={loadApplications}
        />
      )}
    </div>
  );
}
