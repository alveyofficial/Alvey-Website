import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, GraduationCap } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface PortalLayoutProps {
  email: string | null;
  roleLabel: string;
  navItems: NavItem[];
  onSignOut: () => void;
  children: ReactNode;
}

export function PortalLayout({
  email,
  roleLabel,
  navItems,
  onSignOut,
  children,
}: PortalLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-screen shrink-0">
        <div className="h-16 flex items-center px-6 border-b gap-2.5">
          <div className="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <Link to="/" className="font-bold text-lg text-primary">
            Alvey
          </Link>
        </div>
        <div className="px-3 py-2 border-b">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {roleLabel}
          </span>
        </div>
        <div className="flex-1 flex flex-col py-4 px-3 overflow-y-auto">
          <div className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== "/student/dashboard" && currentPath.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 space-y-1 border-t">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Website
            </Link>
          </div>
        </div>
        <div className="p-4 border-t">
          <div
            className="text-xs font-medium mb-3 truncate text-muted-foreground"
            title={email ?? ""}
          >
            {email}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive/5"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <Link to="/" className="font-bold text-lg text-primary">
            Alvey
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 border-b bg-card z-50 p-4 shadow-lg flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pb-1">
              {roleLabel}
            </span>
            {navItems.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== "/student/dashboard" && currentPath.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <div className="border-t my-2 pt-2">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
