import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Calendar,
  Star,
  Bell,
  DollarSign,
  Clock,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/tutor/")({
  component: TutorDashboard,
});

function TutorDashboard() {
  return (
    <div>
      <PageHeader title="Tutor Dashboard" description="Your teaching overview at a glance." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Assigned Students" value="—" />
        <StatCard icon={Calendar} label="Upcoming Lessons" value="—" />
        <StatCard
          icon={Clock}
          label="Weekly Lessons"
          value="—"
          color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value="—"
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        />
        <StatCard
          icon={MessageSquare}
          label="Total Reviews"
          value="—"
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={DollarSign}
          label="Outstanding Payments"
          value="—"
          color="text-purple-600 bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value="—"
          color="text-rose-600 bg-rose-50 dark:bg-rose-950/30"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value="—"
          color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="Coming Soon"
              description="Your upcoming lessons will appear here once scheduling is live."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Bell}
              title="Coming Soon"
              description="Activity and updates will show here once your account is active."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
