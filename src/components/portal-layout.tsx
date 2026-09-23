import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

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

const SIDEBAR_STATE_KEY = "alvey-sidebar-collapsed";

export function PortalLayout({
  email,
  roleLabel,
  navItems,
  onSignOut,
  children,
}: PortalLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_STATE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  const isActive = (href: string) => {
    if (href === "/student/dashboard" || href === "/tutor/") {
      return currentPath === href;
    }
    return currentPath === href || currentPath.startsWith(href + "/");
  };

  const displayName = email?.split("@")[0] ?? "";

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col border-r bg-card min-h-screen shrink-0 transition-all duration-200 ${
          isCollapsed ? "w-[60px]" : "w-64"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`h-16 flex items-center border-b shrink-0 ${
            isCollapsed ? "justify-center px-0" : "justify-between px-4"
          }`}
        >
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-primary truncate">Alvey</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" title="Alvey">
              <div className="bg-blue-600 h-8 w-8 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 shrink-0 text-muted-foreground ${isCollapsed ? "absolute left-[46px] top-4 z-10 bg-card border shadow-sm rounded-full" : ""}`}
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Role label */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        )}

        {/* Nav items */}
        <div className="flex-1 flex flex-col py-3 overflow-y-auto">
          <nav className={`space-y-0.5 flex-1 ${isCollapsed ? "px-1.5" : "px-2"}`}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-lg transition-colors text-sm font-medium
                    ${isCollapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2"}
                    ${
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Back to website */}
          <div className={`mt-3 pt-3 border-t ${isCollapsed ? "px-1.5" : "px-2"}`}>
            <Link
              to="/"
              title={isCollapsed ? "Back to Alvey Website" : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors
                ${isCollapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2"}`}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Back to Alvey</span>}
            </Link>
          </div>
        </div>

        {/* Footer: email + sign out */}
        <div className={`border-t ${isCollapsed ? "p-2" : "p-3"}`}>
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground truncate mb-2 px-1" title={email ?? ""}>
              {email}
            </div>
          )}
          <Button
            variant="outline"
            className={`text-destructive hover:bg-destructive/5 border-destructive/30 ${
              isCollapsed
                ? "w-10 h-10 p-0 flex items-center justify-center"
                : "w-full justify-start"
            }`}
            onClick={onSignOut}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 h-7 w-7 rounded-md flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-base text-primary">Alvey</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        <div
          className={`md:hidden fixed top-14 left-0 bottom-0 z-50 w-72 bg-card border-r shadow-xl flex flex-col transition-transform duration-200 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-4 py-3 border-b">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-2 py-3 space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              Back to Alvey Website
            </Link>
            <div className="px-1 pb-1">
              <p className="text-xs text-muted-foreground truncate px-2 py-1">{email}</p>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:bg-destructive/5 border-destructive/30"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
