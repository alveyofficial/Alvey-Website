import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";

export const Route = createFileRoute("/_authenticated/tutor/students")({
  component: TutorStudents,
});

function TutorStudents() {
  return (
    <div>
      <PageHeader title="My Students" description="Students currently assigned to you." />
      <EmptyState
        icon={Users}
        title="Connect the student assignments data source"
        description="Query the student_tutor_assignments collection from Appwrite filtered by the current tutor's ID, then join with the users collection to fetch each student's profile, subjects, and remaining lesson count."
      />
    </div>
  );
}
