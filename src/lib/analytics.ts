/**
 * Analytics & Reporting aggregation layer.
 * Implements SRS §20 (Analytics & Reporting).
 *
 * Design notes (see docs/ASSUMPTIONS_CONSTRAINTS.md for the full list):
 * - This module is additive: it does not modify `data-store.ts` or change
 *   any existing return shapes consumers already depend on.
 * - It reuses DataStore's public read methods wherever the data is already
 *   available there (students, tutors, applications, lessons, reviews,
 *   advertisements, platform settings).
 * - It falls back to direct, read-only Appwrite queries only for metrics
 *   that need a field DataStore does not currently expose — specifically
 *   document creation timestamps, needed for the registration/enrollment
 *   trend charts (§20.4/§20.5).
 * - Every Appwrite call is wrapped in try/catch and degrades to an empty
 *   result rather than throwing, matching the resilience pattern already
 *   used throughout `data-store.ts` (so the dashboard keeps working against
 *   local mock data or when a collection is temporarily unavailable).
 * - AI Assistant conversations (§20.8) and Website Analytics (§20.9) are
 *   intentionally not implemented here: conversations aren't persisted
 *   anywhere in the current chatbot implementation, and website analytics
 *   requires a future external integration per the SRS itself. Both are
 *   called out as open items in docs/ASSUMPTIONS_CONSTRAINTS.md.
 */
import { Query } from "appwrite";
import { appwrite, APPWRITE_DATABASE_ID } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";

// Mirrors the (private) collection ids used internally by data-store.ts.
// Duplicated locally, read-only, so this module never needs to modify the
// existing data layer.
const RAW_COLLECTIONS = {
  USERS: "users",
  TUTOR_PROFILES: "tutor_profiles",
};

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface MonthPoint {
  month: string;
  value: number;
}

function inRange(dateStr: string | undefined | null, range?: DateRange): boolean {
  if (!dateStr) return true;
  if (!range || (!range.start && !range.end)) return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return true;
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

/** Ordered list of the last `count` month labels, oldest first. */
function lastMonths(count: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("en-US", { month: "short", year: "2-digit" }));
  }
  return labels;
}

function safeList(
  collectionId: string,
  queries: string[] = [],
): Promise<Record<string, unknown>[]> {
  return appwrite.databases
    .listDocuments(APPWRITE_DATABASE_ID, collectionId, queries)
    .then((result) => result.documents as Record<string, unknown>[])
    .catch(() => []);
}

const isPendingStatus = (status: unknown): boolean => {
  const s = String(status || "pending").toLowerCase();
  return s === "pending" || s === "under_review";
};

// ---------------------------------------------------------------------------
// §20.3 Admin dashboard metrics
// ---------------------------------------------------------------------------

export interface AdminDashboardMetrics {
  totalStudents: number;
  totalTutors: number;
  activeTutors: number;
  pendingTutorApplications: number;
  pendingRecruitmentApplications: number;
  scheduledLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  averageTutorRating: number;
  activeAdvertisements: number;
  totalReviews: number;
  aiAssistantEnabled: boolean;
  /** Lesson volume this calendar month vs. last, as a percentage. Null if there's no prior-month baseline. */
  monthOverMonthLessonGrowthPct: number | null;
}

export async function getAdminDashboardMetrics(range?: DateRange): Promise<AdminDashboardMetrics> {
  const [students, tutors, tutorApps, recruitmentApps, lessons, reviews, ads, aiConfig] =
    await Promise.all([
      DataStore.getAllStudents(),
      DataStore.getAllTutors(),
      DataStore.getTutorApplicationsFromDB(),
      DataStore.getRecruitmentApplicationsFromDB(),
      DataStore.getAllLessons(),
      DataStore.getAllReviews(),
      DataStore.getAdvertisements(),
      DataStore.getPlatformSetting("ai_config"),
    ]);

  const lessonsInRange = lessons.filter((l: Record<string, unknown>) =>
    inRange(l.starts_at as string, range),
  );

  const activeTutors = tutors.filter((t: Record<string, unknown>) => t.is_active !== false).length;
  const ratedTutors = tutors.filter(
    (t: Record<string, unknown>) => typeof t.rating_avg === "number" && t.rating_avg > 0,
  );
  const averageTutorRating = ratedTutors.length
    ? Number(
        (
          ratedTutors.reduce(
            (sum: number, t: Record<string, unknown>) => sum + (t.rating_avg as number),
            0,
          ) / ratedTutors.length
        ).toFixed(2),
      )
    : 0;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthCount = lessons.filter(
    (l: Record<string, unknown>) => new Date(l.starts_at as string) >= thisMonthStart,
  ).length;
  const lastMonthCount = lessons.filter(
    (l: Record<string, unknown>) =>
      new Date(l.starts_at as string) >= lastMonthStart &&
      new Date(l.starts_at as string) < thisMonthStart,
  ).length;
  const monthOverMonthLessonGrowthPct =
    lastMonthCount > 0
      ? Number((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(1))
      : null;

  return {
    totalStudents: students.length,
    totalTutors: tutors.length,
    activeTutors,
    pendingTutorApplications: tutorApps.filter((a: Record<string, unknown>) =>
      isPendingStatus(a.status),
    ).length,
    pendingRecruitmentApplications: recruitmentApps.filter((a: Record<string, unknown>) =>
      isPendingStatus(a.status),
    ).length,
    scheduledLessons: lessonsInRange.filter(
      (l: Record<string, unknown>) => l.status === "scheduled",
    ).length,
    completedLessons: lessonsInRange.filter(
      (l: Record<string, unknown>) => l.status === "completed",
    ).length,
    cancelledLessons: lessonsInRange.filter(
      (l: Record<string, unknown>) => l.status === "cancelled",
    ).length,
    averageTutorRating,
    activeAdvertisements: ads.filter(
      (a: Record<string, unknown>) => (a.isActive ?? a.is_active) === true,
    ).length,
    totalReviews: reviews.length,
    aiAssistantEnabled: aiConfig?.enabled !== false,
    monthOverMonthLessonGrowthPct,
  };
}

// ---------------------------------------------------------------------------
// §20.4 / §20.5 Enrollment growth trend (students + tutors, by month)
// ---------------------------------------------------------------------------

export async function getEnrollmentTrend(
  months = 7,
): Promise<{ month: string; students: number; tutors: number }[]> {
  const labels = lastMonths(months);
  const bucket: Record<string, { students: number; tutors: number }> = {};
  labels.forEach((m) => (bucket[m] = { students: 0, tutors: 0 }));

  const [studentDocs, tutorDocs] = await Promise.all([
    safeList(RAW_COLLECTIONS.USERS, [Query.equal("role", "student"), Query.limit(1000)]),
    safeList(RAW_COLLECTIONS.TUTOR_PROFILES, [Query.limit(1000)]),
  ]);

  for (const doc of studentDocs) {
    const label = monthLabel(doc.$createdAt as string);
    if (bucket[label]) bucket[label].students += 1;
  }
  for (const doc of tutorDocs) {
    const label = monthLabel(doc.$createdAt as string);
    if (bucket[label]) bucket[label].tutors += 1;
  }

  return labels.map((month) => ({ month, ...bucket[month] }));
}

// ---------------------------------------------------------------------------
// §20.6 Lesson volume trend, by month
// ---------------------------------------------------------------------------

export async function getLessonTrend(months = 7): Promise<MonthPoint[]> {
  const labels = lastMonths(months);
  const bucket: Record<string, number> = {};
  labels.forEach((m) => (bucket[m] = 0));

  const lessons = await DataStore.getAllLessons();
  for (const lesson of lessons) {
    const label = monthLabel((lesson as Record<string, unknown>).starts_at as string);
    if (label in bucket) bucket[label] += 1;
  }

  return labels.map((month) => ({ month, value: bucket[month] }));
}

// ---------------------------------------------------------------------------
// §20.4 Top subjects by lesson volume
// ---------------------------------------------------------------------------

export interface SubjectBreakdown {
  subject: string;
  count: number;
  pct: number;
}

export async function getTopSubjects(limit = 6): Promise<SubjectBreakdown[]> {
  const lessons = await DataStore.getAllLessons();
  const counts = new Map<string, number>();
  for (const l of lessons) {
    const subject = (((l as Record<string, unknown>).subject as string) || "").trim();
    if (!subject) continue;
    counts.set(subject, (counts.get(subject) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([subject, count]) => ({
    subject,
    count,
    pct: Math.round((count / max) * 100),
  }));
}

// ---------------------------------------------------------------------------
// §20.7 Recruitment analytics (recruitment-team scoped)
// ---------------------------------------------------------------------------

export interface RecruitmentMetrics {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  total: number;
  approvalRatePct: number;
  /** Applications submitted in the last 30 days. */
  recentlySubmitted: number;
}

export async function getRecruitmentMetrics(): Promise<RecruitmentMetrics> {
  const apps = await DataStore.getRecruitmentApplicationsFromDB();
  const status = (a: Record<string, unknown>) => String(a.status || "pending").toLowerCase();

  const pending = apps.filter((a) => status(a as Record<string, unknown>) === "pending").length;
  const underReview = apps.filter(
    (a) => status(a as Record<string, unknown>) === "under_review",
  ).length;
  const approved = apps.filter((a) => status(a as Record<string, unknown>) === "approved").length;
  const rejected = apps.filter((a) => status(a as Record<string, unknown>) === "rejected").length;
  const decided = approved + rejected;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recentlySubmitted = apps.filter((a: Record<string, unknown>) => {
    const created = (a.created_at || a.createdAt || a.$createdAt) as string;
    return created && new Date(created) >= cutoff;
  }).length;

  return {
    pending,
    underReview,
    approved,
    rejected,
    total: apps.length,
    approvalRatePct: decided > 0 ? Number(((approved / decided) * 100).toFixed(1)) : 0,
    recentlySubmitted,
  };
}

// ---------------------------------------------------------------------------
// §20.13 Exporting
// ---------------------------------------------------------------------------

/** Converts an array of flat objects into an RFC-4180-escaped CSV string. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const s = value == null ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

/** Triggers a browser download of the given rows as a named CSV file. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
