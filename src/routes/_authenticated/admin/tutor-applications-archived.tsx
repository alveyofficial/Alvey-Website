import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Search, CheckCircle, RotateCcw } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/admin/tutor-applications-archived")({
  component: ArchivedTutorApplications,
});

function ArchivedTutorApplications() {
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await DataStore.getTutorApplicationsFromDB();
    // Archived = rejected status
    setApplications(data.filter((a) => a.status === "rejected"));
    setLoading(false);
  };

  const handleRestore = async (id: string) => {
    await DataStore.updateTutorApplicationStatus(
      id,
      "pending" as "pending" | "under_review" | "approved" | "rejected",
    );
    toast.success("Application restored to pending");
    loadApplications();
  };

  const handleApproveFromArchive = async (app: Record<string, unknown>) => {
    const id = (app.$id || app.id) as string;
    const name = (app.full_name || app.fullName || "Applicant") as string;
    const email = (app.email || "") as string;
    const userId = (app.applicantUserId || app.applicant_user_id) as string | undefined;

    const subjects = Array.isArray(app.subjects)
      ? (app.subjects as string[])
      : app.subjectName
        ? [(app.subjectName as string)]
        : ["General"];
    const levels = Array.isArray(app.levels)
      ? (app.levels as string[])
      : app.teachingLevel
        ? [(app.teachingLevel as string)]
        : ["General"];
    const languages = Array.isArray(app.languagesSpoken)
      ? (app.languagesSpoken as string[])
      : ["English"];

    const tutorId = userId || `tutor_${id}`;

    await DataStore.updateTutorApplicationStatus(id, "approved");
    await DataStore.saveTutor({
      id: tutorId,
      slug: name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      name,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&size=256`,
      headline: "Professional Educator",
      about: ((app.teachingExperience || app.cover_letter || "") as string),
      hourly_rate: Number(app.oneOnOneRateUsd ?? 40),
      rating_avg: 5.0,
      rating_count: 0,
      years_experience: Number(app.yearsExperience ?? 1),
      languages,
      subjects,
      levels,
      is_featured: false,
      is_verified: true,
      availability: "Contact for availability",
    });
    if (userId) await DataStore.assignUserRole(userId, "tutor");
    if (email) await DataStore.addToTeam("tutors", email, userId);

    toast.success(`${name} approved — tutor profile created and added to Tutors team`);
    loadApplications();
  };

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(a.full_name || a.fullName || "").toLowerCase().includes(q) ||
      String(a.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Archived Tutor Applications"
        description="Rejected tutor applications. You can restore or approve from here."
        action={
          <Link to="/admin/tutor-applications">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Applications
            </Button>
          </Link>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search archived applications…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Archived Applications"
          description="No tutor applications have been rejected yet."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const id = (app.$id || app.id) as string;
            const name = (app.full_name || app.fullName || "Applicant") as string;
            const email = (app.email || "") as string;
            const subjects = Array.isArray(app.subjects)
              ? (app.subjects as string[]).join(", ")
              : String(app.subjectName || "");
            const appliedDate = new Date(
              (app.$createdAt || app.createdAt || app.created_at || Date.now()) as string,
            ).toLocaleDateString();

            return (
              <Card key={id} className="opacity-90">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-700 dark:text-red-400 font-bold text-sm shrink-0">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {email}
                        {subjects ? ` · ${subjects}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">Applied {appliedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="rejected" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleRestore(id)}
                    >
                      <RotateCcw className="h-4 w-4" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                      onClick={() => handleApproveFromArchive(app)}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
