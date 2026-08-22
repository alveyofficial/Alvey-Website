import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";

export const Route = createFileRoute("/_authenticated/recruitment/applications")({
  component: RecruitmentApplications,
});

function RecruitmentApplications() {
  return (
    <div>
      <PageHeader
        title="Recruitment Applications"
        description="Review and manage internal team applications."
      />
      <EmptyState
        icon={FileText}
        title="Connect the recruitment applications data source"
        description="Call DataStore.getRecruitmentApplicationsFromDB() and render the results here. Add search and filter by wiring the query to Appwrite's fulltext search or client-side filtering on the returned array."
      />
    </div>
  );
}
