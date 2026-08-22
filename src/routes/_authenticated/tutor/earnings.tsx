import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/tutor/earnings")({
  component: TutorEarnings,
});

function TutorEarnings() {
  return (
    <div>
      <PageHeader title="Earnings" description="Your payment history and upcoming payouts." />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Outstanding"
          value="—"
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Paid"
          value="—"
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value="—"
          color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="Connect the payments data source"
            description="Query the lessons and payments collections from Appwrite, group by week, and aggregate totals per tutor to populate this table."
          />
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
            All financial values are informational records only. Payment processing is handled
            internally by Alvey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
