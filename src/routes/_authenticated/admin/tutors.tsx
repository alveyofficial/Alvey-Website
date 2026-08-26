import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Search,
  Star,
  CheckCircle,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { PageHeader, EmptyState } from "@/components/portal-shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "sonner";
import { DataStore, Tutor } from "@/lib/data-store";
import {
  ID,
  appwrite,
  APPWRITE_DATABASE_ID,
} from "@/integrations/appwrite/client";

export const Route = createFileRoute("/_authenticated/admin/tutors")({
  component: AdminTutors,
});

/* =========================================================
   CREATE TUTOR MODAL
========================================================= */

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
  const [weeklyClassesPerStudent, setWeeklyClassesPerStudent] =
    useState("1");
  const [classDurationMinutes, setClassDurationMinutes] =
    useState("60");

  const [bio, setBio] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [instagramHandle, setInstagramHandle] = useState("");
  const [qualificationLink, setQualificationLink] = useState("");
  const [resultDocumentLink, setResultDocumentLink] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [yearsExperience, setYearsExperience] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("");

  const resetForm = () => {
    setFullName("");
    setPhoneNumber("");
    setDiscordUsername("");
    setHighestQualification("");
    setCountryOfResidence("");
    setLanguagesSpoken("");
    setSubjectName("");
    setSubjectCode("");
    setExamBoard("");
    setTeachingLevel("");
    setExamResultSummary("");
    setTeachingExperience("");
    setTeachingFormat("one_on_one");
    setOneOnOneRateUsd("0");
    setGroupRateUsd("0");
    setMaxGroupStudents("0");
    setWeeklyClassesPerStudent("1");
    setClassDurationMinutes("60");
    setBio("");
    setVideoLink("");
    setAgreedToTerms(false);
    setInstagramHandle("");
    setQualificationLink("");
    setResultDocumentLink("");
    setTestimonial("");
    setAvatarUrl("");
    setHeadline("");
    setYearsExperience("1");
    setHourlyRate("");
  };

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
      const languages = languagesSpoken
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const tutorId = ID.unique();

      const resolvedAvatar =
        avatarUrl.trim() ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}&background=0f172a&color=ffffff&size=256`;

      const resolvedHeadline =
        headline.trim() || `${subjectName} Tutor`;

      const resolvedRate =
        parseFloat(hourlyRate) ||
        parseFloat(oneOnOneRateUsd) ||
        0;

      const resolvedYears = parseInt(yearsExperience) || 1;

      const tutor: Tutor = {
        id: tutorId,
        name: fullName,
        slug: (fullName || subjectName || tutorId)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        avatar_url: resolvedAvatar,
        headline: resolvedHeadline,
        about: bio,
        hourly_rate: resolvedRate,
        rating_avg: 5.0,
        rating_count: 0,
        years_experience: resolvedYears,
        languages:
          languages.length > 0 ? languages : ["English"],
        subjects: [subjectName],
        levels: [teachingLevel],
        is_featured: false,
        is_verified: true,
        availability: "Contact for availability",
      };

      await DataStore.saveTutor(tutor);

      if (email.trim()) {
        await DataStore.addToTeam("tutors", email.trim());
      }

      toast.success("Tutor created successfully.");

      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to create tutor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            Add Tutor
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 py-2"
        >
          {/* BASIC INFORMATION */}
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Basic Information
              </h3>
              <p className="text-sm text-muted-foreground">
                Personal and contact details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Full Name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="e.g. John Smith"
                />
              </div>


              <div className="space-y-1.5">
                <Label>
                  Phone Number{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value)
                  }
                  placeholder="+92..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Discord Username{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={discordUsername}
                  onChange={(e) =>
                    setDiscordUsername(e.target.value)
                  }
                  placeholder="username"
                />
              </div>
            </div>
          </section>

          {/* QUALIFICATION */}
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Qualification & Location
              </h3>
              <p className="text-sm text-muted-foreground">
                Academic background and languages.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Highest Qualification{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={highestQualification}
                  onValueChange={setHighestQualification}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="High School / IGCSE / O Levels">
                      High School / IGCSE / O Levels
                    </SelectItem>
                    <SelectItem value="A Levels / AS Levels">
                      A Levels / AS Levels
                    </SelectItem>
                    <SelectItem value="Bachelor's Degree">
                      Bachelor's Degree
                    </SelectItem>
                    <SelectItem value="Master's Degree">
                      Master's Degree
                    </SelectItem>
                    <SelectItem value="PhD / Doctorate">
                      PhD / Doctorate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Country of Residence{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={countryOfResidence}
                  onChange={(e) =>
                    setCountryOfResidence(e.target.value)
                  }
                  placeholder="e.g. Pakistan"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Languages Spoken{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="English, Arabic"
                value={languagesSpoken}
                onChange={(e) =>
                  setLanguagesSpoken(e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple languages with commas.
              </p>
            </div>
          </section>

          {/* SUBJECT */}
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Teaching Information
              </h3>
              <p className="text-sm text-muted-foreground">
                Subject, curriculum and experience.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Subject Name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={subjectName}
                  onChange={(e) =>
                    setSubjectName(e.target.value)
                  }
                  placeholder="Mathematics"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Subject Code{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={subjectCode}
                  onChange={(e) =>
                    setSubjectCode(e.target.value)
                  }
                  placeholder="MATH-101"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Exam Board{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={examBoard}
                  onChange={(e) =>
                    setExamBoard(e.target.value)
                  }
                  placeholder="Cambridge / Edexcel"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Teaching Level{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={teachingLevel}
                  onChange={(e) =>
                    setTeachingLevel(e.target.value)
                  }
                  placeholder="IGCSE / A-Level"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Exam Result Summary{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                value={examResultSummary}
                onChange={(e) =>
                  setExamResultSummary(e.target.value)
                }
                placeholder="A* in Mathematics"
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Teaching Experience{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                required
                className="min-h-[100px]"
                value={teachingExperience}
                onChange={(e) =>
                  setTeachingExperience(e.target.value)
                }
                placeholder="Describe previous teaching experience..."
              />
            </div>
          </section>

          {/* PRICING */}
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Teaching Format & Pricing
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure how this tutor teaches students.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <Label>Teaching Format</Label>

              <RadioGroup
                value={teachingFormat}
                onValueChange={setTeachingFormat}
                className="mt-3 grid gap-3 sm:grid-cols-3"
              >
                {[
                  ["one_on_one", "One-on-One"],
                  ["group", "Group"],
                  ["both", "Both"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    htmlFor={`format-${value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50"
                  >
                    <RadioGroupItem
                      value={value}
                      id={`format-${value}`}
                    />
                    <span className="text-sm font-medium">
                      {label}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>
                  One-on-One Rate (USD){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={oneOnOneRateUsd}
                  onChange={(e) =>
                    setOneOnOneRateUsd(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Group Rate (USD){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={groupRateUsd}
                  onChange={(e) =>
                    setGroupRateUsd(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Max Group Students{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={maxGroupStudents}
                  onChange={(e) =>
                    setMaxGroupStudents(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Weekly Classes / Student{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={weeklyClassesPerStudent}
                  onChange={(e) =>
                    setWeeklyClassesPerStudent(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Class Duration (minutes){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={classDurationMinutes}
                  onChange={(e) =>
                    setClassDurationMinutes(e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          {/* PROFILE */}
          <section className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Public Profile
              </h3>
              <p className="text-sm text-muted-foreground">
                Information students will see.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Bio / About{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                required
                className="min-h-[110px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short introduction..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Video Link{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="url"
                required
                placeholder="https://youtube.com/..."
                value={videoLink}
                onChange={(e) =>
                  setVideoLink(e.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Instagram Handle</Label>
                <Input
                  value={instagramHandle}
                  onChange={(e) =>
                    setInstagramHandle(e.target.value)
                  }
                  placeholder="@username"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Qualification Link</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={qualificationLink}
                  onChange={(e) =>
                    setQualificationLink(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Result Document Link</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={resultDocumentLink}
                  onChange={(e) =>
                    setResultDocumentLink(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Avatar URL
                  <span className="ml-1 text-xs text-muted-foreground">
                    (auto-generated if blank)
                  </span>
                </Label>

                <Input
                  type="url"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) =>
                    setAvatarUrl(e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Headline
                  <span className="ml-1 text-xs text-muted-foreground">
                    (auto-generated if blank)
                  </span>
                </Label>
                <Input
                  value={headline}
                  onChange={(e) =>
                    setHeadline(e.target.value)
                  }
                  placeholder="Experienced Mathematics Tutor"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Hourly Rate (USD)
                  <span className="ml-1 text-xs text-muted-foreground">
                    (defaults to one-on-one rate)
                  </span>
                </Label>

                <Input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) =>
                    setHourlyRate(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Years Experience</Label>
              <Input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(e.target.value)
                }
                className="sm:max-w-[200px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Testimonial</Label>
              <Textarea
                value={testimonial}
                onChange={(e) =>
                  setTestimonial(e.target.value)
                }
                placeholder="Optional student testimonial..."
              />
            </div>
          </section>

          {/* TERMS */}
          <section className="rounded-xl border bg-muted/30 p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">
                  Commission Terms
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Alvey keeps 40% from the first month.
                  From the second month onward, tutors
                  keep 100% of their earnings.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="admin-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(value) =>
                    setAgreedToTerms(value === true)
                  }
                />

                <label
                  htmlFor="admin-terms"
                  className="cursor-pointer text-sm font-medium"
                >
                  I confirm that the tutor has agreed
                  to these commission terms.
                </label>
              </div>
            </div>
          </section>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="min-w-[130px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tutor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   ADD SUBJECT MODAL
========================================================= */

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

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
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
        data: {
          name: name.trim(),
          active: true,
        },
      });

      toast.success("Subject added.");
      setName("");

      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to add subject."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >
          <div className="space-y-1.5">
            <Label>
              Subject Name{" "}
              <span className="text-destructive">*</span>
            </Label>

            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IGCSE/GCSE Maths"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* =========================================================
   MANAGE TUTOR MODAL
========================================================= */

function ManageTutorModal({
  tutor,
  onClose,
  onSaved,
}: {
  tutor: Tutor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // BASIC
  const [name, setName] = useState(tutor.name || "");
  const [phone, setPhone] = useState(tutor.phone || "");
  const [discordUsername, setDiscordUsername] =
    useState(tutor.discordUsername || "");
  const [country, setCountry] = useState(
    tutor.countryOfResidence || ""
  );

  // QUALIFICATION
  const [qualification, setQualification] =
    useState(tutor.highestQualification || "");

  const [qualificationLink, setQualificationLink] =
    useState(tutor.highestQualificationLink || "");

  const [examBoard, setExamBoard] =
    useState(tutor.examBoard || "");

  const [examResult, setExamResult] =
    useState(tutor.examResultSummary || "");

  const [resultLink, setResultLink] =
    useState(tutor.resultDocumentLink || "");

  // TEACHING
  const [languages, setLanguages] = useState(
    (tutor.languages || []).join(", ")
  );

  const [subjects, setSubjects] = useState(
    (tutor.subjects || []).join(", ")
  );

  const [levels, setLevels] = useState(
    (tutor.levels || []).join(", ")
  );

  const [teachingExperience, setTeachingExperience] =
    useState(tutor.teachingExperience || "");

  const [teachingFormat, setTeachingFormat] =
    useState(tutor.teachingFormat || "one_on_one");

  // PRICING
  const [oneOnOneRate, setOneOnOneRate] =
    useState(String(tutor.oneOnOneRateUsd ?? ""));

  const [groupRate, setGroupRate] =
    useState(String(tutor.groupRateUsd ?? ""));

  const [maxStudents, setMaxStudents] =
    useState(String(tutor.maxGroupStudents ?? ""));

  const [weeklyClasses, setWeeklyClasses] =
    useState(String(tutor.weeklyClassesPerStudent ?? ""));

  const [duration, setDuration] =
    useState(String(tutor.classDurationMinutes ?? 60));

  const [hourlyRate, setHourlyRate] =
    useState(String(tutor.hourly_rate ?? ""));

  // PROFILE
  const [headline, setHeadline] =
    useState(tutor.headline || "");

  const [about, setAbout] =
    useState(tutor.about || "");

  const [avatarUrl, setAvatarUrl] =
    useState(tutor.avatar_url || "");

  const [videoLink, setVideoLink] =
    useState(tutor.videoLink || "");

  const [instagram, setInstagram] =
    useState(tutor.instagramHandle || "");

  const [testimonial, setTestimonial] =
    useState(tutor.testimonial || "");

  const [yearsExp, setYearsExp] =
    useState(String(tutor.years_experience ?? ""));

  const [availability, setAvailability] =
    useState(tutor.availability || "");

  const [responseTime, setResponseTime] =
    useState(tutor.responseTime || "");

  const [qualificationFileUrl, setQualificationFileUrl] =
    useState(tutor.highestQualificationFileUrl || "");

  const [qualificationFileName, setQualificationFileName] =
    useState(tutor.highestQualificationFileName || "");

  const [resultFileUrl, setResultFileUrl] =
    useState(tutor.resultDocumentFileUrl || "");

  const [resultFileName, setResultFileName] =
    useState(tutor.resultDocumentFileName || "");
  // STATUS
  const [verified, setVerified] =
    useState(tutor.is_verified ?? false);

  const [featured, setFeatured] =
    useState(tutor.is_featured ?? false);

  const handleSave = async () => {
    setSaving(true);

    try {
      await DataStore.updateTutorProfile({
        id: tutor.id,

        // BASIC
        name: name.trim(),
        phone: phone.trim(),
        discordUsername: discordUsername.trim(),
        countryOfResidence: country.trim(),

        // QUALIFICATION
        highestQualification: qualification,
        highestQualificationLink: qualificationLink.trim(),
        highestQualificationFileUrl:
          qualificationFileUrl.trim() || null,
        highestQualificationFileName:
          qualificationFileName.trim(),

        examBoard: examBoard.trim(),
        examResultSummary: examResult.trim(),

        resultDocumentLink: resultLink.trim(),
        resultDocumentFileUrl:
          resultFileUrl.trim() || null,
        resultDocumentFileName:
          resultFileName.trim(),

        // TEACHING
        languages: languages
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

        subjects: subjects
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

        levels: levels
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

        teachingExperience:
          teachingExperience.trim(),

        teachingFormat,

        // PRICING
        hourly_rate:
          Number(hourlyRate) || 0,

        oneOnOneRateUsd:
          Number(oneOnOneRate) || 0,

        groupRateUsd:
          Number(groupRate) || 0,

        maxGroupStudents:
          Number(maxStudents) || 1,

        weeklyClassesPerStudent:
          Number(weeklyClasses) || 1,

        classDurationMinutes:
          Number(duration) || 60,

        // PROFILE
        headline: headline.trim(),

        about: about.trim(),

        avatar_url:
          avatarUrl.trim(),

        videoLink:
          videoLink.trim(),

        instagramHandle:
          instagram.trim(),

        testimonial:
          testimonial.trim(),

        years_experience:
          Number(yearsExp) || 0,

        availability:
          availability.trim(),

        responseTime:
          responseTime.trim(),

        // STATUS
        is_verified:
          verified,

        is_featured:
          featured,
      });
      toast.success("Tutor profile updated successfully.");

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.message ||
        "Failed to update tutor."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);

    try {
      await DataStore.archiveTutor(tutor.id);

      toast.success("Tutor archived.");

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.message ||
        "Failed to archive tutor."
      );
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(value) => {
          if (!value) onClose();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p>Manage Tutor</p>
                <p className="text-sm font-normal text-muted-foreground">
                  Edit complete tutor profile
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                Basic
              </TabsTrigger>

              <TabsTrigger value="teaching">
                Teaching
              </TabsTrigger>

              <TabsTrigger value="pricing">
                Pricing
              </TabsTrigger>

              <TabsTrigger value="profile">
                Profile
              </TabsTrigger>

              <TabsTrigger value="status">
                Status
              </TabsTrigger>
            </TabsList>

            {/* BASIC */}
            <TabsContent
              value="basic"
              className="space-y-5 pt-5"
            >
              <div>
                <h3 className="font-semibold">
                  Basic Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personal and contact information.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <Input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />
                </Field>

                <Field label="Phone">
                  <Input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                  />
                </Field>

                <Field label="Discord Username">
                  <Input
                    value={discordUsername}
                    onChange={(e) =>
                      setDiscordUsername(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Country of Residence">
                  <Input
                    value={country}
                    onChange={(e) =>
                      setCountry(e.target.value)
                    }
                  />
                </Field>

                <Field label="Highest Qualification">
                  <Select
                    value={qualification}
                    onValueChange={setQualification}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="High School / IGCSE / O Levels">
                        High School / IGCSE / O Levels
                      </SelectItem>

                      <SelectItem value="A Levels / AS Levels">
                        A Levels / AS Levels
                      </SelectItem>

                      <SelectItem value="Bachelor's Degree">
                        Bachelor's Degree
                      </SelectItem>

                      <SelectItem value="Master's Degree">
                        Master's Degree
                      </SelectItem>

                      <SelectItem value="PhD / Doctorate">
                        PhD / Doctorate
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Qualification Link">
                <Input
                  type="url"
                  value={qualificationLink}
                  onChange={(e) =>
                    setQualificationLink(
                      e.target.value
                    )
                  }
                />
              </Field>
              <Field label="Qualification File URL">
                <Input
                  type="url"
                  value={qualificationFileUrl}
                  onChange={(e) =>
                    setQualificationFileUrl(e.target.value)
                  }
                  placeholder="https://..."
                />
              </Field>

              <Field label="Qualification File Name">
                <Input
                  value={qualificationFileName}
                  onChange={(e) =>
                    setQualificationFileName(e.target.value)
                  }
                  placeholder="Degree.pdf"
                />
              </Field>
            </TabsContent>

            {/* TEACHING */}
            <TabsContent
              value="teaching"
              className="space-y-5 pt-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Subjects">
                  <Input
                    value={subjects}
                    onChange={(e) =>
                      setSubjects(e.target.value)
                    }
                    placeholder="Mathematics, Physics"
                  />
                </Field>

                <Field label="Levels">
                  <Input
                    value={levels}
                    onChange={(e) =>
                      setLevels(e.target.value)
                    }
                    placeholder="GCSE, A-Level"
                  />
                </Field>

                <Field label="Languages">
                  <Input
                    value={languages}
                    onChange={(e) =>
                      setLanguages(e.target.value)
                    }
                    placeholder="English, Urdu"
                  />
                </Field>

                <Field label="Exam Board">
                  <Input
                    value={examBoard}
                    onChange={(e) =>
                      setExamBoard(e.target.value)
                    }
                    placeholder="Cambridge / Edexcel"
                  />
                </Field>
              </div>

              <Field label="Exam Result Summary">
                <Input
                  value={examResult}
                  onChange={(e) =>
                    setExamResult(e.target.value)
                  }
                  placeholder="A* in Mathematics"
                />
              </Field>

              <Field label="Result Document Link">
                <Input
                  type="url"
                  value={resultLink}
                  onChange={(e) =>
                    setResultLink(e.target.value)
                  }
                />
              </Field>

              <Field label="Result Document File URL">
                <Input
                  type="url"
                  value={resultFileUrl}
                  onChange={(e) =>
                    setResultFileUrl(e.target.value)
                  }
                  placeholder="https://..."
                />
              </Field>

              <Field label="Result Document File Name">
                <Input
                  value={resultFileName}
                  onChange={(e) =>
                    setResultFileName(e.target.value)
                  }
                  placeholder="Results.pdf"
                />
              </Field>

              <Field label="Teaching Experience">
                <Textarea
                  className="min-h-[140px]"
                  value={teachingExperience}
                  onChange={(e) =>
                    setTeachingExperience(
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Teaching Format">
                <RadioGroup
                  value={teachingFormat}
                  onValueChange={setTeachingFormat}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {[
                    ["one_on_one", "One-on-One"],
                    ["group", "Group"],
                    ["both", "Both"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <RadioGroupItem value={value} />
                      <span className="text-sm font-medium">
                        {label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            </TabsContent>

            {/* PRICING */}
            <TabsContent
              value="pricing"
              className="space-y-5 pt-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="One-on-One Rate (USD)">
                  <Input
                    type="number"
                    min="0"
                    value={oneOnOneRate}
                    onChange={(e) =>
                      setOneOnOneRate(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Group Rate (USD)">
                  <Input
                    type="number"
                    min="0"
                    value={groupRate}
                    onChange={(e) =>
                      setGroupRate(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Hourly Rate (USD)">
                  <Input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) =>
                      setHourlyRate(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Max Group Students">
                  <Input
                    type="number"
                    min="0"
                    value={maxStudents}
                    onChange={(e) =>
                      setMaxStudents(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Weekly Classes / Student">
                  <Input
                    type="number"
                    min="0"
                    value={weeklyClasses}
                    onChange={(e) =>
                      setWeeklyClasses(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Class Duration (minutes)">
                  <Input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) =>
                      setDuration(
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </TabsContent>

            {/* PROFILE */}
            <TabsContent
              value="profile"
              className="space-y-5 pt-5"
            >
              <Field label="Headline">
                <Input
                  value={headline}
                  onChange={(e) =>
                    setHeadline(e.target.value)
                  }
                />
              </Field>

              <Field label="About / Bio">
                <Textarea
                  className="min-h-[150px]"
                  value={about}
                  onChange={(e) =>
                    setAbout(e.target.value)
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Avatar URL">
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) =>
                      setAvatarUrl(e.target.value)
                    }
                  />
                </Field>

                <Field label="Video Link">
                  <Input
                    type="url"
                    value={videoLink}
                    onChange={(e) =>
                      setVideoLink(e.target.value)
                    }
                  />
                </Field>

                <Field label="Instagram Handle">
                  <Input
                    value={instagram}
                    onChange={(e) =>
                      setInstagram(e.target.value)
                    }
                    placeholder="@username"
                  />
                </Field>

                <Field label="Years Experience">
                  <Input
                    type="number"
                    min="0"
                    value={yearsExp}
                    onChange={(e) =>
                      setYearsExp(e.target.value)
                    }
                  />
                </Field>

                <Field label="Availability">
                  <Input
                    value={availability}
                    onChange={(e) =>
                      setAvailability(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Response Time">
                  <Input
                    value={responseTime}
                    onChange={(e) =>
                      setResponseTime(
                        e.target.value
                      )
                    }
                    placeholder="Within 24 hours"
                  />
                </Field>
              </div>

              <Field label="Testimonial">
                <Textarea
                  value={testimonial}
                  onChange={(e) =>
                    setTestimonial(e.target.value)
                  }
                  placeholder="Optional student testimonial..."
                />
              </Field>
            </TabsContent>

            {/* STATUS */}
            <TabsContent
              value="status"
              className="space-y-5 pt-5"
            >
              <div className="rounded-xl border bg-muted/20 p-5">
                <h3 className="font-semibold">
                  Profile Status
                </h3>

                <div className="mt-4 space-y-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={verified}
                      onCheckedChange={(v) =>
                        setVerified(v === true)
                      }
                    />

                    <div>
                      <p className="font-medium">
                        Verified
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Mark the tutor as verified.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={featured}
                      onCheckedChange={(v) =>
                        setFeatured(v === true)
                      }
                    />

                    <div>
                      <p className="font-medium">
                        Featured
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Display this tutor as featured.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                <h3 className="font-semibold text-destructive">
                  Danger Zone
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Archiving removes this tutor from
                  active search results while preserving
                  their data.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  null: if u do this their chai will be stolen.
                </p>
                <Button
                  variant="destructive"
                  className="mt-4"
                  onClick={() =>
                    setConfirmArchive(true)
                  }
                  disabled={archiving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Archive Tutor
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={onClose}
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
                  Save All Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE CONFIRM */}
      <Dialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Archive Tutor?
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to archive{" "}
            <strong>{tutor.name}</strong>?
            Their data will be preserved.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmArchive(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving
                ? "Archiving..."
                : "Archive Tutor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* =========================================================
   SUBJECTS TAB
========================================================= */

function SubjectsTab() {
  const [subjects, setSubjects] = useState<
    { id: string; name: string }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);

    try {
      const result =
        await appwrite.databases.listDocuments({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: "subjects",
        });

      setSubjects(
        result.documents.map((doc: any) => ({
          id: doc.$id,
          name: doc.name || "",
        }))
      );
    } catch {
      setSubjects([]);
      toast.error("Failed to load subjects.");
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
      toast.error(
        err?.message || "Failed to delete subject."
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">
            Platform Subjects
          </p>
          <p className="text-sm text-muted-foreground">
            Manage subjects available across Alvey.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Subjects"
          description="No subjects have been added yet."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="group flex items-center justify-between p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>

                    <span className="text-sm font-medium">
                      {subject.name}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive opacity-70 hover:text-destructive group-hover:opacity-100"
                    onClick={() =>
                      handleDelete(subject.id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddSubjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={loadSubjects}
      />
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function AdminTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [managing, setManaging] = useState<Tutor | null>(null);

  const [search, setSearch] = useState("");

  const loadTutors = async () => {
    setLoading(true);

    try {
      const data =
        (await DataStore.getAllTutors()) as Tutor[];

      setTutors(data);
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to load tutors."
      );

      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  const filtered = tutors.filter((tutor) => {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      String(tutor.name || "")
        .toLowerCase()
        .includes(q) ||
      String(tutor.headline || "")
        .toLowerCase()
        .includes(q) ||
      (tutor.subjects || []).some((subject) =>
        subject.toLowerCase().includes(q)
      )
    );
  });

  const activeCount = tutors.filter(
    (tutor) =>
      (tutor as any).is_active ?? true
  ).length;

  const verifiedCount = tutors.filter(
    (tutor) => tutor.is_verified
  ).length;

  const featuredCount = tutors.filter(
    (tutor) => tutor.is_featured
  ).length;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            Administration
            <span>/</span>
            Tutors
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tutors & Subjects
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage tutor profiles, visibility, pricing and
            platform subjects.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => setCreateOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Tutor
        </Button>
      </div>

      {/* OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total tutors
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {tutors.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {activeCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Verified
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {verifiedCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Featured
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {featuredCount}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="tutors">
        <div className="flex items-center justify-between border-b">
          <TabsList className="h-11 bg-transparent p-0">
            <TabsTrigger
              value="tutors"
              className="h-11 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Tutors

              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                {tutors.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="subjects"
              className="h-11 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Subjects
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TUTORS */}
        <TabsContent
          value="tutors"
          className="mt-6 space-y-6"
        >
          {/* SEARCH */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search by tutor name, subject or headline..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="h-11 border-0 bg-muted/40 pl-10 shadow-none focus-visible:ring-1"
                />
              </div>

              {search && (
                <Button
                  variant="ghost"
                  onClick={() => setSearch("")}
                >
                  Clear
                </Button>
              )}

              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-2 lg:hidden"
              >
                <Plus className="h-4 w-4" />
                Add Tutor
              </Button>
            </div>

            {!loading && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {search
                    ? `Showing ${filtered.length} of ${tutors.length} tutors`
                    : `${tutors.length} tutors available`}
                </span>

                {search && (
                  <span>
                    Search results
                  </span>
                )}
              </div>
            )}
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden"
                >
                  <CardContent className="p-5">
                    <div className="animate-pulse space-y-5">
                      <div className="flex gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted" />

                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 rounded bg-muted" />
                          <div className="h-3 w-24 rounded bg-muted" />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="h-6 w-20 rounded-full bg-muted" />
                        <div className="h-6 w-16 rounded-full bg-muted" />
                      </div>

                      <div className="h-12 rounded-lg bg-muted" />

                      <div className="h-9 rounded-lg bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No tutors yet"
              description="Add your first tutor to start building the platform."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No tutors found"
              description={`Nothing matches "${search}". Try another search.`}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((tutor) => {
                const isActive =
                  (tutor as any).is_active ?? true;

                const initials = String(
                  tutor.name || "Tutor"
                )
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <Card
                    key={String(tutor.id)}
                    className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    {/* FEATURED STRIP */}
                    {tutor.is_featured && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                    )}

                    <CardContent className="p-5">
                      {/* TOP */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-bold text-primary ring-1 ring-border">
                              {tutor.avatar_url ? (
                                <img
                                  src={tutor.avatar_url}
                                  alt={tutor.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>

                            {isActive && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold">
                                {tutor.name}
                              </p>

                              {tutor.is_verified && (
                                <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                              )}
                            </div>

                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {tutor.headline || "Tutor"}
                            </p>
                          </div>
                        </div>

                        {tutor.is_featured && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-500/30 bg-amber-500/5 text-amber-600"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      {/* SUBJECTS */}
                      <div className="mt-5 min-h-[28px]">
                        {(tutor.subjects || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tutor.subjects
                              .slice(0, 3)
                              .map((subject) => (
                                <Badge
                                  key={subject}
                                  variant="secondary"
                                  className="rounded-md text-xs font-medium"
                                >
                                  {subject}
                                </Badge>
                              ))}

                            {tutor.subjects.length > 3 && (
                              <Badge
                                variant="outline"
                                className="rounded-md text-xs"
                              >
                                +{tutor.subjects.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No subjects assigned
                          </span>
                        )}
                      </div>

                      {/* STATS */}
                      <div className="mt-5 grid grid-cols-3 divide-x rounded-xl border bg-muted/20 py-3">
                        <div className="px-3 text-center">
                          <p className="flex items-center justify-center gap-1 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                            {Number(
                              tutor.rating_avg || 0
                            ).toFixed(1)}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {tutor.rating_count || 0} reviews
                          </p>
                        </div>

                        <div className="px-3 text-center">
                          <p className="text-sm font-semibold">
                            ${tutor.hourly_rate ?? 0}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            per hour
                          </p>
                        </div>

                        <div className="px-3 text-center">
                          <p className="text-sm font-semibold">
                            {tutor.years_experience ?? 0}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            years exp.
                          </p>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${isActive
                              ? "bg-emerald-500"
                              : "bg-muted-foreground"
                              }`}
                          />

                          <span className="text-xs font-medium">
                            {isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 transition-all group-hover:border-primary/40"
                          onClick={() =>
                            setManaging(tutor)
                          }
                        >
                          Manage
                          <span className="text-muted-foreground">
                            →
                          </span>
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
            onClose={() =>
              setCreateOpen(false)
            }
            onCreated={loadTutors}
          />
        </TabsContent>

        {/* SUBJECTS */}
        <TabsContent
          value="subjects"
          className="mt-6"
        >
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