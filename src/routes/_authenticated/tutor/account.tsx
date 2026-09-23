import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { User, Save, Upload, Camera } from "lucide-react";
import { PageHeader, LoadingSpinner, Avatar } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DataStore } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/account")({
  component: TutorAccount,
});

const TIMEZONES = [
  "UTC","Europe/London","Europe/Paris","Europe/Berlin","Europe/Amsterdam",
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "Asia/Dubai","Asia/Kolkata","Asia/Singapore","Asia/Tokyo",
  "Australia/Sydney","Pacific/Auckland",
];

function TutorAccount() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    language: "",
  });

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }
      setUserId(uid);

      const [authUser, userRecord, tutorProfile] = await Promise.all([
        Promise.resolve(userData.user),
        DataStore.getUserRecord(uid),
        DataStore.getTutorById(uid),
      ]);

      setProfile({
        fullName: userRecord?.displayName || authUser?.name || "",
        email: userRecord?.email || authUser?.email || "",
        phone: tutorProfile?.phone || "",
        country: tutorProfile?.countryOfResidence || "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        language: tutorProfile?.languages?.[0] || "",
      });

      if (tutorProfile?.avatar_url) setAvatarUrl(tutorProfile.avatar_url);
      setLoading(false);
    })();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingPhoto(true);
    try {
      const { fileId, url } = await DataStore.uploadProfilePicture(file, userId);
      setAvatarUrl(url);
      // Save avatar URL to tutor profile
      const existing = await DataStore.getTutorById(userId);
      if (existing) {
        await DataStore.saveTutor({ ...existing, avatar_url: url });
      }
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // Update display name in auth
      await appwrite.auth.updateName(profile.fullName);
      // Update user record
      await DataStore.saveUserRecord({
        id: userId,
        email: profile.email,
        displayName: profile.fullName,
      });
      // Update tutor profile fields
      const existing = await DataStore.getTutorById(userId);
      if (existing) {
        await DataStore.saveTutor({
          ...existing,
          name: profile.fullName,
          phone: profile.phone,
          countryOfResidence: profile.country,
          languages: profile.language ? [profile.language] : existing.languages,
        });
      }
      toast.success("Account updated successfully.");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Account"
        description="Manage your personal account information."
        action={
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        }
      />

      {/* Profile photo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <Avatar name={profile.fullName || "Tutor"} src={avatarUrl} size="lg" />
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
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or WebP. Max 5 MB. Stored securely in Appwrite Storage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                placeholder="+44 7700 000000"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                placeholder="United Kingdom"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary Language</Label>
              <Input
                placeholder="English"
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
