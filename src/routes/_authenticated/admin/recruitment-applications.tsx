<<<<<<< HEAD
import { createFileRoute, Link } from "@tanstack/react-router";
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createFileRoute } from "@tanstack/react-router";
>>>>>>> bc0697a (Fixed a 409 Conflict issue on sign up)
import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Archive,
  Search,
  Save,
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  MessageSquare,
  Clock,
  FileCheck,
  Send,
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

interface RecruitmentApplication {
  id: string;
  full_name?: string;
  role_applied_for?: string;
  email?: string;
  created_at?: string;
  status?: string;
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/recruitment-applications")({
  component: AdminRecruitmentApplications,
});

// ─── Discord notification helper ─────────────────────────────────────────────
async function sendDiscordNotification(app: Record<string, unknown>): Promise<void> {
  try {
    const config = await DataStore.getPlatformSetting("discord_config");
    const channelId =
      config?.notification_channel || config?.announcement_channel || "";

    if (!config?.enabled || !channelId) {
      // Discord integration not configured — log and continue
      console.info("Discord integration not configured; skipping notification.");
      return;
    }

    const name = String(
      app.full_name || app.Full_name || app.fullName || "Applicant",
    );
    const role = String(
      app.role_applied_for ||
        app.Role_you_want_to_apply_for ||
        "a staff position",
    );
    const email = String(app.email || app.Email_address || "");

    // We call the Appwrite function via the REST API so we don't need a
    // server-side SDK — the function itself posts to Discord.
    const payload = {
      type: "recruitment_accepted",
      channelId,
      message: `✅ **Recruitment Application Accepted**\n**Name:** ${name}\n**Role:** ${role}\n**Email:** ${email}\n\nPlease send them a welcome message and assign the appropriate Discord role.`,
    };

    // Fire-and-forget via the alvey-whatsapp-webhook or a platform setting
    // webhook URL — if neither exists we just log.
    const webhookUrl = config?.discord_webhook_url as string | undefined;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload.message }),
      });
    } else {
      console.info("Discord webhook URL not set; skipping POST.", payload);
    }
  } catch (e) {
    // Never block the accept flow because of a Discord error
    console.warn("Discord notification failed (non-fatal):", e);
  }
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  app,
  onClose,
  onAction,
}: {
  app: Record<string, unknown>;
  onClose: () => void;
  onAction: () => void;
}) {
  const [notes, setNotes] = useState(
    (app.internalNotes || app.internal_notes || "") as string,
  );
  const [status, setStatus] = useState((app.status || "pending") as string);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  const id = (app.$id || app.id) as string;
  const appName = String(
    app.full_name || app.Full_name || app.fullName || "Applicant",
  );

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await DataStore.updateRecruitmentApplicationStatus(
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
      await DataStore.updateRecruitmentApplicationStatus(id, "approved", notes);

      // Assign recruitment role if user is linked
      const userId = (app.applicantUserId || app.applicant_user_id) as
        | string
        | undefined;
      if (userId) {
        await DataStore.assignUserRole(userId, "recruitment");
      }

      // Send Discord channel notification
      await sendDiscordNotification(app);

      toast.success(
        `${appName} accepted — Discord notification sent (if configured)`,
      );
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
      await DataStore.updateRecruitmentApplicationStatus(id, "rejected", notes);
      toast.success("Application rejected and archived");
      onAction();
      onClose();
    } catch {
      toast.error("Failed to reject application");
    } finally {
      setActing(null);
    }
  };

  const field = (label: string, value: unknown) => {
    if (!value && value !== 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm">{String(value)}</p>
      </div>
    );
  };

  const arrayField = (label: string, value: unknown) => {
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
            <FileCheck className="h-5 w-5 text-indigo-600" /> Recruitment
            Application — {appName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left / main info ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Personal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" /> Personal
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {field(
                  "Full Name",
                  app.full_name || app.Full_name || app.fullName,
                )}
                {field(
                  "Email",
                  app.email || app.Email_address,
                )}
                {field("Phone", app.phone || app.phoneNumber)}
                {field(
                  "Discord",
                  app.discord_username || app.Discord_username,
                )}
                {field(
                  "Instagram",
                  app.instagram_handle || app.Instagram_handle,
                )}
                {field(
                  "Country",
                  app.country_of_residence || app.Country_of_residence,
                )}
                {field(
                  "Education Level",
                  app.current_education_level ||
                    app.Current_education_level,
                )}
                {arrayField(
                  "Languages",
                  app.languages_fluent_in ||
                    app.Languages_fluent_in ||
                    app.languages,
                )}
              </CardContent>
            </Card>

            {/* Role & motivation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-600" /> Role &
                  Motivation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {field(
                  "Role Applied For",
                  app.role_applied_for ||
                    app.Role_you_want_to_apply_for,
                )}
                {(app.reason_to_apply || app.Reason_to_apply) && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Reason to Apply
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {String(
                        app.reason_to_apply || app.Reason_to_apply,
                      )}
                    </p>
                  </div>
                )}
                {(app.experience || app.Experience) && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Experience
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {String(app.experience || app.Experience)}
                    </p>
                  </div>
                )}
                {(app.why_good_fit || app.Why_good_fit || app.cover_letter) && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Why a Good Fit / Cover Letter
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {String(
                        app.why_good_fit ||
                          app.Why_good_fit ||
                          app.cover_letter,
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right / actions ───────────────────────────────────── */}
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
                      <SelectItem value="under_review">
                        Under Review
                      </SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Applied{" "}
                  {new Date(
                    (app.$createdAt ||
                      app.createdAt ||
                      app.created_at ||
                      Date.now()) as string,
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
                {(app.status === "pending" ||
                  app.status === "under_review" ||
                  !app.status) && (
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
                      Accept & Notify Discord
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
                    <CheckCircle className="h-4 w-4" /> Accept & Notify Discord
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
                  <Save className="h-4 w-4" />{" "}
                  {saving ? "Saving…" : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function AdminRecruitmentApplications() {
<<<<<<< HEAD
  const [applications, setApplications] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [reviewing, setReviewing] = useState<Record<
    string,
    unknown
  > | null>(null);
=======
  const [applications, setApplications] = useState<RecruitmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
>>>>>>> bc0697a (Fixed a 409 Conflict issue on sign up)

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await DataStore.getRecruitmentApplicationsFromDB();
    console.log(data); // <-- null this is itt
    setApplications(data);
    setLoading(false);
  };

<<<<<<< HEAD
  const handleQuickApprove = async (app: Record<string, unknown>) => {
    const id = (app.$id || app.id) as string;
    const name = String(
      app.full_name || app.Full_name || app.fullName || "Applicant",
=======
  const handleApprove = async (id: string) => {
    console.log("Approve ID:", id);

    await DataStore.updateRecruitmentStatus(id, "approved");
    toast.success("Application approved");
    loadApplications();
  };

  const handleReject = async (id: string) => {
    await DataStore.updateRecruitmentStatus(id, "rejected");
    toast.success("Application rejected");
    loadApplications();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
>>>>>>> bc0697a (Fixed a 409 Conflict issue on sign up)
    );
    const userId = (app.applicantUserId || app.applicant_user_id) as
      | string
      | undefined;

    await DataStore.updateRecruitmentApplicationStatus(id, "approved");
    if (userId) await DataStore.assignUserRole(userId, "recruitment");
    await sendDiscordNotification(app);

    toast.success(`${name} accepted — Discord notification sent (if configured)`);
    loadApplications();
  };

  const handleQuickReject = async (id: string) => {
    await DataStore.updateRecruitmentApplicationStatus(id, "rejected");
    toast.success("Application rejected and archived");
    loadApplications();
  };

  const active = applications.filter((a) => a.status !== "rejected");
  const visible = (filterStatus === "active" ? active : applications).filter(
    (a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(a.full_name || a.Full_name || a.fullName || "")
          .toLowerCase()
          .includes(q) ||
        String(a.email || a.Email_address || "")
          .toLowerCase()
          .includes(q) ||
        String(
          a.role_applied_for || a.Role_you_want_to_apply_for || "",
        )
          .toLowerCase()
          .includes(q)
      );
    },
  );

  return (
    <div>
      <PageHeader
        title="Recruitment Applications"
        description="Review internal team applications."
        action={
          <Link to="/admin/recruitment-applications-archived">
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
            placeholder="Search by name, email, or role…"
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
          description="There are no recruitment applications to review."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((app) => {
            const id = (app.$id || app.id) as string;
            const name = String(
              app.full_name || app.Full_name || app.fullName || "Applicant",
            );
            const email = String(app.email || app.Email_address || "");
            const role = String(
              app.role_applied_for ||
                app.Role_you_want_to_apply_for ||
                "Position",
            );
            const appliedDate = new Date(
              (app.$createdAt ||
                app.createdAt ||
                app.created_at ||
                Date.now()) as string,
            ).toLocaleDateString();

            return (
              <Card key={id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm shrink-0">
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
                        {role} · {email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied {appliedDate}
                      </p>
                    </div>
                  </div>
<<<<<<< HEAD
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
                    {(app.status === "pending" ||
                      app.status === "under_review" ||
                      !app.status) && (
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
=======
                  <div>
                    <p className="font-semibold text-sm">{app.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.role_applied_for || "Position"} · {app.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied {app.created_at ? new Date(app.created_at).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status || "pending"} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setSelectedApplication(app);
                      setReviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </Button>
                  {app.status === "pending" || app.status === "under_review" ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                        onClick={() => handleApprove(app.id)}
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 gap-1.5"
                        onClick={() => handleReject(app.id)}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Volunteer Application</DialogTitle>
              </DialogHeader>

              {selectedApplication && (
                <div className="space-y-6">

                  <div className="rounded-xl border p-5">

                    <h3 className="text-lg font-semibold mb-4">
                      Personal Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoField
                        label="Name"
                        value={selectedApplication.full_name}
                      />
                      <InfoField
                        label="Email"
                        value={selectedApplication.email}
                      />
                      <InfoField
                        label="Discord"
                        value={selectedApplication.Discord_username}
                      />
                      <InfoField
                        label="Instagram"
                        value={selectedApplication.Instagram_handle}
                      />
                      <InfoField
                        label="Country"
                        value={selectedApplication.Country_of_residence}
                      />
                      <InfoField
                        label="Education"
                        value={selectedApplication.Current_education_level}
                      />
                    </div>

                  </div>

                  <div>
                    <h2 className="font-semibold">Application</h2>

                    <p><strong>Role: </strong>
                      {selectedApplication.Role_you_want_to_apply_for}
                    </p>

                    <p><strong>Hours: </strong>
                      {selectedApplication.hoursPerWeek}
                    </p>

                    <p><strong>Status: </strong>
                      {selectedApplication.status}
                    </p>
                  </div>

                  <div className="rounded-xl border p-5">

                    <h3 className="text-lg font-semibold mb-3">
                      Reason to Apply
                    </h3>

                    <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">

                      {selectedApplication.Reason_to_apply}

                    </div>

                  </div>

                  <div className="rounded-xl border p-5">

                    <h3 className="text-lg font-semibold mb-3">
                      Experience
                    </h3>

                    <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">

                      {selectedApplication.Experience}

                    </div>

                  </div>

                  <div>
                    <h3 className="font-semibold">Projects</h3>

                    <p>{selectedApplication.projectLinks || "N/A"}</p>
                  </div>

                  <div className="rounded-xl border p-5">

                    <h3 className="text-lg font-semibold mb-3">
                      Why good fit
                    </h3>

                    <div className="rounded-md bg-muted p-4 whitespace-pre-wrap">

                      {selectedApplication.Why_good_fit}

                    </div>

                  </div>

                </div>
              )}
            </DialogContent>
          </Dialog>
>>>>>>> bc0697a (Fixed a 409 Conflict issue on sign up)
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
