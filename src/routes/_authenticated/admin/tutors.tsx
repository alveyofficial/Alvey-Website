import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap, Search, Star, CheckCircle, Plus, Trash2,
  Save, User, Mail, Globe, DollarSign, BookOpen, AlertTriangle,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataStore, Tutor } from "@/lib/data-store";
import { ID, appwrite, APPWRITE_DATABASE_ID } from "@/integrations/appwrite/client";


export const Route = createFileRoute("/_authenticated/admin/tutors")({
  component: AdminTutors,
});
// ---------- Create Tutor Modal ----------
function CreateTutorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  // Required
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [examBoard, setExamBoard] = useState("");
  const [teachingLevel, setTeachingLevel] = useState("");
  const [examResultSummary, setExamResultSummary] = useState("");
  const [teachingExperience, setTeachingExperience] = useState("");
  const [teachingFormat, setTeachingFormat] = useState("one_on_one");
  const [oneOnOneRateUsd, setOneOnOneRateUsd] = useState("0");
  const [groupRateUsd, setGroupRateUsd] = useState("0");
  const [maxGroupStudents, setMaxGroupStudents] = useState("0");
  const [weeklyClassesPerStudent, setWeeklyClassesPerStudent] = useState("1");
  const [classDurationMinutes, setClassDurationMinutes] = useState("60");
  const [bio, setBio] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Optional
  const [instagramHandle, setInstagramHandle] = useState("");
  const [qualificationLink, setQualificationLink] = useState("");
  const [resultDocumentLink, setResultDocumentLink] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [yearsExperience, setYearsExperience] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!highestQualification) {
      toast.error("Please select the highest qualification.");
      return;
    }
    if (!agreedToTerms) {
      toast.error("You must agree to the commission terms.");
      return;
    }
    setLoading(true);
    try {
      const languages = languagesSpoken.split(",").map((l) => l.trim()).filter(Boolean);
      const tutorId = ID.unique();
      const resolvedAvatar = avatarUrl.trim() ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0f172a&color=ffffff&size=256`;
      const resolvedHeadline = headline.trim() || `${subjectName} Tutor`;
      const resolvedRate = parseFloat(hourlyRate) || parseFloat(oneOnOneRateUsd) || 0;
      const resolvedYears = parseInt(yearsExperience) || 1;

      const tutor: Tutor = {
        id: tutorId,
        name: fullName,
        avatar_url: resolvedAvatar,
        headline: resolvedHeadline,
        about: bio,
        hourly_rate: resolvedRate,
        rating_avg: 5.0,
        rating_count: 0,
        years_experience: resolvedYears,
        languages: languages.length > 0 ? languages : ["English"],
        subjects: [subjectName],
        levels: [teachingLevel],
        is_featured: false,
        is_verified: true,
        availability: "Contact for availability",
      };

      await DataStore.saveTutor(tutor);
      // Add to Tutors team
      if (email.trim()) {
        await DataStore.addToTeam("tutors", email.trim(), tutorId);
      }
      await DataStore.logAction("admin_create_tutor", null, { name: fullName, email });
      toast.success("Tutor created successfully.");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create tutor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tutor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
            <div>
              <Label>Discord Username <span className="text-destructive">*</span></Label>
              <Input required value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Highest Qualification <span className="text-destructive">*</span></Label>
              <Select value={highestQualification} onValueChange={setHighestQualification}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select qualification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School / IGCSE / O Levels">High School / IGCSE / O Levels</SelectItem>
                  <SelectItem value="A Levels / AS Levels">A Levels / AS Levels</SelectItem>
                  <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                  <SelectItem value="PhD / Doctorate">PhD / Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Country of Residence <span className="text-destructive">*</span></Label>
              <Input required value={countryOfResidence} onChange={(e) => setCountryOfResidence(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Languages Spoken <span className="text-destructive">*</span></Label>
            <Input required placeholder="English, Arabic" value={languagesSpoken} onChange={(e) => setLanguagesSpoken(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Subject Name <span className="text-destructive">*</span></Label>
              <Input required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            </div>
            <div>
              <Label>Subject Code <span className="text-destructive">*</span></Label>
              <Input required value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Exam Board <span className="text-destructive">*</span></Label>
              <Input required value={examBoard} onChange={(e) => setExamBoard(e.target.value)} />
            </div>
            <div>
              <Label>Teaching Level <span className="text-destructive">*</span></Label>
              <Input required value={teachingLevel} onChange={(e) => setTeachingLevel(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Exam Result Summary <span className="text-destructive">*</span></Label>
            <Input required value={examResultSummary} onChange={(e) => setExamResultSummary(e.target.value)} />
          </div>
          <div>
            <Label>Teaching Experience <span className="text-destructive">*</span></Label>
            <Textarea required className="min-h-[80px]" value={teachingExperience} onChange={(e) => setTeachingExperience(e.target.value)} />
          </div>
          <div>
            <Label>Teaching Format <span className="text-destructive">*</span></Label>
            <RadioGroup value={teachingFormat} onValueChange={setTeachingFormat} className="mt-2 flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one_on_one" id="tf-1" />
                <Label htmlFor="tf-1">One-on-One</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="tf-2" />
                <Label htmlFor="tf-2">Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="tf-3" />
                <Label htmlFor="tf-3">Both</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>One-on-One Rate USD <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" required value={oneOnOneRateUsd} onChange={(e) => setOneOnOneRateUsd(e.target.value)} />
            </div>
            <div>
              <Label>Group Rate USD <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" required value={groupRateUsd} onChange={(e) => setGroupRateUsd(e.target.value)} />
            </div>
            <div>
              <Label>Max Group Students <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" required value={maxGroupStudents} onChange={(e) => setMaxGroupStudents(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Weekly Classes/Student <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" required value={weeklyClassesPerStudent} onChange={(e) => setWeeklyClassesPerStudent(e.target.value)} />
            </div>
            <div>
              <Label>Class Duration (minutes) <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" required value={classDurationMinutes} onChange={(e) => setClassDurationMinutes(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Bio / About <span className="text-destructive">*</span></Label>
            <Textarea required className="min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label>Video Link <span className="text-destructive">*</span></Label>
            <Input type="url" required placeholder="https://youtube.com/..." value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
          </div>

          {/* Optional fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Instagram Handle</Label>
              <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
            </div>
            <div>
              <Label>Qualification Link</Label>
              <Input type="url" placeholder="https://..." value={qualificationLink} onChange={(e) => setQualificationLink(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Result Document Link</Label>
              <Input type="url" placeholder="https://..." value={resultDocumentLink} onChange={(e) => setResultDocumentLink(e.target.value)} />
            </div>
            <div>
              <Label>Avatar URL <span className="text-xs text-muted-foreground">(auto-generated if blank)</span></Label>
              <Input type="url" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Headline <span className="text-xs text-muted-foreground">(auto-generated if blank)</span></Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>
            <div>
              <Label>Hourly Rate USD <span className="text-xs text-muted-foreground">(defaults to one-on-one rate)</span></Label>
              <Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Years Experience</Label>
              <Input type="number" min="0" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Testimonial</Label>
            <Textarea value={testimonial} onChange={(e) => setTestimonial(e.target.value)} />
          </div>
          {/* Commission terms */}
          <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
            <p className="text-sm font-semibold">Commission Terms</p>
            <p className="text-xs text-muted-foreground">
              Alvey keeps 40% from the first month. From the second month onward, tutors keep 100% of their earnings.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox id="admin-terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(v === true)} />
              <label htmlFor="admin-terms" className="text-sm">Agreed to terms</label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Tutor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Add Subject Modal ----------
function AddSubjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Subject name is required.");
      return;
    }
    setLoading(true);
    try {
      await appwrite.databases.createDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: "subjects",
        documentId: ID.unique(),
        data: { name: name.trim(), active: true },
      });
      toast.success("Subject added.");
      setName("");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add subject.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IGCSE/GCSE Maths" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Manage Tutor Modal ----------
function ManageTutorModal({
  tutor,
  onClose,
  onSaved,
}: {
  tutor: Tutor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tutor.name || "");
  const [headline, setHeadline] = useState(tutor.headline || "");
  const [about, setAbout] = useState(tutor.about || "");
  const [hourlyRate, setHourlyRate] = useState(String(tutor.hourly_rate || ""));
  const [yearsExp, setYearsExp] = useState(String(tutor.years_experience || ""));
  const [languages, setLanguages] = useState((tutor.languages || []).join(", "));
  const [subjects, setSubjects] = useState((tutor.subjects || []).join(", "));
  const [levels, setLevels] = useState((tutor.levels || []).join(", "));
  const [isVerified, setIsVerified] = useState(tutor.is_verified ?? true);
  const [isFeatured, setIsFeatured] = useState(tutor.is_featured ?? false);
  const [avatarUrl, setAvatarUrl] = useState(tutor.avatar_url || "");
  const [availability, setAvailability] = useState(tutor.availability || "");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataStore.updateTutorProfile({
        id: tutor.id,
        name: name.trim(),
        headline: headline.trim(),
        about: about.trim(),
        hourly_rate: parseFloat(hourlyRate) || 0,
        years_experience: parseInt(yearsExp) || 0,
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
        levels: levels.split(",").map((l) => l.trim()).filter(Boolean),
        is_verified: isVerified,
        is_featured: isFeatured,
        avatar_url: avatarUrl.trim() || tutor.avatar_url,
        availability: availability.trim(),
      });
      toast.success("Tutor profile updated");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update tutor");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await DataStore.archiveTutor(tutor.id);
      toast.success("Tutor archived");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive tutor");
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" /> Manage Tutor — {tutor.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4 py-2">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>About / Bio</Label>
                <textarea
                  className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>
              <div>
                <Label>Avatar URL</Label>
                <Input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Availability</Label>
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. Mon & Wed 14:00-18:00 UTC"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hourly Rate (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Years Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Languages <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="mt-1"
                  placeholder="English, Arabic"
                />
              </div>
              <div>
                <Label>Subjects <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="mt-1"
                  placeholder="Mathematics, Physics"
                />
              </div>
              <div>
                <Label>Levels <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input
                  value={levels}
                  onChange={(e) => setLevels(e.target.value)}
                  className="mt-1"
                  placeholder="GCSE, A-Level, IB"
                />
              </div>
              {/* Flags */}
              <div className="flex flex-col gap-3 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                  />
                  <span className="text-sm font-medium">Verified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 gap-1.5 sm:mr-auto"
              onClick={() => setConfirmArchive(true)}
              disabled={archiving}
            >
              <Trash2 className="h-4 w-4" /> Archive Tutor
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirmation */}
      {confirmArchive && (
        <Dialog open onOpenChange={() => setConfirmArchive(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Archive {tutor.name}?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              This will deactivate the tutor profile and remove them from search results.
              Their data is preserved and can be restored.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmArchive(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Archiving…</>
                  : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ---------- Subjects Tab ----------
function SubjectsTab() {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const result = await appwrite.databases.listDocuments({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: "subjects",
      });
      setSubjects(
        result.documents.map((d: any) => ({ id: d.$id, name: d.name || "" }))
      );
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await appwrite.databases.deleteDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: "subjects",
        documentId: id,
      });
      toast.success("Subject deleted.");
      loadSubjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subject.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Manage subjects shown in the platform.</p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No Subjects" description="No subjects found." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <AddSubjectModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={loadSubjects} />
    </div>
  );
}

// ---------- Main Page ----------
function AdminTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [managing, setManaging] = useState<Tutor | null>(null);
  const [search, setSearch] = useState("");

  const loadTutors = async () => {
    setLoading(true);
    const data = await DataStore.getAllTutors() as Tutor[];
    setTutors(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTutors();
  }, []);

  const filtered = tutors.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(t.name || "").toLowerCase().includes(q) ||
      String(t.headline || "").toLowerCase().includes(q) ||
      (t.subjects || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <PageHeader title="Tutors & Subjects" description="Manage tutors and subjects on the platform." />

      <Tabs defaultValue="tutors">
        <TabsList className="mb-6">
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="tutors">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Add Tutor
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          ) : tutors.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No Tutors"
              description="No tutors have been approved yet."
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => {
                const isActive = (t as any).is_active ?? true;
                return (
                  <Card key={t.id as string}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                            {(t.name || "T")
                              .toString()
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-1.5">
                              {t.name as string}
                              {t.is_verified && <CheckCircle className="h-4 w-4 text-blue-600" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{(t.headline as string) || "Tutor"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {(t.rating_avg as number) > 0 && (
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-500" /> {t.rating_avg as number} (
                            {t.rating_count as number})
                          </span>
                        )}
                        {t.hourly_rate && <span className="font-medium">${t.hourly_rate as number}/hr</span>}
                        {t.years_experience != null && <span>{t.years_experience as number} yrs exp</span>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManaging(t)}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <CreateTutorModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={loadTutors}
          />
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
      </Tabs>

      {managing && (
        <ManageTutorModal
          tutor={managing}
          onClose={() => setManaging(null)}
          onSaved={() => {
            setManaging(null);
            loadTutors();
          }}
        />
      )}
    </div>
  );
}
