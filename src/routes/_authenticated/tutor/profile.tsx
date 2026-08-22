import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IdCard, Save, Upload } from "lucide-react";
import { PageHeader } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tutor/profile")({
  component: TutorPublicProfile,
});

function TutorPublicProfile() {
  const [profile, setProfile] = useState({
    headline: "",
    bio: "",
    philosophy: "",
    languages: [] as string[],
    subjects: [] as string[],
    levels: [] as string[],
    yearsExperience: 0,
    qualifications: "",
  });
  const [saving, setSaving] = useState(false);

  // TODO: On mount, load the tutor's profile via DataStore.getTutorProfile(uid)
  // and populate the fields above. On save, write back with DataStore.saveTutorProfile(uid, profile).
  const handleSave = () => {
    setSaving(true);
    // TODO: Replace with a real DataStore.saveTutorProfile() call.
    setTimeout(() => {
      setSaving(false);
      toast.success("Connect DataStore.saveTutorProfile() to persist these changes.");
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="Public Profile"
        description="Manage how students see you on the marketplace."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        }
      />

      {/* TODO: Render Verified / Featured badges once tutor_profiles fields are populated from Appwrite. */}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IdCard className="h-4 w-4" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Professional Headline
            </label>
            <Input
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Biography
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Teaching Philosophy
            </label>
            <textarea
              value={profile.philosophy}
              onChange={(e) => setProfile({ ...profile, philosophy: e.target.value })}
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Languages (comma separated)
              </label>
              <Input
                value={profile.languages.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    languages: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Years of Experience
              </label>
              <Input
                type="number"
                value={profile.yearsExperience}
                onChange={(e) =>
                  setProfile({ ...profile, yearsExperience: Number(e.target.value) })
                }
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Subjects (comma separated)
              </label>
              <Input
                value={profile.subjects.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    subjects: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Academic Levels (comma separated)
              </label>
              <Input
                value={profile.levels.join(", ")}
                onChange={(e) =>
                  setProfile({ ...profile, levels: e.target.value.split(",").map((s) => s.trim()) })
                }
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Qualifications
            </label>
            <Input
              value={profile.qualifications}
              onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photograph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* TODO: Load avatar from Appwrite Storage using the tutor's profile photo file ID. */}
            <div className="h-20 w-20 rounded-2xl border bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Upload New Photo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Profile photo changes may require staff approval.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
