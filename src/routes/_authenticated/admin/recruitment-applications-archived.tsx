import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Search, CheckCircle, RotateCcw } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";

export const Route = createFileRoute(
  "/_authenticated/admin/recruitment-applications-archived",
)({
  component: ArchivedRecruitmentApplications,
});

async function sendDiscordNotification(app: Record<string, unknown>): Promise<void> {
  try {
    const config = await DataStore.getPlatformSetting("discord_config");
    const channelId = config?.notification_channel || config?.announcement_channel || "";
    if (!config?.enabled || !channelId) return;

    const name = String(app.full_name || app.Full_name || app.fullName || "Applicant");
    const role = String(app.role_applied_for || app.Role_you_want_to_apply_for || "a staff position");
    const email = String(app.email || app.Email_address || "");
    const webhookUrl = config?.discord_webhook_url as string | undefined;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `✅ **Recruitment Application Accepted**\n**Name:** ${name}\n**Role:** ${role}\n**Email:** ${email}\n\nPlease send them a welcome message and assign the appropriate Discord role.`,
        }),
      });
    }
  } catch (e) {
    console.warn("Discord notification failed (non-fatal):", e);
  }
}

function ArchivedRecruitmentApplications() {
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await DataStore.getRecruitmentApplicationsFromDB();
    setApplications(data.filter((a) => a.status === "rejected"));
    setLoading(false);
  };

  const handleRestore = async (id: string) => {
    await DataStore.updateRecruitmentApplicationStatus(
      id,
      "pending" as "pending" | "under_review" | "approved" | "rejected",
    );
    toast.success("Application restored to pending");
    loadApplications();
  };

  const handleApproveFromArchive = async (app: Record<string, unknown>) => {
    const id = (app.$id || app.id) as string;
    const name = String(app.full_name || app.Full_name || app.fullName || "Applicant");
    const userId = (app.applicantUserId || app.applicant_user_id) as string | undefined;

    await DataStore.updateRecruitmentApplicationStatus(id, "approved");
    if (userId) await DataStore.assignUserRole(userId, "recruitment");
    await sendDiscordNotification(app);

    toast.success(`${name} accepted — Discord notification sent (if configured)`);
    loadApplications();
  };

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(a.full_name || a.Full_name || a.fullName || "").toLowerCase().includes(q) ||
      String(a.email || a.Email_address || "").toLowerCase().includes(q) ||
      String(a.role_applied_for || a.Role_you_want_to_apply_for || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Archived Recruitment Applications"
        description="Rejected recruitment applications. You can restore or accept from here."
        action={
          <Link to="/admin/recruitment-applications">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Applications
            </Button>
          </Link>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search archived applications…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Archived Applications"
          description="No recruitment applications have been rejected yet."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const id = (app.$id || app.id) as string;
            const name = String(
              app.full_name || app.Full_name || app.fullName || "Applicant",
            );
            const email = String(app.email || app.Email_address || "");
            const role = String(
              app.role_applied_for || app.Role_you_want_to_apply_for || "Position",
            );
            const appliedDate = new Date(
              (app.$createdAt || app.createdAt || app.created_at || Date.now()) as string,
            ).toLocaleDateString();

            return (
              <Card key={id} className="opacity-90">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-700 dark:text-red-400 font-bold text-sm shrink-0">
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
                      <p className="text-xs text-muted-foreground">Applied {appliedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="rejected" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleRestore(id)}
                    >
                      <RotateCcw className="h-4 w-4" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                      onClick={() => handleApproveFromArchive(app)}
                    >
                      <CheckCircle className="h-4 w-4" /> Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
