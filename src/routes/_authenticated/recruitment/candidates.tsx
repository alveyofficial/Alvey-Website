import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";

export const Route = createFileRoute("/_authenticated/recruitment/candidates")({
  component: CandidateDetails,
});

function CandidateDetails() {
  return (
    <div>
      <PageHeader
        title="Candidate Details"
        description="Click a candidate to view their full application."
      />
      <EmptyState
        icon={User}
        title="Connect the candidate data source"
        description="Call DataStore.getRecruitmentApplicationsFromDB() to load real candidates. Wire the Approve / Under Review / Reject buttons to an updateRecruitmentApplicationStatus() method that writes the new status back to Appwrite. Store internal notes and documents in dedicated Appwrite collections linked by application ID."
      />
    </div>
  );
}
