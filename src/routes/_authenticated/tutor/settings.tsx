import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Shield, Save } from "lucide-react";
import { PageHeader, LoadingSpinner } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/settings")({
  component: TutorSettings,
});

function TutorSettings() {
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    lesson_reminders: true,
    announcements: true,
    marketing: false,
  });
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (uid) {
        const saved = await DataStore.getNotificationPreferences(uid);
        if (saved) {
          setPrefs({
            email_notifications: saved.emailNotifications ?? true,
            push_notifications: saved.pushNotifications ?? true,
            lesson_reminders: saved.lessonReminders ?? true,
            announcements: saved.announcements ?? true,
            marketing: saved.marketing ?? false,
          });
        }
      }
    })();
  }, []);

  const handleSavePrefs = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await DataStore.saveNotificationPreferences({ user_id: userId, ...prefs });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.new || !passwords.current) { toast.error("Fill in all password fields."); return; }
    if (passwords.new !== passwords.confirm) { toast.error("Passwords do not match."); return; }
    if (passwords.new.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSavingPassword(true);
    try {
      const result = await appwrite.auth.updatePassword(passwords.new, passwords.current);
      if (result.error) throw result.error;
      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your preferences and account settings." />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { key: "email_notifications", label: "Email Notifications",    desc: "Receive lesson updates and alerts via email" },
              { key: "push_notifications",  label: "Push Notifications",     desc: "Browser push for real-time alerts" },
              { key: "lesson_reminders",    label: "Lesson Reminders",       desc: "Reminders before scheduled lessons" },
              { key: "announcements",       label: "Platform Announcements", desc: "Important platform-wide updates" },
              { key: "marketing",           label: "Marketing Emails",       desc: "Tips, newsletters, and promotional content" },
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
            <Button size="sm" className="gap-2 w-full" onClick={handleSavePrefs} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

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
            <Button className="w-full" onClick={handleChangePassword} disabled={savingPassword || !passwords.current || !passwords.new || !passwords.confirm}>
              {savingPassword ? "Updating…" : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
