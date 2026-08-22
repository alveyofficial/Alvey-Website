import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";

export const Route = createFileRoute("/_authenticated/recruitment/activity")({
  component: ActivityLog,
});

function ActivityLog() {
  return (
    <div>
      <PageHeader title="Activity Log" description="Full audit trail of recruitment actions." />
      <EmptyState
        icon={Activity}
        title="Connect the activity log data source"
        description="Create an audit_log collection in Appwrite and write an entry on every application status change. Query it here filtered by the recruitment context, ordered by timestamp descending."
      />
    </div>
  );
}
