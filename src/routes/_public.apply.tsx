import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ID, appwrite } from "@/integrations/appwrite/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { seoMeta, seoLinks } from "@/lib/seo";

export const Route = createFileRoute("/_public/apply")({
  head: () => ({
    meta: seoMeta({
      title: "Apply as a Tutor",
      description:
        "Join Alvey as a verified private tutor. Apply with your academic credentials, subject specialties, and teaching experience.",
      path: "/apply",
    }),
    links: seoLinks("/apply"),
  }),
  component: Apply,
});

function Apply() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Section 1
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [highestQualificationLink, setHighestQualificationLink] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState("");
  
  // Section 2
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [examBoard, setExamBoard] = useState("");
  const [teachingLevel, setTeachingLevel] = useState("");
  const [examResultSummary, setExamResultSummary] = useState("");
  const [resultDocumentLink, setResultDocumentLink] = useState("");
  const [teachingExperience, setTeachingExperience] = useState("");
  
  // Section 3
  const [teachingFormat, setTeachingFormat] = useState("online");
  const [oneOnOneRateUsd, setOneOnOneRateUsd] = useState("0");
  const [groupRateUsd, setGroupRateUsd] = useState("0");
  const [maxGroupStudents, setMaxGroupStudents] = useState("0");
  const [weeklyClassesPerStudent, setWeeklyClassesPerStudent] = useState("0");
  const [classDurationMinutes, setClassDurationMinutes] = useState("60");
  const [testimonial, setTestimonial] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [bio, setBio] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("You must agree to the commission terms to apply.");
      return;
    }
    if (!highestQualification) {
      toast.error("Please select your highest qualification.");
      return;
    }
    
    setLoading(true);
    try {
      const languages = languagesSpoken.split(",").map(l => l.trim()).filter(Boolean);
      
      const payload = {
        email,
        fullName,
        dateOfBirth,
        phoneNumber,
        discordUsername,
        instagramHandle: instagramHandle || undefined,
        highestQualification,
        highestQualificationLink: highestQualificationLink || undefined,
        countryOfResidence,
        languagesSpoken: languages.length > 0 ? languages : [languagesSpoken],
        subjectName,
        subjectCode: subjectCode || undefined,
        examBoard: examBoard || undefined,
        teachingLevel,
        examResultSummary,
        resultDocumentLink: resultDocumentLink || undefined,
        teachingExperience,
        teachingFormat,
        oneOnOneRateUsd: parseFloat(oneOnOneRateUsd) || 0,
        groupRateUsd: parseFloat(groupRateUsd) || 0,
        maxGroupStudents: parseInt(maxGroupStudents) || 0,
        weeklyClassesPerStudent: parseInt(weeklyClassesPerStudent) || 0,
        classDurationMinutes: parseInt(classDurationMinutes) || 60,
        testimonial: testimonial || undefined,
        videoLink: videoLink || undefined,
        bio: bio || undefined,
        agreedToTerms,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      await appwrite.databases.createDocument({
        databaseId: "Database",
        collectionId: "tutor_applications",
        documentId: ID.unique(),
        data: payload,
      });
      
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Thank you for your interest in joining Alvey. We will review your application and get back to you soon.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Tutor Application Form</h1>
        <p className="text-lg text-muted-foreground">
          Thank you for your interest in joining Alvey as a tutor! This form will collect your teaching details as part of the application process. We look forward to learning more about you and your skills.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Section 1: Personal Details */}
        <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-4">1. Personal Details</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div>
              <Label>What is your full name? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">To be shown on your profile once you're accepted as a tutor.</p>
              <Input required value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div>
              <Label>What is your date of birth? <span className="text-destructive">*</span></Label>
              <Input type="date" required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>

            <div>
              <Label>What is your phone number? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">To help us contact you in case you aren't responding on discord.</p>
              <Input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            </div>

            <div>
              <Label>What is your discord username? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">Kindly try not to change your username after submitting this form.</p>
              <Input required value={discordUsername} onChange={e => setDiscordUsername(e.target.value)} />
            </div>

            <div>
              <Label>What is your Instagram handle?</Label>
              <p className="text-xs text-muted-foreground mb-2">Example @tutors.link (If you don't have Instagram you may mention that)</p>
              <Input value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} />
            </div>

            <div>
              <Label>What is your highest qualification? <span className="text-destructive">*</span></Label>
              <Select value={highestQualification} onValueChange={setHighestQualification} required>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Select qualification" /></SelectTrigger>
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
              <Label>Please add a link to a picture or screenshot of your highest qualification (PDF or Image link)</Label>
              <Input type="url" placeholder="https://..." value={highestQualificationLink} onChange={e => setHighestQualificationLink(e.target.value)} />
            </div>

            <div>
              <Label>Which country are you currently based in? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">To help us identify your time zone.</p>
              <Input required value={countryOfResidence} onChange={e => setCountryOfResidence(e.target.value)} />
            </div>

            <div>
              <Label>Which languages do you speak fluently? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">To help us understand your language proficiency (comma separated).</p>
              <Input required placeholder="English, Spanish" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: Subject Details */}
        <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-4">2. Subject Details</h2>
          <p className="text-sm text-muted-foreground mb-4">The details of the subject you wish to teach.</p>
          
          <div className="space-y-4">
            <div>
              <Label>What subject do you wish to teach? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">For example: Accounting</p>
              <Input required value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            
            <div>
              <Label>What is the subject code? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">For example: 0452</p>
              <Input required value={subjectCode} onChange={e => setSubjectCode(e.target.value)} />
            </div>

            <div>
              <Label>Which examination board is this subject linked to? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">For example: Cambridge, Edexcel, AQA, etc.</p>
              <Input required value={examBoard} onChange={e => setExamBoard(e.target.value)} />
            </div>

            <div>
              <Label>What level will you be teaching for this subject? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">For example: IGCSE, A Level, AS Level, etc.</p>
              <Input required value={teachingLevel} onChange={e => setTeachingLevel(e.target.value)} />
            </div>

            <div>
              <Label>Please share the academic result you achieved in this subject and the year and session you took the exam. <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">For example: A*/9, May June, 2022 etc</p>
              <Input required value={examResultSummary} onChange={e => setExamResultSummary(e.target.value)} />
            </div>

            <div>
              <Label>Please share a link to an image or PDF of your academic results for this subject.</Label>
              <Input type="url" placeholder="https://..." value={resultDocumentLink} onChange={e => setResultDocumentLink(e.target.value)} />
            </div>

            <div>
              <Label>Can you briefly describe your previous teaching or tutoring experience? <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">Include years of experience, student ages, and levels if possible. If none, please mention that.</p>
              <Textarea required className="min-h-[100px]" value={teachingExperience} onChange={e => setTeachingExperience(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 3: Classes & Commission Policies */}
        <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-4">3. Classes & Commission Policies</h2>
          <p className="text-sm text-muted-foreground mb-4">Details of the classes and Alvey's commission policies.</p>
          
          <div className="space-y-6">
            <div>
              <Label>Will you be teaching one-on-one, group classes, or both? <span className="text-destructive">*</span></Label>
              <RadioGroup value={teachingFormat} onValueChange={setTeachingFormat} className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one_on_one" id="fmt-1" />
                  <Label htmlFor="fmt-1">One-on-one</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="fmt-2" />
                  <Label htmlFor="fmt-2">Group classes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="fmt-3" />
                  <Label htmlFor="fmt-3">Both</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Rates for One-on-one (USD) <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mb-2">Enter 0 if only group</p>
                <Input type="number" required min="0" step="0.5" value={oneOnOneRateUsd} onChange={e => setOneOnOneRateUsd(e.target.value)} />
              </div>
              <div>
                <Label>Rates for Group classes (USD) <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mb-2">Enter 0 if only one-on-one</p>
                <Input type="number" required min="0" step="0.5" value={groupRateUsd} onChange={e => setGroupRateUsd(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Students per group class <span className="text-destructive">*</span></Label>
                <Input type="number" required min="0" value={maxGroupStudents} onChange={e => setMaxGroupStudents(e.target.value)} />
              </div>
              <div>
                <Label>Classes per week/month <span className="text-destructive">*</span></Label>
                <Input type="number" required min="0" value={weeklyClassesPerStudent} onChange={e => setWeeklyClassesPerStudent(e.target.value)} />
              </div>
              <div>
                <Label>Class duration (minutes) <span className="text-destructive">*</span></Label>
                <Input type="number" required min="0" value={classDurationMinutes} onChange={e => setClassDurationMinutes(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>If available, please provide a reference or testimonial from a former student.</Label>
              <Textarea value={testimonial} onChange={e => setTestimonial(e.target.value)} />
            </div>

            <div>
              <Label>Please insert a link of a 10-15 minute video of you teaching your subject. <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">Can be a class recording or a normal recording of you teaching a difficult topic (YouTube or Drive link).</p>
              <Input type="url" required placeholder="https://..." value={videoLink} onChange={e => setVideoLink(e.target.value)} />
            </div>

            <div>
              <Label>Please provide a short professional bio about yourself and why a student should choose you. <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground mb-2">This will be included in your ad. (under 60 words)</p>
              <Textarea required className="min-h-[100px]" value={bio} onChange={e => setBio(e.target.value)} />
            </div>

            <div className="p-6 bg-muted/30 rounded-xl space-y-4 border">
              <h3 className="font-semibold text-lg">Alvey Commission Terms</h3>
              <p className="text-sm text-muted-foreground">
                Alvey will keep 40% fees from students you receive through our platform during the first month only. This money is used for maintaining and improving Alvey, including platform management, community support and growth, and advertising tutors like you!
              </p>
              <p className="text-sm text-muted-foreground">
                Disagreeing with this policy may lead to your application being rejected. From the second month onward, tutors keep 100% of their earnings.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(c === true)} />
                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Yes, I agree to the terms
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto px-12 text-lg rounded-xl">
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
