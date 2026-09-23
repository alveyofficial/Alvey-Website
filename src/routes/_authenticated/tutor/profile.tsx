import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IdCard, Save, ExternalLink } from "lucide-react";
import { PageHeader, LoadingSpinner } from "@/components/portal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DataStore, type Tutor } from "@/lib/data-store";
import { appwrite } from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/tutor/profile")({
  component: TutorPublicProfile,
});

function TutorPublicProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [form, setForm] = useState({
    headline: "",
    about: "",
    languages: "",
    subjects: "",
    levels: "",
    yearsExperience: "",
    teachingFormat: "",
    oneOnOneRateUsd: "",
    groupRateUsd: "",
    videoLink: "",
    instagramHandle: "",
    highestQualification: "",
    teachingExperience: "",
    examBoard: "",
    examResultSummary: "",
  });

  useEffect(() => {
    (async () => {
      const { data: userData } = await appwrite.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setLoading(false); return; }

      const t = await DataStore.getTutorById(uid);
      if (t) {
        setTutor(t);
        setForm({
          headline: t.headline || "",
          about: t.about || "",
          languages: (t.languages || []).join(", "),
          subjects: (t.subjects || []).join(", "),
          levels: (t.levels || []).join(", "),
          yearsExperience: String(t.years_experience || ""),
          teachingFormat: t.teachingFormat || "",
          oneOnOneRateUsd: String(t.oneOnOneRateUsd || ""),
          groupRateUsd: String(t.groupRateUsd || ""),
          videoLink: t.videoLink || "",
          instagramHandle: t.instagramHandle || "",
          highestQualification: t.highestQualification || "",
          teachingExperience: t.teachingExperience || "",
          examBoard: t.examBoard || "",
          examResultSummary: t.examResultSummary || "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const splitList = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!tutor) { toast.error("Profile not loaded yet."); return; }
    setSaving(true);
    try {
      const updated: Tutor = {
        ...tutor,
        headline: form.headline,
        about: form.about,
        languages: splitList(form.languages),
        subjects: splitList(form.subjects),
        levels: splitList(form.levels),
        years_experience: Number(form.yearsExperience) || 0,
        teachingFormat: form.teachingFormat,
        oneOnOneRateUsd: Number(form.oneOnOneRateUsd) || null,
        groupRateUsd: Number(form.groupRateUsd) || null,
        videoLink: form.videoLink || null,
        instagramHandle: form.instagramHandle || null,
        highestQualification: form.highestQualification || null,
        teachingExperience: form.teachingExperience || null,
        examBoard: form.examBoard || null,
        examResultSummary: form.examResultSummary || null,
      };
      await DataStore.saveTutor(updated);
      setTutor(updated);
      toast.success("Public profile saved.");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!tutor) {
    return (
      <div>
        <PageHeader title="Public Profile" description="Manage how students see you on the marketplace." />
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No tutor profile found. Contact Alvey support if this is unexpected.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Public Profile"
        description="Manage how students see you on the marketplace."
        action={
          <div className="flex gap-2">
            {tutor.slug && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={`/tutors/${tutor.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> View Public Page
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving
                ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <Save className="h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        }
      />

      {/* Status badges */}
      <div className="flex gap-2 mb-6">
        {tutor.is_verified && <Badge className="bg-blue-600 text-white">Verified</Badge>}
        {tutor.is_featured && <Badge className="bg-amber-500 text-white">Featured</Badge>}
        {tutor.rating_avg > 0 && (
          <Badge variant="outline">⭐ {tutor.rating_avg.toFixed(1)} ({tutor.rating_count} reviews)</Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* Core profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IdCard className="h-4 w-4" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Professional Headline</Label>
              <Input
                placeholder="e.g. Expert A-Level Mathematics Tutor"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>About Me</Label>
              <Textarea
                rows={5}
                placeholder="Tell students about yourself, your teaching style, and your experience…"
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Teaching Experience</Label>
                <Textarea
                  rows={3}
                  placeholder="Describe your teaching background…"
                  value={form.teachingExperience}
                  onChange={(e) => setForm({ ...form, teachingExperience: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Highest Qualification</Label>
                <Input
                  placeholder="e.g. BSc Mathematics, University of Oxford"
                  value={form.highestQualification}
                  onChange={(e) => setForm({ ...form, highestQualification: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Exam Board</Label>
                <Input
                  placeholder="e.g. Edexcel, AQA, OCR, Cambridge"
                  value={form.examBoard}
                  onChange={(e) => setForm({ ...form, examBoard: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Exam Result Summary</Label>
                <Input
                  placeholder="e.g. A* in Further Maths"
                  value={form.examResultSummary}
                  onChange={(e) => setForm({ ...form, examResultSummary: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaching Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Subjects <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input
                placeholder="Mathematics, Physics, Chemistry"
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Academic Levels <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input
                placeholder="GCSE, A-Level, IB"
                value={form.levels}
                onChange={(e) => setForm({ ...form, levels: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Languages <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input
                placeholder="English, Arabic"
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min={0}
                value={form.yearsExperience}
                onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teaching Format</Label>
              <Input
                placeholder="Online, In-person, Both"
                value={form.teachingFormat}
                onChange={(e) => setForm({ ...form, teachingFormat: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & Links</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>1-on-1 Rate (USD/hr)</Label>
              <Input
                type="number"
                min={0}
                placeholder="50"
                value={form.oneOnOneRateUsd}
                onChange={(e) => setForm({ ...form, oneOnOneRateUsd: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Group Rate (USD/hr)</Label>
              <Input
                type="number"
                min={0}
                placeholder="30"
                value={form.groupRateUsd}
                onChange={(e) => setForm({ ...form, groupRateUsd: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Intro Video URL</Label>
              <Input
                placeholder="https://youtube.com/…"
                value={form.videoLink}
                onChange={(e) => setForm({ ...form, videoLink: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instagram Handle</Label>
              <Input
                placeholder="@yourhandle"
                value={form.instagramHandle}
                onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
