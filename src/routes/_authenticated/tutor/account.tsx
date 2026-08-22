import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Save } from "lucide-react";
import { PageHeader } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tutor/account")({
  component: TutorAccount,
});

function TutorAccount() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    timezone: "GMT+0 (London)",
    language: "",
  });
  const [saving, setSaving] = useState(false);

  // TODO: On mount, load the current user's record via DataStore.getUserRecord(uid)
  // and populate the fields above. On save, write back with DataStore.updateUserRecord(uid, profile).
  const handleSave = () => {
    setSaving(true);
    // TODO: Replace with a real DataStore.updateUserRecord() call.
    setTimeout(() => {
      setSaving(false);
      toast.success("Connect DataStore.updateUserRecord() to persist these changes.");
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="Account Profile"
        description="Manage your personal account information."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <Input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Phone
              </label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Country
              </label>
              <Input
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Timezone
              </label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 h-9 text-sm"
              >
                <option value="GMT+0 (London)">GMT (London)</option>
                <option value="GMT-5 (New York)">EST (New York)</option>
                <option value="GMT-8 (Los Angeles)">PST (Los Angeles)</option>
                <option value="GMT+9 (Seoul)">KST (Seoul)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Preferred Language
              </label>
              <Input
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Changes affecting authentication or identity verification may require additional
            confirmation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
