import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Bell } from "lucide-react";
import { DataStore } from "@/lib/data-store";
import { EmptyState } from "@/components/portal-shared";

type Role = "student" | "tutor" | "recruitment" | "website" | "admin";

export const Route = createFileRoute("/_authenticated/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    email: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const [roles, record] = await Promise.all([
        DataStore.getUserRoles(uid),
        DataStore.getUserRecord(uid),
      ]);
      setRoles((roles ?? []).map((x) => x as Role));
      setProfile({
        display_name: record?.displayName || userData.user?.name || null,
        email: record?.email || userData.user?.email || null,
      });
    })();
  }, []);

  // Is student if they don't have other elevated roles or if they explicitly have student
  const isStudent = roles.includes("student") || roles.length === 0;
  console.log("Current roles state:", roles);
  if (roles.includes("tutor")) {
    return <div>Tutor Dashboard Coming Soon</div>;
  }

  if (roles.includes("admin")) {
    return <div>Owner Dashboard Coming Soon</div>;
  }

  if (roles.includes("website")) {
    return <div>Website Manager Dashboard Coming Soon</div>;
  }

  if (roles.includes("recruitment")) {
    return <div>Recruitment Dashboard Coming Soon</div>;
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}. Here's your
          learning overview.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Tutors</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Lessons</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining Classes</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notifications</p>
              <h3 className="text-2xl font-bold">—</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Calendar}
                title="Coming Soon"
                description="Your upcoming lessons will appear here once scheduling is live."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Latest Updates</CardTitle>
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
    </div>
  );
}
