import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { PageHeader, StatCard, EmptyState, LoadingSpinner, StatusBadge } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/earnings")({
  component: TutorEarnings,
});

function TutorEarnings() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const data = await DataStore.getPaymentsForTutor(uid);
        setPayments(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const pending   = payments.filter((p) => p.status === "pending");
  const paid      = payments.filter((p) => p.status === "paid");
  const cancelled = payments.filter((p) => p.status === "cancelled" || p.status === "refunded");

  const sum = (arr: any[]) => arr.reduce((s, p) => s + (p.amountGbp || 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = paid
    .filter((p) => p.paidAt && new Date(p.paidAt) >= monthStart)
    .reduce((s, p) => s + (p.amountGbp || 0), 0);

  const fmt = (n: number) => `£${n.toFixed(2)}`;

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Your payment history and outstanding amounts. All values are informational records managed by Alvey."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Outstanding"
          value={fmt(sum(pending))}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
          sub={`${pending.length} pending payment${pending.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={CheckCircle}
          label="Total Paid"
          value={fmt(sum(paid))}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
          sub={`${paid.length} payment${paid.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={fmt(thisMonth)}
          color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
          sub={now.toLocaleString(undefined, { month: "long", year: "numeric" })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payment records yet"
              description="Payment records are created by Alvey when lessons are completed. They'll appear here once available."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 text-left">Description</th>
                    <th className="pb-3 text-left">Period</th>
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">{p.description || "Lesson payment"}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {p.periodStart ? `${fmtDate(p.periodStart)} – ${fmtDate(p.periodEnd)}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {p.status === "paid" ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">{fmt(p.amountGbp || 0)}</td>
                      <td className="py-3 text-right">
                        <StatusBadge status={p.status || "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {payments.length > 0 && (
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={3} className="pt-3 text-xs text-muted-foreground">
                        {payments.length} record{payments.length !== 1 ? "s" : ""}
                      </td>
                      <td className="pt-3 text-right font-bold">{fmt(sum(payments.filter((p) => p.status !== "cancelled" && p.status !== "refunded")))}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
            All financial values are informational records only. Payment processing is handled internally by Alvey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
