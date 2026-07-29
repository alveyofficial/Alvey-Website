/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { ID, Permission, Query, Role } from "appwrite";
import { appwrite, APPWRITE_DATABASE_ID, getCurrentUser } from "@/integrations/appwrite/client";


export interface Tutor {
  id: string;
  name: string;
  avatar_url: string;
  headline: string;
  about: string;
  hourly_rate: number;
  rating_avg: number;
  rating_count: number;
  years_experience: number;
  languages: string[];
  subjects: string[];
  levels: string[];
  is_featured: boolean;
  is_verified: boolean;
  availability: string;
}

export interface Review {
  id: string;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
  tutor_id: string;
  status: "pending" | "approved" | "rejected";
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  role: string;
  is_featured: boolean;
}

export interface CMSContent {
  homepage: {
    hero: {
      headline: string;
      subheadline: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    stats: {
      tutors: number;
      students: number;
      lessons: number;
      subjects: number;
      rating: number;
    };
  };
  about: {
    mission: string;
    vision: string;
    values: { title: string; description: string }[];
  };
  faqs: { question: string; answer: string; category: string }[];
}

const defaultTutors: Tutor[] = [
  {
    id: "tutor_1",
    name: "Dr. Alexander Sterling",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    headline: "Oxford Graduate & Experienced Mathematics Professor",
    about:
      "I hold a PhD in Mathematics from Oxford University and have spent over 12 years helping students master advanced calculus, algebra, and physics. My teaching style focuses on understanding core principles rather than memorization, making complex topics accessible and engaging.",
    hourly_rate: 65,
    rating_avg: 4.95,
    rating_count: 84,
    years_experience: 12,
    languages: ["English", "French"],
    subjects: ["Mathematics", "Physics", "Calculus"],
    levels: ["A-Level", "IB", "University", "IGCSE"],
    is_featured: true,
    is_verified: true,
    availability: "Mondays & Wednesdays (14:00 - 18:00 UTC)",
  },
  {
    id: "tutor_2",
    name: "Sophia Martinez",
    avatar_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    headline: "Bilingual Literature Scholar & English Essay Specialist",
    about:
      "Specializing in SAT English, AP Literature, and academic writing. I work closely with students to polish their essay writing skills, vocabulary, and literary analysis. I am passionate about literature and helping students express themselves clearly.",
    hourly_rate: 45,
    rating_avg: 4.88,
    rating_count: 62,
    years_experience: 8,
    languages: ["English", "Spanish"],
    subjects: ["English Literature", "Creative Writing", "SAT Verbal"],
    levels: ["GCSE", "SAT", "High School", "Secondary"],
    is_featured: true,
    is_verified: true,
    availability: "Tuesdays & Thursdays (15:00 - 20:00 UTC)",
  },
  {
    id: "tutor_3",
    name: "Marcus Chen",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    headline: "Software Engineer & Computer Science Tutor",
    about:
      "Ex-Google Engineer teaching Python, Java, web development, and data structures. I believe in hands-on, project-based learning. Whether you are prepping for AP Computer Science, university exams, or coding interviews, I've got you covered.",
    hourly_rate: 55,
    rating_avg: 4.92,
    rating_count: 47,
    years_experience: 6,
    languages: ["English", "Mandarin"],
    subjects: ["Computer Science", "Programming (Python/Java)", "Web Dev"],
    levels: ["University", "GCSE", "A-Level", "Professional"],
    is_featured: true,
    is_verified: true,
    availability: "Saturdays (09:00 - 17:00 UTC)",
  },
  {
    id: "tutor_4",
    name: "Elena Rostova",
    avatar_url:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    headline: "Biochemistry Ph.D. & Pre-Med Mentor",
    about:
      "Teaching Biology and Chemistry for medical school aspirants and high school students. I use illustrative diagrams, concept maps, and practical medical scenarios to help make biology and biochemistry understandable and fun.",
    hourly_rate: 50,
    rating_avg: 4.91,
    rating_count: 39,
    years_experience: 7,
    languages: ["English", "Russian"],
    subjects: ["Chemistry", "Biology", "Biochemistry"],
    levels: ["IB", "A-Level", "University", "GCSE"],
    is_featured: false,
    is_verified: true,
    availability: "Fridays (13:00 - 18:00 UTC)",
  },
];

const defaultTestimonials: Testimonial[] = [
  {
    id: "test_1",
    name: "Sarah Jenkins",
    rating: 5,
    comment:
      "Dr. Sterling completely turned around my son's attitude towards calculus. He went from failing to getting an A in his IB exams!",
    role: "Parent of IB Student",
    is_featured: true,
  },
  {
    id: "test_2",
    name: "Liam O'Connor",
    rating: 5,
    comment:
      "The Computer Science tutoring from Marcus was incredible. His practical industry insights helped me secure a software engineering internship.",
    role: "University Sophomore",
    is_featured: true,
  },
  {
    id: "test_3",
    name: "Amira Patel",
    rating: 5,
    comment:
      "Alvey connected me with Sophia, who helped me raise my SAT Verbal score by 140 points in just six weeks. I'm so grateful!",
    role: "SAT Aspirant",
    is_featured: true,
  },
];

const defaultCMS: CMSContent = {
  homepage: {
    hero: {
      headline: "Unlock Your Academic Potential with Premier Private Tutors",
      subheadline:
        "Connect with certified Ivy League and Oxbridge tutors for personalized, high-impact learning. We help students achieve academic excellence through curated matching.",
      ctaPrimary: "Find the Perfect Tutor",
      ctaSecondary: "Apply as a Tutor",
    },
    stats: {
      tutors: 124,
      students: 1450,
      lessons: 9240,
      subjects: 45,
      rating: 4.9,
    },
  },
  about: {
    mission:
      "To democratize elite, bespoke education and bridge the gap between world-class educators and ambitious students globally.",
    vision:
      "To become the global standard for premium, high-trust academic mentorship and personal tutoring.",
    values: [
      {
        title: "Academic Rigor",
        description:
          "We hold our tutors and curriculum to the highest global educational standards.",
      },
      {
        title: "Personalized Care",
        description:
          "No two students learn the same way. We structure custom pathways for every mind.",
      },
      {
        title: "Uncompromising Integrity",
        description:
          "Clear, transparent communication, vetted safety, and professional excellence.",
      },
    ],
  },
  faqs: [
    {
      category: "General",
      question: "How does Alvey match students with tutors?",
      answer:
        "We analyze the student's subject requirements, academic level, timezone, and budget, then recommend 3 certified tutors who best fit their criteria. Our team also reviews each connection for optimal alignment.",
    },
    {
      category: "Billing",
      question: "How do payments and lesson scheduling work?",
      answer:
        "Once a tutor is assigned, lesson packages can be purchased. All payments are securely processed, and lessons are logged automatically. Remaining balance is tracked in the Student Portal in real-time.",
    },
    {
      category: "Tutors",
      question: "Are Alvey tutors fully vetted?",
      answer:
        "Absolutely. Every tutor undergoes a strict verification process, including identity verification, academic credential audits, a live teaching interview, and a background check.",
    },
  ],
};

const defaultSubjects = [
  "Middle School Maths",
  "IGCSE/GCSE Accounting",
  "IGCSE/GCSE Physics",
  "IGCSE/GCSE Maths",
  "IGCSE/GCSE Add Maths",
  "IGCSE/GCSE Computer Science",
  "IGCSE/GCSE Biology",
  "IGCSE/GCSE Arabic",
  "IGCSE/GCSE Art And Design",
  "IGCSE/GCSE Business Studies",
  "IGCSE/GCSE Chemistry",
  "IGCSE/GCSE Combined Coordinate Sciences",
  "IGCSE/GCSE Design And Technology",
  "IGCSE/GCSE Economics",
  "IGCSE/GCSE English Literature",
  "IGCSE/GCSE English Second Language",
  "IGCSE/GCSE Environmental Management",
  "IGCSE/GCSE First Language English",
  "IGCSE/GCSE French",
  "IGCSE/GCSE Geography",
  "IGCSE/GCSE German",
  "IGCSE/GCSE Global Perspectives",
  "IGCSE/GCSE Hindi",
  "IGCSE/GCSE History",
  "IGCSE/GCSE ICT",
  "IGCSE/GCSE Islamiyat",
  "IGCSE/GCSE Malay",
  "IGCSE/GCSE Mandarin Chinese",
  "IGCSE/GCSE Music",
  "IGCSE/GCSE Other Languages",
  "IGCSE/GCSE Pakistan Studies",
  "IGCSE/GCSE Physical Education",
  "IGCSE/GCSE Psychology",
  "IGCSE/GCSE Sociology",
  "IGCSE/GCSE Travel And Tourism",
  "IGCSE/GCSE Urdu",
  "AS/AL Accounting",
  "AS/AL Biology",
  "AS/AL Business",
  "AS/AL Chemistry",
  "AS/AL Computer Science",
  "AS/AL Economics",
  "AS/AL Further Maths",
  "AS/AL History",
  "AS/AL Information Technology",
  "AS/AL Law",
  "AS/AL Maths",
  "AS/AL Other Subjects",
  "AS/AL Physics",
  "AS/AL Psychology",
  "University Chemistry",
  "University Biology",
  "Arabic",
  "Quran",
];
const defaultLevels = [
  "Primary",
  "Secondary",
  "GCSE",
  "IGCSE",
  "A-Level",
  "IB",
  "SAT",
  "University",
  "Professional",
];

const KEYS = {
  TUTORS: "tl_tutors",
  TESTIMONIALS: "tl_testimonials",
  CMS: "tl_cms",
  REVIEWS: "tl_reviews",
  APPLICATIONS: "tl_applications",
  RECRUITMENT: "tl_recruitment",
  ASSIGNMENTS: "tl_assignments",
  LESSONS: "tl_lessons",
  NOTIFICATIONS: "tl_notifications",
};

const COLLECTIONS = {
  USERS: "users",
  STUDENTS: "students",
  TUTOR_PROFILES: "tutor_profiles",
  TUTOR_ADS: "ads",
  TUTOR_APPLICATIONS: "tutor_applications",
  RECRUITMENT_APPLICATIONS: "volunteer_applications",
  SUBJECTS: "subjects",
  SUBJECT_CATEGORIES: "subject_categories",
  REVIEWS: "tutor_reviews",
  LESSONS: "lessons",
  NOTIFICATIONS: "notifications",
  PAGES: "pages",
  HOMEPAGE: "homepage_content",
  AUDIT_LOGS: "audit_logs",
  PLATFORM_SETTINGS: "platform_settings",
  NOTIFICATION_PREFERENCES: "notification_preferences",
  DISCORD_LINKS: "discord_links",
  SCHEDULES: "schedules",
  ASSIGNMENTS: "student_tutor_assignments",
};

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal(key: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Local storage save error", error);
  }
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeBool(value: unknown): boolean {
  return value === true;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "TL"
  );
}

function avatarFor(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=ffffff&size=256`;
}

async function listDocuments(collectionId: string, queries: string[] = []) {
  try {
    const result = await appwrite.databases.listDocuments({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      queries,
    });
    return result.documents as any[];
  } catch {
    return [];
  }
}

async function getDocument(collectionId: string, documentId: string) {
  try {
    return await appwrite.databases.getDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      documentId,
    });
  } catch {
    return null;
  }
}

async function upsertDocument(collectionId: string, documentId: string, data: Record<string, any>) {
  try {
    await appwrite.databases.getDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      documentId,
    });
    return await appwrite.databases.updateDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId,
      documentId,
      data,
    });
  } catch (e: any) {
    if (e.code === 404) {
      return await appwrite.databases.createDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId,
        documentId,
        data
      });
    }
    throw e;
  }
}

async function deleteDocument(collectionId: string, documentId: string) {
  await appwrite.databases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId,
    documentId,
  });
}


async function createDocument(
  collectionId: string,
  data: Record<string, any>,
  documentId = ID.unique(),
) {
  console.log("Creating in:", collectionId);
  console.log("Database:", APPWRITE_DATABASE_ID);

  return await appwrite.databases.createDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId,
    documentId,
    data,
  });
}

function mapTutorDoc(doc: any): Tutor {
  const name = safeString(
    doc.displayName || doc.name || doc.fullName || doc.authUserId,
    "Certified Tutor",
  );
  const rate = safeNumber(doc.hourlyRate ?? doc.hourly_rate, 40);
  const rating = safeNumber(doc.rating ?? doc.rating_avg, 5);
  const reviews = safeNumber(doc.reviewCount ?? doc.rating_count, 0);
  const years = safeNumber(doc.experienceYears ?? doc.years_experience, 5);

  return {
    id: doc.$id,
    name: doc.displayName ?? "Certified Tutor",
    avatar_url:
      doc.avatarUrl ??
      avatarFor(doc.displayName ?? "Tutor"),
    headline: doc.headline ?? "",
    about:
      doc.fullBio ??
      doc.shortBio ??
      "",
    hourly_rate: Number(doc.hourlyRate ?? 0),
    rating_avg: Number(doc.rating ?? 0),
    rating_count: Number(doc.reviewCount ?? 0),
    years_experience: Number(doc.experienceYears ?? 0),
    languages: Array.isArray(doc.languages)
      ? doc.languages
      : [],
    subjects: Array.isArray(doc.subjects)
      ? doc.subjects
      : [],
    levels: Array.isArray(doc.levels)
      ? doc.levels
      : [],
    is_featured: Boolean(doc.featured),
    is_verified: Boolean(doc.verified),
    availability:
      doc.availability ??
      "Contact tutor",
  };
}


function mapReviewDoc(doc: any): Review {
  return {
    id: doc.$id || doc.id,
    student_name: safeString(doc.authorName || doc.student_name, "Anonymous Student"),
    rating: safeNumber(doc.rating, 5),
    comment: safeString(doc.body || doc.comment, ""),
    created_at: doc.$createdAt || doc.createdAt || doc.created_at || new Date().toISOString(),
    tutor_id: doc.tutor?.$id || doc.tutor_id || doc.tutorId || "",
    status: safeString(doc.status, "pending") as Review["status"],
  };
}

function mapPageDoc(doc: any) {
  return {
    id: doc.$id || doc.id,
    title: safeString(doc.title, ""),
    slug: safeString(doc.slug, ""),
    content: safeString(doc.content, ""),
    seo_title: safeString(doc.seoTitle || doc.seo_title, ""),
    seo_description: safeString(doc.seoDescription || doc.seo_description, ""),
    status: safeString(doc.status, "draft"),
    published_at: doc.publishedAt || doc.published_at || null,
    updated_at: doc.updatedAt || doc.updated_at || doc.$updatedAt || new Date().toISOString(),
    is_deleted: safeBool(doc.isDeleted ?? doc.is_deleted),
  };
}

function mapLessonDoc(doc: any) {
  return {
    id: doc.$id || doc.id,
    student_id: doc.studentId || doc.student_id || "",
    tutor_id: doc.tutorId || doc.tutor_id || "",
    subject: doc.subject || "",
    academic_level: doc.academicLevel || doc.academic_level || "",
    starts_at: doc.startsAt || doc.starts_at || "",
    ends_at: doc.endsAt || doc.ends_at || "",
    status: safeString(doc.status, "scheduled"),
    notes: doc.notes || "",
    created_by: doc.createdBy || doc.created_by || null,
    is_deleted: safeBool(doc.isDeleted ?? doc.is_deleted),
    student: doc.student,
    tutor: doc.tutor,
  };
}

function mapNotificationDoc(doc: any) {
  return {
    id: doc.$id || doc.id,
    user_id: doc.userId || doc.user_id || "",
    type: safeString(doc.type, "info"),
    title: safeString(doc.title, ""),
    body: safeString(doc.body, ""),
    link: safeString(doc.link, ""),
    is_read: safeBool(doc.isRead ?? doc.is_read),
    is_deleted: safeBool(doc.isDeleted ?? doc.is_deleted),
    created_at: doc.createdAt || doc.created_at || doc.$createdAt || new Date().toISOString(),
  };
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function asObject<T extends Record<string, any>>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
    } catch { }
  }
  return fallback;
}

function parseJson(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value);
    } catch { }
  }
  return value;
}

export const DataStore = {
  saveUserRecord: async (user: {
    id: string;
    email?: string;
    displayName?: string;
    role?: string;
  }) => {
    const existing = await DataStore.getUserRecord(user.id);

    await upsertDocument(COLLECTIONS.USERS, user.id, {
      authUserId: user.id,
      email: safeString(
        user.email,
        existing?.email ?? `${user.id}@tutorslink.local`
      ),
      displayName: safeString(
        user.displayName,
        existing?.displayName ??
        user.email?.split("@")[0] ??
        "Alvey User"
      ),

      // KEEP THE EXISTING ROLE
      role: existing?.role ?? safeString(user.role, "student"),

      discordId: existing?.discordId ?? null,
      active: existing?.active ?? true,
    });
  },
  getUserRecord: async (userId: string): Promise<any | null> => {
    try {
      return await getDocument(COLLECTIONS.USERS, userId);
    } catch {
      return null;
    }
  },

  // --- TUTORS ---
  getTutors: async (): Promise<Tutor[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.TUTOR_PROFILES, [Query.equal("active", true)]);
      if (docs.length > 0) return docs.map(mapTutorDoc);
    } catch { }
    return getLocal<Tutor[]>(KEYS.TUTORS, defaultTutors);
  },

  getTutorById: async (id: string): Promise<Tutor | null> => {
    const tutors = await DataStore.getTutors();
    return tutors.find((t) => t.id === id) || null;
  },

  saveTutor: async (tutor: Tutor): Promise<void> => {
    const payload = {
      slug: tutor.id,
      displayName: tutor.name,
      headline: tutor.headline,
      shortBio: tutor.about.slice(0, 240),
      fullBio: tutor.about,
      avatarInitials: initials(tutor.name),
      rating: tutor.rating_avg,
      reviewCount: tutor.rating_count,
      hourlyRate: Math.round(tutor.hourly_rate),
      experienceYears: tutor.years_experience,
      education: [],
      languages: tutor.languages,
      subjects: tutor.subjects,
      levels: tutor.levels,
      responseTime: "Within 24 hours",
      availability: tutor.availability,
      // removed duplicate properties abuve
      publicBadges: tutor.is_verified ? ["Verified"] : [],
      contactEmail: null,
      contactUrl: null,
      inquiryUrl: null,
      featured: tutor.is_featured,
      verified: tutor.is_verified,
      active: true,
      avatarUrl: tutor.avatar_url,
    };
    const user = await getCurrentUser();
    console.log(user);
    await upsertDocument(COLLECTIONS.TUTOR_PROFILES, tutor.id, payload);
    const tutors = await DataStore.getTutors();
    const idx = tutors.findIndex((t) => t.id === tutor.id);
    if (idx !== -1) tutors[idx] = tutor;
    else tutors.push(tutor);
    setLocal(KEYS.TUTORS, tutors);
  },


  updateTutorProfile: async (tutor: Partial<Tutor> & { id: string }): Promise<void> => {
    const existing = (await DataStore.getAllTutors()).find((t) => t.id === tutor.id);
    const merged: Tutor = {
      id: tutor.id,
      name: tutor.name ?? existing?.name ?? "Certified Tutor",
      avatar_url: tutor.avatar_url ?? existing?.avatar_url ?? avatarFor(tutor.name || "Tutor"),
      headline: tutor.headline ?? existing?.headline ?? "Alvey Educator",
      about: tutor.about ?? existing?.about ?? "",
      hourly_rate: tutor.hourly_rate ?? existing?.hourly_rate ?? 40,
      rating_avg: tutor.rating_avg ?? existing?.rating_avg ?? 5,
      rating_count: tutor.rating_count ?? existing?.rating_count ?? 0,
      years_experience: tutor.years_experience ?? existing?.years_experience ?? 0,
      languages: tutor.languages ?? existing?.languages ?? ["English"],
      subjects: tutor.subjects ?? existing?.subjects ?? [],
      levels: tutor.levels ?? existing?.levels ?? defaultLevels,
      is_featured: tutor.is_featured ?? existing?.is_featured ?? false,
      is_verified: tutor.is_verified ?? existing?.is_verified ?? false,
      availability: tutor.availability ?? existing?.availability ?? "Flexible schedule (contact us)",
    };
    await DataStore.saveTutor(merged);
  },

  archiveTutor: async (id: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.TUTOR_PROFILES, id, { active: false });
    const tutors = getLocal<Tutor[]>(KEYS.TUTORS, defaultTutors).filter((t) => t.id !== id);
    setLocal(KEYS.TUTORS, tutors);
  },

  getHomepageStats: async function () {
    const tutors = await this.getAllTutors();
    const docs = await listDocuments(COLLECTIONS.TUTOR_PROFILES);
    const subjectSet = new Set<string>();

    tutors.forEach((t: any) => {
      (t.subjects || []).forEach((s: string) => subjectSet.add(s));
    });

    const rated = tutors.filter(
      (t: any) => typeof t.rating_avg === "number"
    );

    const rating =
      rated.length > 0
        ? rated.reduce(
          (sum: number, t: Tutor) => sum + t.rating_avg,
          0
        ) / rated.length
        : 0;


    return {
      tutors: tutors.length,
      members: docs.length,
      subjects: subjectSet.size,
      rating: Number(rating.toFixed(1)),
    };

  },

  // --- SUBJECTS & LEVELS ---
  getSubjects: async (): Promise<string[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.SUBJECTS, [Query.equal("active", true)]);
      if (docs.length > 0) return docs.map((d) => safeString(d.name)).filter(Boolean);
    } catch { }
    return defaultSubjects;
  },

  getLevels: async (): Promise<string[]> => defaultLevels,

  // --- TESTIMONIALS ---
  getTestimonials: async (): Promise<Testimonial[]> =>
    getLocal<Testimonial[]>(KEYS.TESTIMONIALS, defaultTestimonials),

  saveTestimonial: async (test: Testimonial): Promise<void> => {
    const testimonials = await DataStore.getTestimonials();
    const idx = testimonials.findIndex((t) => t.id === test.id);
    if (idx !== -1) testimonials[idx] = test;
    else testimonials.push(test);
    setLocal(KEYS.TESTIMONIALS, testimonials);
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    const testimonials = await DataStore.getTestimonials();
    setLocal(
      KEYS.TESTIMONIALS,
      testimonials.filter((t) => t.id !== id),
    );
  },

  // --- CMS ---
  getCMS: async (): Promise<CMSContent> => {
    const stored = getLocal<CMSContent>(KEYS.CMS, defaultCMS);
    try {
      const doc = await getDocument(COLLECTIONS.HOMEPAGE, "homepage");
      if (!doc) return stored;
      const stats = asObject(doc.stats, stored.homepage.stats);
      return {
        homepage: {
          hero: {
            headline: safeString(doc.heroHeadline, stored.homepage.hero.headline),
            subheadline: safeString(doc.heroSubheadline, stored.homepage.hero.subheadline),
            ctaPrimary: safeString(doc.ctaPrimary, stored.homepage.hero.ctaPrimary),
            ctaSecondary: safeString(doc.ctaSecondary, stored.homepage.hero.ctaSecondary),
          },
          stats: {
            tutors: safeNumber(stats.tutors, stored.homepage.stats.tutors),
            students: safeNumber(stats.students, stored.homepage.stats.students),
            lessons: safeNumber(stats.lessons, stored.homepage.stats.lessons),
            subjects: safeNumber(stats.subjects, stored.homepage.stats.subjects),
            rating: safeNumber(stats.rating, stored.homepage.stats.rating),
          },
        },
        about: {
          mission: safeString(doc.aboutMission, stored.about.mission),
          vision: safeString(doc.aboutVision, stored.about.vision),
          values: Array.isArray(parseJson(doc.aboutValues))
            ? (parseJson(doc.aboutValues) as any)
            : stored.about.values,
        },
        faqs: Array.isArray(parseJson(doc.faqs)) ? (parseJson(doc.faqs) as any) : stored.faqs,
      };
    } catch {
      return stored;
    }
  },

  saveCMS: async (cms: CMSContent): Promise<void> => {
    setLocal(KEYS.CMS, cms);
    await upsertDocument(COLLECTIONS.HOMEPAGE, "homepage", {
      heroHeadline: cms.homepage.hero.headline,
      heroSubheadline: cms.homepage.hero.subheadline,
      ctaPrimary: cms.homepage.hero.ctaPrimary,
      ctaSecondary: cms.homepage.hero.ctaSecondary,
      stats: JSON.stringify(cms.homepage.stats),
      aboutMission: cms.about.mission,
      aboutVision: cms.about.vision,
      aboutValues: JSON.stringify(cms.about.values),
      faqs: JSON.stringify(cms.faqs),
      isPublished: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  // --- APPLICATIONS (TUTOR) ---
  submitTutorApplication: async (app: {
    name: string;
    email: string;
    phone: string;
    bio?: string;
    expected_rate?: number;
    subjects: string[];
    levels: string[];
    languages?: string[];
    years_experience?: number;
    cover_letter?: string;
    cv_name?: string;
    userId?: string;
  }) => {
    const id = "app_" + Math.random().toString(36).slice(2, 11);
    const newApp = {
      id,
      applicant_user_id: app.userId || null,
      full_name: app.name,
      email: app.email,
      phone: app.phone,
      subjects: app.subjects,
      levels: app.levels,
      languages: app.languages || ["English"],
      years_experience: app.years_experience || 0,
      cover_letter: app.cover_letter || app.bio || "",
      internal_notes: null as string | null,
      status: "pending" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_at: null as string | null,
      reviewed_by: null as string | null,
    };

    const list = getLocal<any[]>(KEYS.APPLICATIONS, []);
    list.push(newApp);
    setLocal(KEYS.APPLICATIONS, list);

    await createDocument(
      COLLECTIONS.TUTOR_APPLICATIONS,
      {
        email: app.email,
        dateOfBirth: new Date().toISOString().slice(0, 10),
        phoneNumber: app.phone,
        discordUsername: app.email.split("@")[0],
        highestQualificationLink: null,
        highestQualificationFileId: null,
        highestQualificationFileName: app.cv_name || null,
        highestQualificationFileUrl: null,
        countryOfResidence: "Unknown",
        languagesSpoken: app.languages || ["English"],
        subjectName: app.subjects[0] || "General",
        subjectCode: app.subjects[0] || null,
        examBoard: null,
        teachingLevel: app.levels[0] || "General",
        examResultSummary: app.cover_letter || app.bio || "",
        resultDocumentLink: null,
        resultDocumentFileId: null,
        resultDocumentFileName: null,
        resultDocumentFileUrl: null,
        teachingExperience: app.cover_letter || app.bio || "",
        teachingFormat: "online",
        oneOnOneRateUsd: safeNumber(app.expected_rate, 0),
        groupRateUsd: safeNumber(app.expected_rate, 0),
        maxGroupStudents: 1,
        weeklyClassesPerStudent: 1,
        applicantUserId: app.userId || null,
        status: "pending",
        internalNotes: null,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      id,
    );

    return newApp;
  },

  submitContactInquiry: async (inquiry: {
    name: string;
    email: string;
    phone: string;
    subject?: string;
    level?: string;
    tutor_id?: string;
    message: string;
  }) => {
    const id = "inquiry_" + Math.random().toString(36).slice(2, 11);
    const newInquiry = {
      id,
      ...inquiry,
      status: "new" as const,
      created_at: new Date().toISOString(),
    };
    const list = getLocal<any[]>("tl_contact_inquiries", []);
    list.push(newInquiry);
    setLocal("tl_contact_inquiries", list);
    return newInquiry;
  },

  updateApplicationStatus: async (id: string, status: string) => {
    const list = getLocal<any[]>(KEYS.APPLICATIONS, []);
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setLocal(KEYS.APPLICATIONS, list);
    }
    await upsertDocument(COLLECTIONS.TUTOR_APPLICATIONS, id, {
      status,
      reviewedAt: new Date().toISOString(),
    });
  },

  updateRecruitmentStatus: async (id: string, status: string) => {
    const list = getLocal<any[]>(KEYS.RECRUITMENT, []);
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setLocal(KEYS.RECRUITMENT, list);
    }
    await upsertDocument(COLLECTIONS.RECRUITMENT_APPLICATIONS, id, {
      status,
      reviewedAt: new Date().toISOString(),
    });
  },

  getTutorApplications: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.TUTOR_APPLICATIONS, [
        Query.orderDesc("$createdAt"),
      ]);
      if (docs.length > 0) return docs;
    } catch { }
    return getLocal<any[]>(KEYS.APPLICATIONS, []);
  },

  updateTutorApplicationStatus: async (
    id: string,
    status: "pending" | "under_review" | "approved" | "rejected",
    notes?: string,
  ) => {
    const list = getLocal<any[]>(KEYS.APPLICATIONS, []);
    const idx = list.findIndex((x) => x.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      if (notes) list[idx].internal_notes = notes;
      setLocal(KEYS.APPLICATIONS, list);

      if (status === "approved" && list[idx].applicant_user_id) {
        const userId = list[idx].applicant_user_id;
        await DataStore.assignUserRole(userId, "tutor");
        const user = await getCurrentUser();
        console.log("CURRENT USER:", user);
        await DataStore.saveTutor({
          id: userId,
          name: list[idx].full_name,
          avatar_url: avatarFor(list[idx].full_name),
          headline: "Professional Educator",
          about: list[idx].cover_letter || "",
          hourly_rate: 45,
          rating_avg: 5.0,
          rating_count: 0,
          years_experience: list[idx].years_experience || 5,
          languages: list[idx].languages || ["English"],
          subjects: list[idx].subjects || [],
          levels: list[idx].levels || [],
          is_featured: false,
          is_verified: true,
          availability: "Available",
        });
      }
    }

    await upsertDocument(COLLECTIONS.TUTOR_APPLICATIONS, id, {
      status,
      internalNotes: notes || null,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  // --- RECRUITMENT APPLICATIONS ---
  submitRecruitmentApplication: async (app: {
    fullName: string;
    email: string;
    phone: string;
    roleAppliedFor: string;
    coverLetter: string;
    userId?: string;
  }) => {
    const id = "rec_" + Math.random().toString(36).slice(2, 11);
    const newApp = {
      id,
      applicant_user_id: app.userId || null,
      full_name: app.fullName,
      email: app.email,
      phone: app.phone,
      role_applied_for: app.roleAppliedFor,
      cover_letter: app.coverLetter,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    };

    const list = getLocal<any[]>(KEYS.RECRUITMENT, []);
    list.push(newApp);
    setLocal(KEYS.RECRUITMENT, list);

    await createDocument(
      COLLECTIONS.RECRUITMENT_APPLICATIONS,
      {
        Full_name: app.fullName,
        Discord_username: app.email.split("@")[0],
        Instagram_handle: app.email.split("@")[0],
        Email_address: app.email,
        Country_of_residence: "Unknown",
        Languages_fluent_in: ["English"],
        Current_education_level: "Unknown",
        Role_you_want_to_apply_for: app.roleAppliedFor,
        Reason_to_apply: app.coverLetter,
        Experience: app.coverLetter,
        Why_good_fit: app.coverLetter,
        status: "pending",
        applicantUserId: app.userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      id,
    );

    return newApp;
  },

  getRecruitmentApplications: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.RECRUITMENT_APPLICATIONS, [
        Query.orderDesc("$createdAt"),
      ]);
      if (docs.length > 0) return docs;
    } catch { }
    return getLocal<any[]>(KEYS.RECRUITMENT, []);
  },

  updateRecruitmentApplicationStatus: async (
    id: string,
    status: "pending" | "under_review" | "approved" | "rejected",
    notes?: string,
  ) => {
    const list = getLocal<any[]>(KEYS.RECRUITMENT, []);
    const idx = list.findIndex((x) => x.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      if (notes) list[idx].internal_notes = notes;
      setLocal(KEYS.RECRUITMENT, list);
      if (status === "approved" && list[idx].applicant_user_id) {
        await DataStore.assignUserRole(list[idx].applicant_user_id, "recruitment");
      }
    }

    await upsertDocument(COLLECTIONS.RECRUITMENT_APPLICATIONS, id, {
      status,
      internalNotes: notes || null,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  // --- USER ROLES & PROFILES ---
  getUserRoles: async (_userId: string): Promise<string[]> => {
    try {
      const { teams } = await appwrite.teams.list();

      console.log("USER TEAMS:", teams);

      return teams.map(team => team.$id);
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  assignUserRole: async (userId: string, role: string): Promise<void> => {
    try {
      const user = await getCurrentUser();
      await upsertDocument(COLLECTIONS.USERS, userId, {
        authUserId: userId,
        email: safeString(user?.email, `${userId}@tutorslink.local`),
        displayName: safeString(
          user?.displayName,
          user?.email?.split("@")[0] || userId
        ), role,
        discordId: null,
        active: true,
      });
    } catch { }

    const mockRoles = getLocal<Record<string, string[]>>("user_roles_map", {});
    if (!mockRoles[userId]) mockRoles[userId] = ["student"];
    if (!mockRoles[userId].includes(role)) mockRoles[userId].push(role);
    setLocal("user_roles_map", mockRoles);
  },

  removeUserRole: async (userId: string, role: string): Promise<void> => {
    try {
      const doc = await getDocument(COLLECTIONS.USERS, userId);
      if (doc?.role === role) {
        await upsertDocument(COLLECTIONS.USERS, userId, { ...doc, role: "student" });
      }
    } catch { }

    const mockRoles = getLocal<Record<string, string[]>>("user_roles_map", {});
    if (mockRoles[userId]) {
      mockRoles[userId] = mockRoles[userId].filter((r) => r !== role);
      setLocal("user_roles_map", mockRoles);
    }
  },

  // --- STUDENT TUTOR ASSIGNMENTS & SCHEDULES ---
  getStudentAssignments: async (studentId: string): Promise<any[]> => {
    const tutors = await DataStore.getTutors();
    try {
      const docs = await listDocuments(COLLECTIONS.ASSIGNMENTS, [
        Query.equal("studentId", studentId),
        Query.equal("isActive", true),
      ]);
      if (docs.length > 0) {
        return docs.map((a) => {
          const tutor = tutors.find((t) => t.id === (a.tutorId || a.tutor_id));
          return {
            ...a,
            tutor: tutor || {
              name: "Unassigned Tutor",
              headline: "Professional Tutor",
              avatar_url: avatarFor("Unassigned Tutor"),
              hourly_rate: 40,
              rating_avg: 5.0,
              rating_count: 0,
            },
          };
        });
      }
    } catch { }

    const localAss = getLocal<any[]>(KEYS.ASSIGNMENTS, [
      {
        id: "ass_1",
        student_id: studentId,
        tutor_id: "tutor_1",
        remaining_classes: 8,
        is_active: true,
      },
      {
        id: "ass_2",
        student_id: studentId,
        tutor_id: "tutor_2",
        remaining_classes: 4,
        is_active: true,
      },
    ]);

    return localAss
      .filter((a) => a.student_id === studentId && a.is_active)
      .map((a) => {
        const tutor = tutors.find((t) => t.id === a.tutor_id);
        return {
          ...a,
          tutor: tutor || {
            name: "Unassigned Tutor",
            headline: "Professional Tutor",
            avatar_url: avatarFor("Unassigned Tutor"),
            hourly_rate: 40,
            rating_avg: 5.0,
            rating_count: 0,
          },
        };
      });
  },

  getLessons: async (userId: string, isTutor = false): Promise<any[]> => {
    const tutors = await DataStore.getTutors();
    const localLessons = getLocal<any[]>(KEYS.LESSONS, [
      {
        id: "less_1",
        student_id: userId,
        tutor_id: "tutor_1",
        starts_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 25 * 3600 * 1000).toISOString(),
        status: "scheduled",
        notes: "Introduction to Advanced Linear Algebra & Calculus",
        subject: "Mathematics",
      },
      {
        id: "less_2",
        student_id: userId,
        tutor_id: "tutor_2",
        starts_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        ends_at: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
        status: "completed",
        notes: "SAT Verbal Mock Test & Essay Revision",
        subject: "English Literature",
      },
    ]);

    const filtered = isTutor
      ? localLessons.filter((l) => l.tutor_id === userId)
      : localLessons.filter((l) => l.student_id === userId);
    return filtered.map((l) => {
      const tutor = tutors.find((t) => t.id === l.tutor_id);
      return {
        ...l,
        tutor_name: tutor?.name || "Dr. Alexander Sterling",
        tutor_avatar: tutor?.avatar_url || avatarFor("Dr. Alexander Sterling"),
      };
    });
  },

  scheduleLesson: async (lesson: {
    student_id: string;
    tutor_id: string;
    starts_at: string;
    ends_at: string;
    notes?: string;
    subject: string;
  }) => {
    const list = getLocal<any[]>(KEYS.LESSONS, []);
    const newLess = {
      id: "less_" + Math.random().toString(36).slice(2, 11),
      ...lesson,
      status: "scheduled",
    };
    list.push(newLess);
    setLocal(KEYS.LESSONS, list);
    await createDocument(
      COLLECTIONS.LESSONS,
      {
        studentId: lesson.student_id,
        tutorId: lesson.tutor_id,
        startsAt: lesson.starts_at,
        endsAt: lesson.ends_at,
        subject: lesson.subject,
        academicLevel: null,
        notes: lesson.notes || "",
        createdBy: null,
        status: "scheduled",
        isDeleted: false,
      },
      newLess.id,
    );
    return newLess;
  },

  // --- REVIEWS ---
  submitReview: async (review: {
    student_id: string;
    student_name: string;
    tutor_id: string;
    rating: number;
    comment: string;
  }) => {
    const list = getLocal<Review[]>(KEYS.REVIEWS, []);
    const newRev: Review = {
      id: "rev_" + Math.random().toString(36).slice(2, 11),
      student_name: review.student_name,
      rating: review.rating,
      comment: review.comment,
      created_at: new Date().toISOString(),
      tutor_id: review.tutor_id,
      status: "pending",
    };
    list.push(newRev);
    setLocal(KEYS.REVIEWS, list);

    await createDocument(
      COLLECTIONS.REVIEWS,
      {
        authorName: review.student_name,
        authorInitials: initials(review.student_name),
        title: null,
        body: review.comment,
        rating: review.rating,
        isPublic: false,
        status: "pending",
        helpfulCount: 0,
        response: null,
        responseAt: null,
        tutor: review.tutor_id,
        studentId: review.student_id,
        createdAt: new Date().toISOString(),
      },
      newRev.id,
    );

    return newRev;
  },

  getReviews: async (tutorId?: string): Promise<Review[]> => {
    try {
      const queries = [Query.equal("isPublic", true), Query.equal("status", "approved")];
      if (tutorId) queries.push(Query.equal("tutor", tutorId));
      const docs = await listDocuments(COLLECTIONS.REVIEWS, queries);
      if (docs.length > 0) return docs.map(mapReviewDoc);
    } catch { }

    const localRevs = getLocal<Review[]>(KEYS.REVIEWS, [
      {
        id: "rev_1",
        student_name: "Sarah Jenkins",
        rating: 5,
        comment: "Excellent explanation. Really helps build fundamental skills.",
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        tutor_id: "tutor_1",
        status: "approved",
      },
    ]);
    if (tutorId) return localRevs.filter((r) => r.tutor_id === tutorId && r.status === "approved");
    return localRevs;
  },

  updateReviewStatus: async (id: string, status: "pending" | "approved" | "rejected") => {
    const list = getLocal<Review[]>(KEYS.REVIEWS, []);
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setLocal(KEYS.REVIEWS, list);
    }
    await upsertDocument(COLLECTIONS.REVIEWS, id, { status });
  },

  // --- AUDIT LOGS ---
  logAction: async (action: string, actorId: string | null, details: any) => {
    const list = getLocal<any[]>("tl_audit_logs", []);
    const entry = {
      id: "audit_" + Math.random().toString(36).slice(2, 11),
      action,
      actor_id: actorId,
      metadata: details,
      created_at: new Date().toISOString(),
    };
    list.push(entry);
    setLocal("tl_audit_logs", list);
    await createDocument(
      COLLECTIONS.AUDIT_LOGS,
      { action, actorId, metadata: details, createdAt: new Date().toISOString() },
      entry.id,
    );
  },

  getAuditLogs: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.AUDIT_LOGS, [
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]);
      if (docs.length > 0) return docs;
    } catch { }
    return getLocal<any[]>("tl_audit_logs", []);
  },

  // --- SUBJECT CATEGORIES ---
  getSubjectCategories: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.SUBJECT_CATEGORIES, [
        Query.equal("active", true),
        Query.orderAsc("displayOrder"),
      ]);
      if (docs.length > 0) return docs;
    } catch { }
    return [];
  },

  // --- PAGES ---
  getPages: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.PAGES, [
        Query.equal("isDeleted", false),
        Query.orderDesc("updatedAt"),
      ]);
      if (docs.length > 0) return docs.map(mapPageDoc);
    } catch { }
    return getLocal<any[]>("tl_pages", []);
  },

  getPage: async (slug: string): Promise<any | null> => {
    try {
      const docs = await listDocuments(COLLECTIONS.PAGES, [
        Query.equal("slug", slug),
        Query.equal("status", "published"),
        Query.equal("isDeleted", false),
        Query.limit(1),
      ]);
      if (docs[0]) return mapPageDoc(docs[0]);
    } catch { }
    return null;
  },

  savePage: async (page: {
    id?: string;
    title: string;
    slug: string;
    content?: string;
    seo_title?: string;
    seo_description?: string;
    status?: string;
  }) => {
    const docId = page.id || page.slug;
    const payload = {
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      seoTitle: page.seo_title || "",
      seoDescription: page.seo_description || "",
      status: page.status || "draft",
      publishedAt: page.status === "published" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };
    if (page.id) await upsertDocument(COLLECTIONS.PAGES, docId, payload);
    else await createDocument(COLLECTIONS.PAGES, payload, docId);
  },

  // --- HOMEPAGE CONTENT ---
  getHomepageContent: async (): Promise<any | null> => {
    try {
      const doc = await getDocument(COLLECTIONS.HOMEPAGE, "homepage");
      if (doc) return doc;
    } catch { }
    return null;
  },

  saveHomepageContent: async (content: {
    hero_headline?: string;
    hero_subheadline?: string;
    cta_primary?: string;
    cta_secondary?: string;
    stats?: any;
  }) => {
    await upsertDocument(COLLECTIONS.HOMEPAGE, "homepage", {
      heroHeadline: content.hero_headline,
      heroSubheadline: content.hero_subheadline,
      ctaPrimary: content.cta_primary,
      ctaSecondary: content.cta_secondary,
      stats: JSON.stringify(content.stats || {}),
      isPublished: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  // --- PLATFORM SETTINGS ---
  getPlatformSetting: async (key: string): Promise<any | null> => {
    try {
      const doc = await getDocument(COLLECTIONS.PLATFORM_SETTINGS, key);
      if (doc) return asObject(doc.value, doc.value);
    } catch { }
    return null;
  },

  savePlatformSetting: async (key: string, value: any): Promise<void> => {
    const now = new Date().toISOString();
    await upsertDocument(COLLECTIONS.PLATFORM_SETTINGS, key, {
      key,
      value: JSON.stringify(value),
      updatedBy: (await getCurrentUser())?.id || null,
      updatedAt: now,
      createdAt: now,
    });
  },

  // --- NOTIFICATION PREFERENCES ---
  getNotificationPreferences: async (userId: string): Promise<any | null> => {
    try {
      return await getDocument(COLLECTIONS.NOTIFICATION_PREFERENCES, userId);
    } catch {
      return null;
    }
  },

  saveNotificationPreferences: async (prefs: {
    user_id: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    lesson_reminders?: boolean;
    announcements?: boolean;
    marketing?: boolean;
  }): Promise<void> => {
    await upsertDocument(COLLECTIONS.NOTIFICATION_PREFERENCES, prefs.user_id, {
      userId: prefs.user_id,
      emailNotifications: prefs.email_notifications ?? true,
      pushNotifications: prefs.push_notifications ?? true,
      lessonReminders: prefs.lesson_reminders ?? true,
      announcements: prefs.announcements ?? true,
      marketing: prefs.marketing ?? false,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.NOTIFICATIONS, [
        Query.equal("userId", userId),
        Query.equal("isDeleted", false),
        Query.orderDesc("createdAt"),
        Query.limit(50),
      ]);
      if (docs.length > 0) return docs.map(mapNotificationDoc);
    } catch { }
    return getLocal<any[]>(KEYS.NOTIFICATIONS, []);
  },

  getUnreadNotificationCount: async (userId: string): Promise<number> => {
    try {
      const docs = await listDocuments(COLLECTIONS.NOTIFICATIONS, [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
        Query.equal("isDeleted", false),
      ]);
      return docs.length;
    } catch {
      return 0;
    }
  },

  createNotification: async (notif: {
    user_id: string;
    type?: string;
    title: string;
    body?: string;
    link?: string;
  }): Promise<void> => {
    await createDocument(COLLECTIONS.NOTIFICATIONS, {
      userId: notif.user_id,
      type: notif.type || "info",
      title: notif.title,
      body: notif.body || "",
      link: notif.link || "",
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    });
  },

  markNotificationRead: async (id: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.NOTIFICATIONS, id, { isRead: true });
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    try {
      const docs = await listDocuments(COLLECTIONS.NOTIFICATIONS, [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
      ]);
      for (const doc of docs) {
        await upsertDocument(COLLECTIONS.NOTIFICATIONS, doc.$id || doc.id, { isRead: true });
      }
    } catch { }
  },

  // --- LESSONS ---
  getLessonsForUser: async (userId: string, isTutor = false): Promise<any[]> => {
    try {
      const queries = [
        Query.equal("isDeleted", false),
        Query.orderAsc("startsAt"),
        Query.limit(200),
      ];
      queries.push(Query.equal(isTutor ? "tutorId" : "studentId", userId));
      const docs = await listDocuments(COLLECTIONS.LESSONS, queries);
      if (docs.length > 0) return docs.map(mapLessonDoc);
    } catch { }
    return getLocal<any[]>(KEYS.LESSONS, []);
  },

  getAllLessons: async (): Promise<any[]> => {
    try {
      const [docs, students, tutors] = await Promise.all([
        listDocuments(COLLECTIONS.LESSONS, [
          Query.equal("isDeleted", false),
          Query.orderDesc("startsAt"),
          Query.limit(100),
        ]),
        DataStore.getAllStudents(),
        DataStore.getAllTutors(),
      ]);
      if (docs.length > 0) {
        return docs.map((doc) => {
          const lesson = mapLessonDoc(doc);
          const student = students.find((s) => s.id === lesson.student_id);
          const tutor = tutors.find((t) => t.id === lesson.tutor_id);
          return {
            ...lesson,
            student: student
              ? { display_name: student.name || student.display_name }
              : lesson.student,
            tutor: tutor ? { display_name: tutor.name || tutor.display_name } : lesson.tutor,
          };
        });
      }
    } catch { }
    return [];
  },

  createLesson: async (lesson: {
    tutor_id: string;
    student_id: string;
    starts_at: string;
    ends_at: string;
    subject?: string;
    academic_level?: string;
    notes?: string;
    created_by?: string;
  }): Promise<any | null> => {
    const data = {
      tutorId: lesson.tutor_id,
      studentId: lesson.student_id,
      startsAt: lesson.starts_at,
      endsAt: lesson.ends_at,
      subject: lesson.subject || "",
      academicLevel: lesson.academic_level || "",
      notes: lesson.notes || "",
      createdBy: lesson.created_by || null,
      status: "scheduled",
      isDeleted: false,
    };
    const doc = await createDocument(COLLECTIONS.LESSONS, data);
    if (doc) {
      await DataStore.createNotification({
        user_id: lesson.student_id,
        type: "info",
        title: "Lesson Scheduled",
        body: `New lesson scheduled for ${new Date(lesson.starts_at).toLocaleString()}`,
      });
      await DataStore.createNotification({
        user_id: lesson.tutor_id,
        type: "info",
        title: "Lesson Scheduled",
        body: `New lesson scheduled for ${new Date(lesson.starts_at).toLocaleString()}`,
      });
      return mapLessonDoc(doc);
    }
    return null;
  },

  updateLessonStatus: async (id: string, status: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.LESSONS, id, { status });
  },

  cancelLesson: async (id: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.LESSONS, id, { status: "cancelled" });
  },

  // --- REVIEWS ---
  getReviewsForTutor: async (tutorId: string): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.REVIEWS, [
        Query.equal("tutor", tutorId),
        Query.equal("isDeleted", false),
        Query.orderDesc("createdAt"),
      ]);
      if (docs.length > 0)
        return docs.map((doc) => ({ ...mapReviewDoc(doc), student: doc.student }));
    } catch { }
    return getLocal<Review[]>(KEYS.REVIEWS, []);
  },

  getAllReviews: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.REVIEWS, [
        Query.equal("isDeleted", false),
        Query.orderDesc("createdAt"),
        Query.limit(100),
      ]);
      if (docs.length > 0) return docs.map(mapReviewDoc);
    } catch { }
    return getLocal<Review[]>(KEYS.REVIEWS, []);
  },

  moderateReview: async (
    id: string,
    status: "pending" | "approved" | "rejected",
  ): Promise<void> => {
    const list = getLocal<Review[]>(KEYS.REVIEWS, []);
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setLocal(KEYS.REVIEWS, list);
    }
    await upsertDocument(COLLECTIONS.REVIEWS, id, { status });
  },

  addTutorResponse: async (reviewId: string, response: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.REVIEWS, reviewId, {
      response,
      responseAt: new Date().toISOString(),
    });
  },

  // --- DISCORD LINKS ---
  getDiscordLink: async (userId: string): Promise<any | null> => {
    try {
      return await getDocument(COLLECTIONS.DISCORD_LINKS, userId);
    } catch {
      return null;
    }
  },

  linkDiscordAccount: async (
    userId: string,
    discordId: string,
    discordUsername: string,
  ): Promise<void> => {
    await upsertDocument(COLLECTIONS.DISCORD_LINKS, userId, {
      userId,
      discordId,
      discordUsername,
      linkedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  unlinkDiscordAccount: async (userId: string): Promise<void> => {
    await deleteDocument(COLLECTIONS.DISCORD_LINKS, userId);
  },

  // --- TEAM MEMBERSHIP ---
  addToTeam: async (teamId: string, email: string, userId?: string): Promise<void> => {
    try {
      // Prefer memberId lookup when we have a userId so we can add without email invite
      await appwrite.teams.createMembership(
        teamId,
        [], // roles array (empty = default member)
        email,
        userId,
        undefined, // url (not needed for server-side)
        undefined, // name
      );
    } catch (e: any) {
      // 409 = already a member — treat as success
      if (e?.code !== 409) console.warn("addToTeam:", e);
    }
  },

  removeFromTeam: async (teamId: string, membershipId: string): Promise<void> => {
    try {
      await appwrite.teams.deleteMembership(teamId, membershipId);
    } catch (e: any) {
      if (e?.code !== 404) console.warn("removeFromTeam:", e);
    }
  },

  getTeamMembershipByUserId: async (teamId: string, userId: string): Promise<string | null> => {
    try {
      const list = await appwrite.teams.listMemberships(teamId);
      const match = list.memberships.find((m: any) => m.userId === userId);
      return match?.$id ?? null;
    } catch {
      return null;
    }
  },


  getStudentAssignmentsFromDB: async (studentId: string): Promise<any[]> => {
    try {
      const tutors = await DataStore.getTutors();
      const docs = await listDocuments(COLLECTIONS.ASSIGNMENTS, [
        Query.equal("studentId", studentId),
        Query.equal("isActive", true),
      ]);
      if (docs.length > 0) {
        return docs.map((a) => {
          const tutor = tutors.find((t) => t.id === (a.tutorId || a.tutor_id));
          return {
            ...a,
            tutor: tutor || {
              name: "Unassigned Tutor",
              headline: "Professional Tutor",
              avatar_url: avatarFor("Unassigned Tutor"),
              hourly_rate: 40,
              rating_avg: 5.0,
              rating_count: 0,
            },
          };
        });
      }
    } catch { }
    return DataStore.getStudentAssignments(studentId);
  },

  getAllStudents: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.USERS, [
        Query.equal("role", "student"),
        Query.equal("active", true),
      ]);
      if (docs.length > 0) {
        return docs.map((doc) => ({
          id: doc.$id || doc.id,
          name: doc.displayName,
          email: doc.email,
          avatar_url: avatarFor(doc.displayName || doc.email || "Student"),
        }));
      }
    } catch { }
    return [];
  },

  saveStudent: async (student: {
    id: string;
    name: string;
    email: string;
    role?: string;
    active?: boolean;
  }): Promise<void> => {
    await upsertDocument(COLLECTIONS.USERS, student.id, {
      authUserId: student.id,
      email: student.email,
      displayName: student.name,
      role: student.role || "student",
      discordId: null,
      active: student.active ?? true,
    });
  },

  archiveStudent: async (id: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.USERS, id, { active: false });
  },

  getAllTutors: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.TUTOR_PROFILES, [Query.equal("active", true)]);
      if (docs.length > 0) {
        return docs.map((t: any) => ({
          id: t.$id || t.id,
          name: t.displayName || "Certified Tutor",
          email: t.contactEmail || null,
          avatar_url: t.avatarUrl || avatarFor(t.displayName || "Tutor"),
          headline: t.headline,
          about: t.fullBio || t.shortBio || "",
          hourly_rate: t.hourlyRate,
          rating_avg: t.rating,
          rating_count: t.reviewCount,
          years_experience: t.experienceYears,
          languages: t.languages || [],
          subjects: t.subjects || [],   // <-- add this
          is_featured: t.featured,
          is_verified: t.verified,
          is_active: t.active,
          slug: t.slug,
        }));
      }
    } catch { }
    return getLocal<Tutor[]>(KEYS.TUTORS, defaultTutors);
  },

  getTutorApplicationsFromDB: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.TUTOR_APPLICATIONS, [
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ]);
      if (docs.length > 0) return docs;
    } catch { }
    return getLocal<any[]>(KEYS.APPLICATIONS, []);
  },

  getRecruitmentApplicationsFromDB: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.RECRUITMENT_APPLICATIONS, [
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ]);
      return docs.map((doc: any) => ({
        ...doc,
        // Nornalized feilds
        id: doc.$id,
        full_name: doc.Full_name,
        email: doc.Email_address,
        role_applied_for: doc.Role_you_want_to_apply_for,
        created_at: doc.createdAt ?? doc.$createdAt,
      }));
    } catch { }
    return getLocal<any[]>(KEYS.RECRUITMENT, []);
  },
  // --- AVAILABILITY ---
  getTutorAvailability: async (tutorId: string): Promise<any[]> => {
    try {
      return await listDocuments(COLLECTIONS.SCHEDULES, [
        Query.equal("tutorId", tutorId),
        Query.equal("isActive", true),
        Query.orderAsc("dayOfWeek"),
      ]);
    } catch {
      return [];
    }
  },

  saveTutorAvailability: async (
    tutorId: string,
    schedules: { day_of_week: number; start_time: string; end_time: string; timezone: string }[],
  ): Promise<void> => {
    try {
      const existing = await listDocuments(COLLECTIONS.SCHEDULES, [
        Query.equal("tutorId", tutorId),
      ]);
      for (const doc of existing) {
        await deleteDocument(COLLECTIONS.SCHEDULES, doc.$id || doc.id);
      }
      if (schedules.length > 0) {
        for (const schedule of schedules) {
          await createDocument(COLLECTIONS.SCHEDULES, {
            tutorId,
            dayOfWeek: schedule.day_of_week,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            timezone: schedule.timezone,
            isActive: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch { }
  },

  // --- ADVERTISEMENTS ---
  getAdvertisements: async (): Promise<any[]> => {
    try {
      const docs = await listDocuments(COLLECTIONS.TUTOR_ADS, [
        Query.equal("isDeleted", false),
        Query.orderDesc("$createdAt"),
      ]);
      return docs.map((ad) => ({
        ...ad,
        id: ad.$id || ad.id,
        description: ad.description || ad.body || "",
        advertisement_status: ad.status || ad.advertisement_status || "pending",
        is_active: String(ad.status || "").toLowerCase() === "active",
        teaching_format: ad.teachingFormat || ad.teaching_format || "",
        monthly_price: ad.monthlyPrice ?? ad.monthly_price ?? null,
      }));
    } catch {
      return [];
    }
  },

  getTutorAdvertisements: async (tutorId: string): Promise<any[]> => {
    try {
      return await listDocuments(COLLECTIONS.TUTOR_ADS, [
        Query.equal("tutorId", tutorId),
        Query.equal("isDeleted", false),
        Query.orderDesc("$createdAt"),
      ]);
    } catch {
      return [];
    }
  },

  saveAdvertisement: async (ad: {
    id?: string;
    tutor_id: string;
    title: string;
    description?: string;
    price?: number;
    monthly_price?: number;
    teaching_format?: string;
    is_active?: boolean;
    is_featured?: boolean;
    advertisement_status?: string;
  }): Promise<void> => {
    const now = new Date().toISOString();
    const data = {
      title: ad.title,
      body: ad.description || "",
      description: ad.description || "",
      status: ad.advertisement_status || (ad.is_active ? "active" : "pending"),
      Source: "app",
      messageId: null,
      createdBy: ad.tutor_id,
      subject: "General",
      level: "General",
      createdAt: now,
      tutorId: ad.tutor_id,
      teachingFormat: ad.teaching_format || "online",
      monthlyPrice: ad.monthly_price ?? ad.price ?? null,
      price: ad.price ?? null,
      isFeatured: ad.is_featured ?? false,
      isDeleted: false,
    };
    await upsertDocument(COLLECTIONS.TUTOR_ADS, ad.id || ad.tutor_id || ID.unique(), data);
  },

  updateAdvertisementStatus: async (id: string, active: boolean): Promise<void> => {
    await upsertDocument(COLLECTIONS.TUTOR_ADS, id, { status: active ? "active" : "paused" });
  },

  archiveAdvertisement: async (id: string): Promise<void> => {
    await upsertDocument(COLLECTIONS.TUTOR_ADS, id, { isDeleted: true, status: "archived" });
  },
};

export type { Tutor as TutorData };
