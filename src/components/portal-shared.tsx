import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-14 border border-dashed border-border rounded-2xl space-y-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center py-12 ${className}`}>
      <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12 space-y-3">
      <p className="text-sm text-destructive font-medium">
        {message || "Something went wrong. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    under_review: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    "under review":"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    approved:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    rejected:     "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    active:       "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    scheduled:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    completed:    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300",
    cancelled:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    withdrawn:    "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400",
    new:          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    assigned:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    submitted:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    late:         "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    reviewed:     "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300",
    paid:         "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  };
  const cls = styles[status.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" }[size];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dims} rounded-full object-cover shrink-0 bg-muted`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
        <h2 className="font-semibold text-base">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}
