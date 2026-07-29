import { createFileRoute, Outlet, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";
import { PortalLayout, type NavItem } from "@/components/portal-layout";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Star,
  Bell,
  User,
  Settings,
  DollarSign,
  Megaphone,
  FileText,
  IdCard,
  Briefcase,
  GraduationCap,
  BookOpen,
  FileEdit,
  MessageSquare,
  BarChart3,
  Archive,
  WalletCards,
  ShieldCheck,
  LogOut,
} from "lucide-react";

type Role = "student" | "tutor" | "recruitment" | "website" | "admin";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await appwrite.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthLayout,
});

const studentNav: NavItem[] = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "My Tutors", href: "/my-tutors", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Lesson History", href: "/lessons", icon: Clock },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

const tutorNav: NavItem[] = [
  { name: "Dashboard", href: "/tutor-dashboard", icon: LayoutDashboard },
  { name: "My Students", href: "/tutor-students", icon: Users },
  { name: "Schedule", href: "/tutor-schedule", icon: Calendar },
  { name: "Availability", href: "/tutor-availability", icon: Clock },
  { name: "Advertisement", href: "/tutor-advertisement", icon: Megaphone },
  { name: "Public Profile", href: "/tutor-profile", icon: IdCard },
  { name: "Reviews", href: "/tutor-reviews", icon: Star },
  { name: "Earnings", href: "/tutor-earnings", icon: DollarSign },
  { name: "Notifications", href: "/tutor-notifications", icon: Bell },
  { name: "Profile", href: "/tutor-account", icon: User },
  { name: "Settings", href: "/tutor-settings", icon: Settings },
];

const recruitmentNav: NavItem[] = [
  { name: "Dashboard", href: "/recruitment", icon: LayoutDashboard },
  { name: "Applications", href: "/recruitment/applications", icon: FileText },
  { name: "Candidate Details", href: "/recruitment/candidates", icon: Users },
  { name: "Documents", href: "/recruitment/documents", icon: FileEdit },
  { name: "Internal Notes", href: "/recruitment/notes", icon: MessageSquare },
  { name: "Notifications", href: "/recruitment/notifications", icon: Bell },
  { name: "Activity Log", href: "/recruitment/activity", icon: Clock },
];

const adminNav: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Tutors", href: "/admin/tutors", icon: GraduationCap },
  { name: "Tutor Applications", href: "/admin/tutor-applications", icon: FileText },
  { name: "↳ Archived Tutor Apps", href: "/admin/tutor-applications-archived", icon: Archive },
  { name: "Recruitment Applications", href: "/admin/recruitment-applications", icon: Briefcase },
  { name: "↳ Archived Recruit Apps", href: "/admin/recruitment-applications-archived", icon: Archive },
  { name: "Advertisements", href: "/admin/advertisements", icon: Megaphone },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Scheduling", href: "/admin/scheduling", icon: Calendar },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Pages", href: "/admin/pages", icon: BookOpen },
  { name: "Homepage", href: "/admin/homepage", icon: FileEdit },
  { name: "AI Assistant", href: "/admin/ai-assistant", icon: MessageSquare },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const ownerNav: NavItem[] = [
  ...adminNav,
];

function AuthLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      setEmail(userData.user?.email ?? null);
      if (!uid) {
        setLoading(false);
        return;
      }
      const userRoles = (await DataStore.getUserRoles(uid)) as Role[];
      setRoles(userRoles);
      setLoading(false);
    })();

    const { data: sub } = appwrite.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth", replace: true });
      else setEmail((session as any)?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await appwrite.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isTutor = roles.includes("tutor");
  const isRecruitment = roles.includes("recruitment");
  const isManager = roles.includes("website");
  const isOwner = roles.includes("admin");
  const isAdmin = isManager || isOwner;

  let navItems = studentNav;
  let roleLabel = "Student Portal";
  if (isOwner) {
    navItems = ownerNav;
    roleLabel = "Owner Dashboard";
  } else if (isManager) {
    navItems = adminNav;
    roleLabel = "Admin Dashboard";
  } else if (isRecruitment) {
    navItems = recruitmentNav;
    roleLabel = "Recruitment Portal";
  } else if (isTutor) {
    navItems = tutorNav;
    roleLabel = "Tutor Portal";
  }

  return (
    <PortalLayout email={email} roleLabel={roleLabel} navItems={navItems} onSignOut={signOut}>
      <Outlet />
    </PortalLayout>
  );
}
