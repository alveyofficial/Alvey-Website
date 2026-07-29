import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  FileText,
  Star,
  Bell,
  DollarSign,
  TrendingUp,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";
import { getAdminDashboardMetrics, type AdminDashboardMetrics } from "@/lib/analytics";

const toDateValue = (v: unknown) => {
  if (v == null) return Date.now();
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  return Number(v) || Date.parse(String(v)) || Date.now();
};

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentApps, setRecentApps] = useState<Record<string, any>[]>([]);
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
      const isAdmin = roles.includes("website_manager") || roles.includes("admin");
      setAuthorized(isAdmin);
      if (!isAdmin) return;

      const [m, apps] = await Promise.all([
        getAdminDashboardMetrics(),
        DataStore.getTutorApplicationsFromDB(),
      ]);
      setMetrics(m);

      setRecentApps(
        [...apps]
          .sort((a: Record<string, any>, b: Record<string, any>) =>
            toDateValue(b.created_at ?? b.createdAt) - toDateValue(a.created_at ?? a.createdAt),
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
        <PageHeader title="Admin Dashboard" description="Platform-wide overview and management." />
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="The admin dashboard is only available to Website Managers and Owners."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Platform-wide overview and management." />

      {loading || !metrics ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Total Students"
              value={metrics.totalStudents}
              color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
            />
            <StatCard
              icon={GraduationCap}
              label="Active Tutors"
              value={metrics.activeTutors}
              color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            />
            <StatCard
              icon={FileText}
              label="Pending Applications"
              value={metrics.pendingTutorApplications}
              color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            />
            <StatCard
              icon={Star}
              label="Avg Rating"
              value={metrics.averageTutorRating || "—"}
              color="text-purple-600 bg-purple-50 dark:bg-purple-950/30"
            />
            <StatCard
              icon={Bell}
              label="Total Reviews"
              value={metrics.totalReviews}
              color="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
            />
            <StatCard
              icon={DollarSign}
              label="Active Ads"
              value={metrics.activeAdvertisements}
              color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            />
            <StatCard
              icon={TrendingUp}
              label="Lesson Growth (MoM)"
              value={
                metrics.monthOverMonthLessonGrowthPct != null
                  ? `${metrics.monthOverMonthLessonGrowthPct > 0 ? "+" : ""}${metrics.monthOverMonthLessonGrowthPct}%`
                  : "—"
              }
              color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
            />
            <StatCard
              icon={BookOpen}
              label="Completed Lessons"
              value={metrics.completedLessons}
              color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Tutor Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {recentApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No applications yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentApps.map((app) => (
                      <div
                        key={app.id || app.$id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {app.full_name || app.fullName || "Applicant"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(Array.isArray(app.subjects) ? app.subjects[0] : app.subjectName) || "General"} ·{" "}
                            {new Date(
                              toDateValue(app.created_at ?? app.createdAt),
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Database Status</span>
                    <span className="text-sm font-medium text-emerald-600">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Auth Service</span>
                    <span className="text-sm font-medium text-emerald-600">Operational</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">AI Assistant</span>
                    <span
                      className={`text-sm font-medium ${metrics.aiAssistantEnabled ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {metrics.aiAssistantEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Edge Functions</span>
                    <span className="text-sm font-medium text-emerald-600">Running</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Recruitment</span>
                    <span className="text-sm font-medium">
                      {metrics.pendingRecruitmentApplications}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
