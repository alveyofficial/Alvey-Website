import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser, appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Alvey" },
      { name: "description", content: "Sign in or create an account on Alvey." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

async function ensureUserRecord(displayNameHint = "") {
  // getCurrentUser() returns the raw Appwrite Models.User merged with { id }
  const user = await getCurrentUser() as any;
  if (!user) return;
  const uid: string = user.$id || user.id;
  const email: string = user.email ?? "";
  const name: string = user.name || displayNameHint || email.split("@")[0];
  const existing = await DataStore.getUserRecord(uid);

  await DataStore.saveUserRecord({
    id: uid,
    email,
    displayName: name,
    role: existing?.role ?? "student",
  });
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  // On mount: if there's already a session (including OAuth return), sync the
  // user record and redirect to dashboard.
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      console.log("CURRENT USER:", user);

      if (user) {
        console.log("USER FOUND");
        await ensureUserRecord();

        const uid = (user as any).$id || (user as any).id;
        const roles = await DataStore.getUserRoles(uid);

        console.log("Roles:", roles);

        if (roles.includes("tutor")) {
          navigate({ to: "/tutor" });
        } else if (
          roles.includes("owner") ||
          roles.includes("website_manager")
        ) {
          navigate({ to: "/admin" });
        } else if (roles.includes("recruitment")) {
          navigate({ to: "/recruitment" });
        } else {
          navigate({ to: "/student/dashboard" });
        }
      } else {
        console.log("NO USER");
      }
    })();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await appwrite.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = await getCurrentUser();
      if (!user) throw new Error("Failed to load user.");

      await ensureUserRecord();

      const uid = (user as any).$id || (user as any).id;
      const roles = await DataStore.getUserRoles(uid);

      if (roles.includes("tutor")) {
        navigate({ to: "/tutor" });
      } else if (
        roles.includes("owner") ||
        roles.includes("website_manager")
      ) {
        navigate({ to: "/admin" });
      } else if (roles.includes("recruitment")) {
        navigate({ to: "/recruitment" });
      } else {
        navigate({ to: "/student/dashboard" });
      }

      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const name = displayName.trim() || email.split("@")[0];
      const { error } = await appwrite.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) throw error;
      // Write the user record to the database
      await ensureUserRecord(name);
      toast.success("Account created — welcome!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const origin = window.location.origin;
    appwrite.auth.signInWithOAuth("google", { redirect_uri: `${origin}/auth` });
  };

  const handleLinkedIn = () => {
    const origin = window.location.origin;
    appwrite.auth.signInWithOAuth("linkedin", { redirect_uri: `${origin}/auth` });
  };

  const handleDiscord = () => {
    const origin = window.location.origin;
    appwrite.auth.signInWithOAuth("discord", { redirect_uri: `${origin}/auth` });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Alvey
          </Link>
          <CardTitle className="text-2xl mt-2">Welcome</CardTitle>
          <CardDescription>Sign in or create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input
                    id="si-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="si-pw"
                      type={showSignInPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input
                    id="su-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="su-pw"
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleLinkedIn}
              disabled={loading}
            >
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-xs font-bold text-white">
                in
              </span>
              Continue with LinkedIn
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDiscord}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
              </svg>
              Continue with Discord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
