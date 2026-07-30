import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { AIChatbot } from "@/components/AIChatbot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 18H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12V18H8V12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4 14C4 14 5 13 8 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 14C20 14 19 13 16 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-bold text-xl text-primary">Alvey</span>
    </div>
  );
}

function PublicLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    appwrite.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = appwrite.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await appwrite.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <AIChatbot />
    </div>
  );
}
