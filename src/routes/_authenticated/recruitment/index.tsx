import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Activity,
  Users,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";
import { getRecruitmentMetrics, type RecruitmentMetrics } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/recruitment/")({
  component: RecruitmentDashboard,
});

function RecruitmentDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await appwrite.auth.getUser();
      const uid = data.user?.id;
      if (!uid) {
        setAuthorized(false);
        return;
      }
      const roles = await DataStore.getUserRoles(uid as string);
      const isAuthorized =
        roles.includes("recruitment") ||
        roles.includes("website") ||
        roles.includes("admin");
      setAuthorized(isAuthorized);
      if (!isAuthorized) return;

      const [m, apps] = await Promise.all([
        getRecruitmentMetrics(),
        DataStore.getRecruitmentApplicationsFromDB(),
      ]);
      setMetrics(m);
      setRecent(
        [...apps]
          .sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              new Date((b.created_at || b.createdAt || 0) as string | number).getTime() -
              new Date((a.created_at || a.createdAt || 0) as string | number).getTime(),
          )
          .slice(0, 3),
      );
      setLoading(false);
    })();
  }, []);

  if (authorized === null) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div>
        <PageHeader
          title="Recruitment Dashboard"
          description="Overview of current recruitment activity."
        />
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="Recruitment analytics are only available to Recruitment Team members, Website Managers, and Owners."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Recruitment Dashboard"
        description="Overview of current recruitment activity."
      />

      {loading || !metrics ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Clock}
              label="Pending Applications"
              value={metrics.pending}
              color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            />
            <StatCard
              icon={FileText}
              label="Under Review"
              value={metrics.underReview}
              color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
            />
            <StatCard
              icon={CheckCircle}
              label="Approved"
              value={metrics.approved}
              color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            />
            <StatCard
              icon={XCircle}
              label="Rejected"
              value={metrics.rejected}
              color="text-red-600 bg-red-50 dark:bg-red-950/30"
            />
            <StatCard
              icon={Users}
              label="Recently Submitted (30d)"
              value={metrics.recentlySubmitted}
              color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
            />
            <StatCard
              icon={Bell}
              label="Approval Rate"
              value={`${metrics.approvalRatePct}%`}
              color="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
            />
            <StatCard
              icon={Activity}
              label="Total Applications"
              value={metrics.total}
              color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Submitted Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No applications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recent.map((app, i) => (
                    <div
                      key={app.id || app.$id || i}
                      className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-200 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm">
                          {app.full_name || app.Full_name || "Applicant"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.role_applied_for || app.Role_you_want_to_apply_for || "Position"} ·{" "}
                          {new Date(
                            app.created_at || app.createdAt || Date.now(),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={app.status || "pending"} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
