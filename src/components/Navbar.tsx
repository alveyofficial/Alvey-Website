import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, GraduationCap, LayoutDashboard, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";

export function Navbar() {
  const [dashboardRoute, setDashboardRoute] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    let dark = false;

    if (savedTheme === "dark") {
      dark = true;
    } else if (savedTheme === "light") {
      dark = false;
    } else {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);

    appwrite.auth.getSession().then(async ({ data }) => {
      setSession(data.session);

      if (data.session?.user) {
        const uid =
          (data.session.user as any).$id ||
          (data.session.user as any).id;

        const roles = await DataStore.getUserRoles(uid);

        let route: string | null = null;

        if (roles.includes("admin") || roles.includes("website")) {
          route = "/admin";
        } else if (roles.includes("tutor")) {
          route = "/tutor";
        } else if (roles.includes("recruitment")) {
          route = "/recruitment";
        } else if (roles.includes("student")) {
          route = "/student/dashboard";
        }
        setDashboardRoute(route);
        setCanAccessDashboard(route !== null);
      } else {
        setDashboardRoute(null);
        setCanAccessDashboard(false);
      }
    });
    const { data: authSub } = appwrite.auth.onAuthStateChange(async (_e, sesh) => {
      setSession(sesh);

      if (sesh?.user) {
        const uid =
          (sesh.user as any).$id ||
          (sesh.user as any).id;

        const roles = await DataStore.getUserRoles(uid);

        let route: string | null = null;

        if (roles.includes("admin") || roles.includes("website")) {
          route = "/admin";
        } else if (roles.includes("tutor")) {
          route = "/tutor";
        } else if (roles.includes("recruitment")) {
          route = "/recruitment";
        } else if (roles.includes("student")) {
          route = "/student/dashboard";
        }

        setDashboardRoute(route);
        setCanAccessDashboard(route !== null);
      } else {
        setDashboardRoute(null);
        setCanAccessDashboard(false);
      }
    });

    return () => authSub.subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;

    setIsDark(newTheme);

    document.documentElement.classList.toggle("dark", newTheme);

    localStorage.setItem(
      "theme",
      newTheme ? "dark" : "light"
    );
  };

  const handleSignOut = async () => {
    await appwrite.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Find a Tutor", to: "/find-a-tutor" },
    { label: "Apply as a Tutor", to: "/apply" },
    { label: "Work With Us", to: "/work-with-us" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.webp"
            className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
          />

          <div className="leading-none">
            <h1 className="font-black text-xl tracking-tight text-[#164E5E]">
              ALVEY
            </h1>

            <p className="text-[10px] tracking-[0.25em] uppercase text-[#7D868C]">
              Study Better
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeProps={{
                className:
                  "bg-[#164E5E]/10 text-[#164E5E] dark:bg-[#3D7F8F]/20 dark:text-[#6FD4D8] font-semibold",
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl text-muted-foreground hover:text-foreground">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {session ? (
            <div className="flex items-center gap-2">
              {canAccessDashboard && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground rounded-xl"
                >
                  <Link to={dashboardRoute!}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 border-border/80 text-muted-foreground hover:text-foreground rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground font-medium rounded-xl"
              >
                <Link to="/auth">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#164E5E] hover:bg-[#3D7F8F] text-white font-medium px-4 shadow-md shadow-[#164E5E]/10 rounded-xl"
              >
                <Link to="/auth">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {session && canAccessDashboard && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Link to={dashboardRoute!} title="Dashboard">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground p-1.5 focus:outline-none focus:ring-2 focus:ring-[#3D7F8F] rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border/60 bg-background/98 backdrop-blur-lg animate-in slide-in-from-top duration-200">
          <div className="px-4 pt-2 pb-6 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                activeProps={{
                  className:
                    "bg-[#164E5E]/10 text-[#164E5E] dark:bg-[#3D7F8F]/20 dark:text-[#6FD4D8] font-semibold",
                }}
                className="block text-base font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-border/60 space-y-2 px-4">
              {session ? (
                <div className="space-y-2">

                  {canAccessDashboard && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-center gap-2 rounded-xl"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to={dashboardRoute!}>
                        <LayoutDashboard className="h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full justify-center gap-2 text-destructive hover:bg-destructive/5 rounded-xl"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>

                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-[#164E5E] hover:bg-[#3D7F8F] text-white rounded-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/auth">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
