import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";

export const Route = createFileRoute("/_authenticated/recruitment/documents")({
  component: RecruitmentDocuments,
});

function RecruitmentDocuments() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="All documents submitted by recruitment candidates."
      />
      <EmptyState
        icon={FileText}
        title="Connect the storage bucket"
        description="Create a dedicated storage bucket for recruitment documents. Store the file path against each application record, then list and fetch files here."
      />
    </div>
  );
}
