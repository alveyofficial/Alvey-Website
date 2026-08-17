import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { appwrite } from "@/integrations/appwrite/client";
import { DataStore } from "@/lib/data-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";

import {
  User,
  Mail,
  Shield,
  Pencil,
  Save,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function getRoleLabel(role: string) {
  switch (role) {
    case "guest":
      return "Guest";
    case "student":
      return "Student";
    case "tutor":
      return "Tutor";
    case "recruitment":
      return "Recruitment";
    case "website":
      return "Website Manager";
    case "admin":
      return "Administrator";
    default:
      return role || "Guest";
  }
}

function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");

  const loadProfile = async () => {
    setLoading(true);

    try {
      const { data: authData } = await appwrite.auth.getUser();
      const authUser = authData.user;

      if (!authUser) {
        throw new Error("Unable to load your account.");
      }

      const uid = authUser.id;
      const record = await DataStore.getUserRecord(uid);

      const displayName =
        record?.displayName ||
        authUser.name ||
        authUser.email?.split("@")[0] ||
        "User";

      const role = record?.role || "guest";

      const profile: ProfileUser = {
        id: uid,
        name: displayName,
        email: authUser.email || record?.email || "",
        role,
        active: record?.active !== false,
      };

      setUser(profile);
      setName(displayName);
    } catch (error) {
      console.error("Failed to load profile:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Your name cannot be empty.");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Please enter a valid name.");
      return;
    }

    setSaving(true);

    try {
      await appwrite.auth.updateName({
        name: trimmedName,
      });

      await DataStore.saveUserRecord({
        id: user.id,
        email: user.email,
        displayName: trimmedName,
        role: user.role,
      });

      setUser({
        ...user,
        name: trimmedName,
      });

      setName(trimmedName);
      setEditing(false);

      toast.success("Profile updated.");
    } catch (error) {
      console.error("Failed to update profile:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;

    setName(user.name);
    setEditing(false);
  };

  const initials = useMemo(
    () => getInitials(user?.name || "User"),
    [user?.name],
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="mx-auto h-8 w-8 text-muted-foreground" />

            <h2 className="mt-4 text-lg font-semibold">
              Couldn't load your profile
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Please try again.
            </p>

            <Button className="mt-5" onClick={loadProfile}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGuest = user.role === "guest";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      {/* Guest notice */}

      {isGuest && (
        <div className="flex items-start gap-3 rounded-lg border bg-blue-50/60 dark:bg-blue-950/20 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />

          <div className="text-sm">
            <p className="font-medium">
              You're signed in as a guest.
            </p>

            <p className="mt-0.5 text-muted-foreground">
              You can browse the platform and manage your profile.
              Additional features will become available when your
              account receives a specific role.
            </p>
          </div>
        </div>
      )}

      {/* Profile summary */}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="h-20 w-20 shrink-0 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-2xl font-semibold">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold truncate">
                  {user.name}
                </h2>

                <Badge variant="secondary">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {user.email}
                </span>
              </div>
            </div>

            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal information */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Personal information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* Name */}

          <div className="space-y-2">
            <Label htmlFor="profile-name">
              Display name
            </Label>

            {editing ? (
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
                disabled={saving}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {user.name}
                </span>
              </div>
            )}
          </div>

          {/* Email */}

          <div className="space-y-2">
            <Label>
              Email address
            </Label>

            <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm break-all">
                {user.email}
              </span>

              <Badge
                variant="outline"
                className="ml-auto hidden sm:flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Your email is managed by your authentication account.
            </p>
          </div>

          {/* Role */}

          <div className="space-y-2">
            <Label>
              Account role
            </Label>

            <div className="flex items-center gap-3 rounded-md border px-3 py-3">
              <Shield className="h-4 w-4 text-muted-foreground" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {getRoleLabel(user.role)}
                </p>

                <p className="text-xs text-muted-foreground">
                  Your access is based on your account role.
                </p>
              </div>

              <Badge variant="secondary">
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Save / cancel */}

          {editing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account status */}

      <div className="flex items-center gap-3 px-1 text-sm">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />

        <span className="text-muted-foreground">
          Account statis:
        </span>

        <span className="font-medium">
          {user.active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

