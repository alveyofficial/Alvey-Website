import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ID, appwrite } from "@/integrations/appwrite/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { seoMeta, seoLinks } from "@/lib/seo";

export const Route = createFileRoute("/_public/work-with-us")({
  head: () => ({
    meta: seoMeta({
      title: "Work With Us",
      description:
        "Join the Alvey team as a tutor support specialist, content creator, or community manager. Help us connect students with elite academic tutors.",
      path: "/work-with-us",
    }),
    links: seoLinks("/work-with-us"),
  }),
  component: WorkWithUs,
});

function WorkWithUs() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [languagesFluentIn, setLanguagesFluentIn] = useState("");

  const [currentEducationLevel, setCurrentEducationLevel] = useState("");
  const [otherEducation, setOtherEducation] = useState("");

  const [role, setRole] = useState("");
  const [reasonToApply, setReasonToApply] = useState("");
  const [experience, setExperience] = useState("");
  const [projectLinks, setProjectLinks] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("0-3");
  const [whyGoodFit, setWhyGoodFit] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEducationLevel) {
      toast.error("Please select your current education level.");
      return;
    }
    if (!role) {
      toast.error("Please select the role you want to apply for.");
      return;
    }

    setLoading(true);
    try {
      const languages = languagesFluentIn
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const education =
        currentEducationLevel === "Other"
          ? otherEducation
          : currentEducationLevel;
      const now = new Date().toISOString();
      await appwrite.databases.createDocument({
        databaseId: "Database",
        collectionId: "volunteer_applications",
        documentId: ID.unique(),
        data: {
          Full_name: fullName,
          Discord_username: discordUsername,
          Instagram_handle: instagramHandle,
          Email_address: emailAddress,
          Country_of_residence: countryOfResidence,
          Languages_fluent_in: languages,
          Current_education_level: education,
          Role_you_want_to_apply_for: role,
          Reason_to_apply: reasonToApply,
          projectLinks: projectLinks.trim() || undefined,
          Experience: experience,
          hoursPerWeek,
          Why_good_fit: whyGoodFit,
          status: "pending",
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        },
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <h1 className="text-4xl font-bold mb-6 text-emerald-600 dark:text-emerald-500">Application Submitted!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Thank you for applying to be a volunteer at Alvey. We will review your application and contact you soon.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Student Volunteer Application</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to Alvey! We are seeking passionate student volunteers to join our team and help us connect students with tutors. Selected volunteers will gain valuable experience and receive a certificate of completion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 shadow-sm space-y-8">

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Personal Information</h2>
          <div>
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input required value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Discord Username <span className="text-destructive">*</span></Label>
            <Input required value={discordUsername} onChange={e => setDiscordUsername(e.target.value)} />
          </div>
          <div>
            <Label>Instagram Handle <span className="text-destructive">*</span></Label>
            <Input required value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} />
          </div>
          <div>
            <Label>Email Address <span className="text-destructive">*</span></Label>
            <Input type="email" required value={emailAddress} onChange={e => setEmailAddress(e.target.value)} />
          </div>
          <div>
            <Label>Country of Residence <span className="text-destructive">*</span></Label>
            <Input required value={countryOfResidence} onChange={e => setCountryOfResidence(e.target.value)} />
          </div>
          <div>
            <Label>Languages Fluent In <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mb-2">Please list all languages you speak fluently (comma separated)</p>
            <Input required value={languagesFluentIn} onChange={e => setLanguagesFluentIn(e.target.value)} />
          </div>
          <div>
            <Label>Current Education Level <span className="text-destructive">*</span></Label>
            <RadioGroup value={currentEducationLevel} onValueChange={setCurrentEducationLevel} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="High School Student" id="ed-1" />
                <Label htmlFor="ed-1">High School Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Undergraduate Student" id="ed-2" />
                <Label htmlFor="ed-2">Undergraduate Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Graduate Student" id="ed-3" />
                <Label htmlFor="ed-3">Graduate Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="ed-4" />
                <Label htmlFor="ed-4">Other</Label>
              </div>
            </RadioGroup>
            {currentEducationLevel === "Other" && (
              <Input className="mt-3" placeholder="Please specify" required value={otherEducation} onChange={e => setOtherEducation(e.target.value)} />
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Role & Experience</h2>
          <div>
            <Label>Which role would you like to apply for? <span className="text-destructive">*</span></Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Recruitment Team">Recruitment Team</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Chat Mod (Discord)">Chat Mod (Discord)</SelectItem>
                <SelectItem value="Discord Bot Developer">Discord Bot Developer</SelectItem>
                <SelectItem value="Web Developer">Web Developer</SelectItem>
                <SelectItem value="Discord Managers">Discord Managers</SelectItem>
                <SelectItem value="Website Managers">Website Managers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Why do you want to apply for the selected role? <span className="text-destructive">*</span></Label>
            <Textarea required className="min-h-[100px]" value={reasonToApply} onChange={e => setReasonToApply(e.target.value)} />
          </div>

          <div>
            <Label>What relevant experience do you have in this specific field or related areas? <span className="text-destructive">*</span></Label>
            <Textarea required className="min-h-[100px]" value={experience} onChange={e => setExperience(e.target.value)} />
          </div>

          <div>
            <Label>Please share any of your projects or work relating to the field you are choosing. (link) <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground mb-2">If you dont have any you may leave it blank"</p>
            <Input value={projectLinks} onChange={e => setProjectLinks(e.target.value)} />
          </div>

          <div>
            <Label>How many hours a week can you give comfortably for this role? <span className="text-destructive">*</span></Label>
            <RadioGroup value={hoursPerWeek} onValueChange={setHoursPerWeek} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0-3" id="hr-1" />
                <Label htmlFor="hr-1">0-3</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4-7" id="hr-2" />
                <Label htmlFor="hr-2">4-7</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8-12" id="hr-3" />
                <Label htmlFor="hr-3">8-12</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12+" id="hr-4" />
                <Label htmlFor="hr-4">12+</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Tell us a little about what you think makes you a good fit for this opportunity. <span className="text-destructive">*</span></Label>
            <Textarea required className="min-h-[100px]" value={whyGoodFit} onChange={e => setWhyGoodFit(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto px-12 text-lg rounded-xl">
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
