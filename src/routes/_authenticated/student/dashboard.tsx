import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataStore } from "@/lib/data-store";

type Role = "student" | "tutor" | "recruitment" | "website_manager" | "owner";

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

  if (roles.includes("owner")) {
    return <div>Owner Dashboard Coming Soon</div>;
  }

  if (roles.includes("website_manager")) {
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
              <h3 className="text-2xl font-bold">2</h3>
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
              <h3 className="text-2xl font-bold">3</h3>
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
              <h3 className="text-2xl font-bold">8</h3>
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
              <h3 className="text-2xl font-bold">1</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Upcoming Lessons</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/student/dashboard">
                  View Schedule <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {[
                  {
                    tutor: "Sarah Jenkins",
                    subject: "Mathematics",
                    date: "Today",
                    time: "4:00 PM - 5:00 PM",
                  },
                  {
                    tutor: "Michael Chen",
                    subject: "Computer Science",
                    date: "Tomorrow",
                    time: "3:30 PM - 4:30 PM",
                  },
                ].map((lesson, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{lesson.subject}</span>
                      <span className="text-sm text-muted-foreground">with {lesson.tutor}</span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="font-semibold text-primary">{lesson.date}</span>
                      <span className="text-sm text-muted-foreground">{lesson.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Latest Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">New Tutor Assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Michael Chen has been assigned for Computer Science.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-muted flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Lesson Rescheduled</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mathematics lesson moved to 4:00 PM today.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
