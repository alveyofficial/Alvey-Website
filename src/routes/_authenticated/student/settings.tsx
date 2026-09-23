import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Bell, Shield, Save, Camera, Upload, User } from "lucide-react";
import { PageHeader, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/student/settings")({
  component: StudentSettings,
});

function StudentSettings() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    lesson_reminders: true,
    announcements: true,
    marketing: false,
  });

  const [passwords, setPasswords] = useState({
    current: "", new: "", confirm: "",
  });

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (uid) {
        const [record, prefs] = await Promise.all([
          DataStore.getUserRecord(uid),
          DataStore.getNotificationPreferences(uid),
        ]);
        setDisplayName(record?.displayName || userData.user?.name || "");
        // Students can store avatar in users record if we add avatarUrl field,
        // but for now we use the profile-media bucket convention
        if (record?.avatarUrl) setAvatarUrl(record.avatarUrl);

        if (prefs) {
          setPrefs({
            email_notifications: prefs.emailNotifications ?? true,
            push_notifications: prefs.pushNotifications ?? true,
            lesson_reminders: prefs.lessonReminders ?? true,
            announcements: prefs.announcements ?? true,
            marketing: prefs.marketing ?? false,
          });
        }
      }
      setLoading(false);
    })();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }

    setUploadingPhoto(true);
    try {
      const { fileId, url } = await DataStore.uploadProfilePicture(file, userId);
      setAvatarUrl(url);
      // Save to user record — upsert with avatarUrl
      await DataStore.saveUserRecord({ id: userId, displayName });
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
      // Reset input so same file can be re-selected
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!userId || !displayName.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingProfile(true);
    try {
      await appwrite.auth.updateName(displayName.trim());
      await DataStore.saveUserRecord({ id: userId, displayName: displayName.trim() });
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    try {
      await DataStore.saveNotificationPreferences({ user_id: userId, ...prefs });
      toast.success("Notification preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.new || !passwords.current) { toast.error("Please fill in all password fields."); return; }
    if (passwords.new !== passwords.confirm) { toast.error("New passwords do not match."); return; }
    if (passwords.new.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    setSavingPassword(true);
    try {
      const result = await appwrite.auth.updatePassword(passwords.new, passwords.current);
      if (result.error) throw result.error;
      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password updated successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password. Check your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, notifications, and account security." />

      <div className="space-y-6">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Photo */}
            <div className="flex items-center gap-5">
              <Avatar name={displayName || "Student"} src={avatarUrl} size="lg" />
              <div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => photoRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload className="h-4 w-4" />
                  {uploadingPhoto ? "Uploading…" : "Upload Photo"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">
                  JPG, PNG or WebP · Max 5 MB
                </p>
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1"
                />
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2 shrink-0">
                  <Save className="h-4 w-4" />
                  {savingProfile ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Notification preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "email_notifications",  label: "Email Notifications",    desc: "Receive lesson and account updates via email" },
                { key: "push_notifications",   label: "Push Notifications",     desc: "Browser push alerts for real-time updates" },
                { key: "lesson_reminders",     label: "Lesson Reminders",       desc: "Reminders before your scheduled lessons" },
                { key: "announcements",        label: "Platform Announcements", desc: "Important news from Alvey" },
                { key: "marketing",            label: "Marketing Emails",       desc: "Tips, newsletters, and promotional content" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={prefs[key as keyof typeof prefs]}
                    onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })}
                  />
                </div>
              ))}
              <Button size="sm" className="gap-2 w-full" onClick={handleSavePrefs} disabled={savingPrefs}>
                <Save className="h-4 w-4" /> {savingPrefs ? "Saving…" : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input type="password" placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" placeholder="Min. 8 characters" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
              </div>
              <Button
                className="w-full"
                onClick={handleChangePassword}
                disabled={savingPassword || !passwords.current || !passwords.new || !passwords.confirm}
              >
                {savingPassword ? "Updating…" : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
