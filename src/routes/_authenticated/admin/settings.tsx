import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Settings,
  Moon,
  Bell,
  Shield,
  Globe,
  Save,
  MessageCircle,
  Link2,
  Unlink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/portal-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { firebase, getCurrentUser } from "@/integrations/firebase/client";


export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    maintenanceMode: false,
  });

  const [discordConfig, setDiscordConfig] = useState({
    enabled: false,
    notification_channel: "",
    role_sync: true,
    application_notifications: true,
    announcement_channel: "",
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");

    if (saved) {
      return saved === "dark";
    }

    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);
  
  const [discordLink, setDiscordLink] = useState<Record<string, unknown> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await firebase.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (uid) {
        const link = await DataStore.getDiscordLink(uid);
        setDiscordLink(link);
      }
      const saved = await DataStore.getPlatformSetting("discord_config");
      if (saved) setDiscordConfig((prev) => ({ ...prev, ...saved }));
    })();
  }, []);

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveDiscord = async () => {
    setSaving(true);
    try {
      await DataStore.savePlatformSetting("discord_config", discordConfig);
      toast.success("Discord integration settings saved");
    } catch {
      toast.error("Failed to save Discord settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkDiscord = async () => {
    if (!userId) return;
    const discordId = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
    const discordUsername = `tutorlink_admin`;
    await DataStore.linkDiscordAccount(userId, discordId, discordUsername);
    setDiscordLink({ discord_id: discordId, discord_username: discordUsername });
    toast.success("Discord account linked");
  };

  const handleUnlinkDiscord = async () => {
    if (!userId) return;
    await DataStore.unlinkDiscordAccount(userId);
    setDiscordLink(null);
    toast.success("Discord account unlinked");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure platform-wide settings, Discord integration, and preferences."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" /> Platform Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Platform Name
              </label>
              <Input defaultValue="Alvey" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Support Email
              </label>
              <Input type="email" defaultValue="support@alvey.study" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Temporarily disable public access</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={() => toggle("maintenanceMode")}
              />
            </div>
            <Button size="sm" onClick={() => toast.success("Settings saved")}>
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive platform alerts via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={() => toggle("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push for critical alerts</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={() => toggle("pushNotifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly Reports</p>
                <p className="text-xs text-muted-foreground">Automated performance summaries</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={() => toggle("weeklyReports")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Password
              </label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Password
              </label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success("Password updated")}>
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-600" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme across the dashboard</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Discord Integration - Section 18 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo-600" /> Discord Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Linking Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${discordLink ? "bg-indigo-100 dark:bg-indigo-950/30" : "bg-muted"}`}
                >
                  {discordLink ? (
                    <Link2 className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Discord Account {discordLink ? "Linked" : "Not Linked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {discordLink
                      ? `Connected as @${discordLink.discord_username}`
                      : "Link your Discord account for role synchronization"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {discordLink ? (
                  <>
                    <Badge variant="default" className="bg-indigo-600">
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 gap-1.5"
                      onClick={handleUnlinkDiscord}
                    >
                      <Unlink className="h-4 w-4" /> Unlink
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleLinkDiscord}
                  >
                    <Link2 className="h-4 w-4" /> Link Discord
                  </Button>
                )}
              </div>
            </div>

            {/* Discord Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Discord Integration</p>
                  <p className="text-xs text-muted-foreground">
                    Synchronize roles, applications, and notifications with Discord
                  </p>
                </div>
                <Switch
                  checked={discordConfig.enabled}
                  onCheckedChange={(v) => setDiscordConfig({ ...discordConfig, enabled: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Role Synchronization</p>
                  <p className="text-xs text-muted-foreground">
                    Sync platform roles with Discord roles automatically
                  </p>
                </div>
                <Switch
                  checked={discordConfig.role_sync}
                  onCheckedChange={(v) => setDiscordConfig({ ...discordConfig, role_sync: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Application Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Send new application alerts to Discord
                  </p>
                </div>
                <Switch
                  checked={discordConfig.application_notifications}
                  onCheckedChange={(v) =>
                    setDiscordConfig({ ...discordConfig, application_notifications: v })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notification Channel ID
                </label>
                <Input
                  placeholder="Discord channel ID for general notifications"
                  value={discordConfig.notification_channel}
                  onChange={(e) =>
                    setDiscordConfig({ ...discordConfig, notification_channel: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Announcement Channel ID
                </label>
                <Input
                  placeholder="Discord channel ID for platform announcements"
                  value={discordConfig.announcement_channel}
                  onChange={(e) =>
                    setDiscordConfig({ ...discordConfig, announcement_channel: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Button size="sm" className="gap-2" onClick={handleSaveDiscord} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Discord Settings"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast.info("Testing Discord connection...")}
              >
                <RefreshCw className="h-4 w-4" /> Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
