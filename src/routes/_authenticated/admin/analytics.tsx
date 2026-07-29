import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  GraduationCap,
  Star,
  BookOpen,
  DollarSign,
  Download,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";
import {
  getAdminDashboardMetrics,
  getEnrollmentTrend,
  getLessonTrend,
  getTopSubjects,
  downloadCsv,
  type AdminDashboardMetrics,
  type DateRange,
} from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

const chartConfig = {
  students: { label: "Students", color: "oklch(0.546 0.245 262.881)" },
  tutors: { label: "Tutors", color: "oklch(0.646 0.222 41.116)" },
  value: { label: "Lessons", color: "oklch(0.6 0.118 184.704)" },
} satisfies ChartConfig;

const RANGE_OPTIONS: { label: string; days: number | null }[] = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
  { label: "All time", days: null },
];

function AdminAnalytics() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rangeLabel, setRangeLabel] = useState(RANGE_OPTIONS[0].label);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [enrollment, setEnrollment] = useState<
    { month: string; students: number; tutors: number }[]
  >([]);
  const [lessonTrend, setLessonTrend] = useState<{ month: string; value: number }[]>([]);
  const [subjects, setSubjects] = useState<{ subject: string; count: number; pct: number }[]>([]);

  // §20.14 — analytics access is role-based: only Website Managers and Owners.
  useEffect(() => {
    (async () => {
      const { data } = await appwrite.auth.getUser();
      const uid = data.user?.id;
      if (!uid) {
        setAuthorized(false);
        return;
      }
      const roles = await DataStore.getUserRoles(uid);
      setAuthorized(roles.includes("website") || roles.includes("admin"));
    })();
  }, []);

  const range: DateRange | undefined = useMemo(() => {
    const opt = RANGE_OPTIONS.find((o) => o.label === rangeLabel);
    if (!opt?.days) return undefined;
    const start = new Date();
    start.setDate(start.getDate() - opt.days);
    return { start };
  }, [rangeLabel]);

  const loadData = async () => {
    setLoading(true);
    const [m, e, l, s] = await Promise.all([
      getAdminDashboardMetrics(range),
      getEnrollmentTrend(7),
      getLessonTrend(7),
      getTopSubjects(6),
    ]);
    setMetrics(m);
    setEnrollment(e);
    setLessonTrend(l);
    setSubjects(s);
    setLoading(false);
  };

  useEffect(() => {
    if (authorized) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, rangeLabel]);

  const handleExport = () => {
    if (!metrics) return;
    downloadCsv(`tutorslink-analytics-${new Date().toISOString().slice(0, 10)}`, [
      { metric: "Total Students", value: metrics.totalStudents },
      { metric: "Total Tutors", value: metrics.totalTutors },
      { metric: "Active Tutors", value: metrics.activeTutors },
      { metric: "Pending Tutor Applications", value: metrics.pendingTutorApplications },
      { metric: "Pending Recruitment Applications", value: metrics.pendingRecruitmentApplications },
      { metric: "Scheduled Lessons", value: metrics.scheduledLessons },
      { metric: "Completed Lessons", value: metrics.completedLessons },
      { metric: "Cancelled Lessons", value: metrics.cancelledLessons },
      { metric: "Average Tutor Rating", value: metrics.averageTutorRating },
      { metric: "Active Advertisements", value: metrics.activeAdvertisements },
      { metric: "Total Reviews", value: metrics.totalReviews },
      { metric: "Date Range", value: rangeLabel },
    ]);
  };

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
        <PageHeader title="Analytics" description="Platform performance metrics and trends." />
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="Platform analytics are only available to Website Managers and Owners. Contact an administrator if you believe you should have access."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform performance metrics and trends."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={rangeLabel} onValueChange={setRangeLabel}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.label} value={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleExport} disabled={!metrics}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

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
              icon={BookOpen}
              label="Completed Lessons"
              value={metrics.completedLessons}
              color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            />
            <StatCard
              icon={Star}
              label="Avg Tutor Rating"
              value={metrics.averageTutorRating || "—"}
              color="text-purple-600 bg-purple-50 dark:bg-purple-950/30"
            />
            <StatCard
              icon={TrendingUp}
              label="Scheduled Lessons"
              value={metrics.scheduledLessons}
              color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
            />
            <StatCard
              icon={DollarSign}
              label="Active Ads"
              value={metrics.activeAdvertisements}
              color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            />
            <StatCard
              icon={Users}
              label="Pending Tutor Apps"
              value={metrics.pendingTutorApplications}
              color="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
            />
            <StatCard
              icon={Star}
              label="Total Reviews"
              value={metrics.totalReviews}
              color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enrollment Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollment.some((e) => e.students || e.tutors) ? (
                  <ChartContainer config={chartConfig} className="h-[260px] w-full">
                    <BarChart data={enrollment}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                      <Bar dataKey="tutors" fill="var(--color-tutors)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-16 text-center">
                    Not enough historical data yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lessons Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                {lessonTrend.some((l) => l.value) ? (
                  <ChartContainer config={chartConfig} className="h-[260px] w-full">
                    <LineChart data={lessonTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        dataKey="value"
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground py-16 text-center">
                    No lessons recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Subjects by Lesson Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No subject data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {subjects.map((s) => (
                    <div key={s.subject} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-40 truncate">{s.subject}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {s.count}
                      </span>
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
