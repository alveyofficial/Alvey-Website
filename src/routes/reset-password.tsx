import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appwrite } from "@/integrations/appwrite/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Sun, Moon, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password · Alvey" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : "",
    secret: typeof search.secret === "string" ? search.secret : "",
  }),
  component: ResetPasswordPage,
});

// ─── Theme hook (same pattern as auth.tsx) ────────────────────────────────────

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return { isDark, toggleTheme };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ResetPasswordPage() {
  const { userId, secret } = Route.useSearch();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // If the link is missing the required params, show an error state immediately.
  const invalidLink = !userId || !secret;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await appwrite.auth.updateRecovery(userId, secret, password);
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      // Appwrite returns a specific error when the token has expired or already been used
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        toast.error("This reset link has expired or already been used. Please request a new one.");
      } else {
        toast.error(msg || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* ── Invalid / missing token ── */}
      {invalidLink && (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
              <svg
                className="h-7 w-7 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <CardTitle className="text-xl">Invalid reset link</CardTitle>
            <CardDescription>
              This password reset link is missing required information, has expired, or has already
              been used. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Success state ── */}
      {!invalidLink && done && (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <CardTitle className="text-xl">Password updated</CardTitle>
            <CardDescription>
              Your password has been reset successfully. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate({ to: "/auth" })}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Reset form ── */}
      {!invalidLink && !done && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              ← Alvey
            </Link>
            <CardTitle className="text-xl mt-2">Set a new password</CardTitle>
            <CardDescription>
              Choose a strong password — at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="rp-pw">New password</Label>
                <div className="relative">
                  <Input
                    id="rp-pw"
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="rp-confirm">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="rp-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`pr-10 ${
                      confirm && password !== confirm
                        ? "border-red-400 focus-visible:ring-red-400/20"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500">Passwords do not match.</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!!confirm && password !== confirm)}
              >
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
