import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Star,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Globe,
  Clock,
  User,
  GraduationCap,
  DollarSign,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataStore, Tutor, Review } from "@/lib/data-store";
import {
  seoMeta,
  seoLinks,
  jsonLdScript,
  tutorPersonSchema,
  SITE,
} from "@/lib/seo";

export const Route = createFileRoute("/_public/tutors/$tutorSlug")({
  loader: async ({ params }) => {
    try {
      const tutor = await DataStore.getTutorBySlug(params.tutorSlug);
      return { tutor };
    } catch {
      return { tutor: null };
    }
  },

  head: ({ loaderData, params }) => {
    const tutor = loaderData?.tutor;
    const name = tutor?.name ?? "Tutor Profile";
    const headline = tutor?.headline?.trim() ?? "";

    const description = tutor
      ? `${headline ? headline + " — " : ""}Learn more about ${name} on Alvey: subjects, levels, reviews, and availability.`
      : "Learn more about this elite private academic tutor, including curriculum specialties, student reviews, and availability.";

    const image = tutor?.avatar_url ?? SITE.ogImage;
    const slug = tutor?.slug ?? params.tutorSlug;
    const path = `/tutors/${slug}`;

    return {
      meta: seoMeta({
        title: tutor
          ? `${name}${headline ? `, ${headline}` : ""} | Alvey`
          : "Tutor Profile | Alvey",
        exactTitle: true,
        description,
        path,
        image,
        type: "profile",
      }),
      links: seoLinks(path),
      scripts: tutor ? [jsonLdScript(tutorPersonSchema(tutor))] : [],
    };
  },

  component: TutorProfilePage,
});

function TutorProfilePage() {
  const { tutorSlug } = useParams({
    from: "/_public/tutors/$tutorSlug",
  });

  const { tutor: initialTutor } = Route.useLoaderData();

  const [tutor, setTutor] = useState<Tutor | null>(initialTutor ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(!initialTutor);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const tRecord = initialTutor
        ? initialTutor
        : await DataStore.getTutorBySlug(tutorSlug);

      if (!tRecord) {
        setTutor(null);
        setReviews([]);
        setLoading(false);
        return;
      }

      const [rList, tutors] = await Promise.all([
        DataStore.getReviews(tRecord.id),
        DataStore.getTutors(),
      ]);

      setTutor(tRecord);
      setReviews(rList);
      setAllTutors(tutors);
      setLoading(false);
    })();
  }, [tutorSlug, initialTutor]);

  const similarTutors = useMemo(() => {
    if (!tutor) return [];

    const candidates = allTutors.filter(
      (candidate) => candidate.id !== tutor.id,
    );

    /*
     * Recommendation algorithm:
     * 1. Prefer tutors sharing subjects.
     * 2. Then prefer tutors sharing academic levels.
     * 3. Add a small random component so the same tutors aren't
     *    always displayed.
     */
    return [...candidates]
      .map((candidate) => {
        const sharedSubjects = candidate.subjects.filter((subject) =>
          tutor.subjects.includes(subject),
        ).length;

        const sharedLevels = candidate.levels.filter((level) =>
          tutor.levels.includes(level),
        ).length;

        const randomBoost = Math.random() * 2;

        return {
          tutor: candidate,
          score:
            sharedSubjects * 5 +
            sharedLevels * 2 +
            randomBoost,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.tutor);
  }, [allTutors, tutor]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex-1 max-w-md mx-auto text-center flex flex-col justify-center px-4 space-y-4">
        <h2 className="text-2xl font-bold">Tutor Profile Not Found</h2>
        <p className="text-muted-foreground text-sm">
          We couldn't locate a profile matching this ID. The tutor may be
          temporarily inactive.
        </p>
        <Button
          asChild
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
        >
          <Link to="/find-a-tutor">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <Link
          to="/find-a-tutor"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tutor Marketplace
        </Link>

        {/* Hero */}
        <section className="rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-border/60 p-3 sm:p-5">
          <div className="rounded-2xl bg-background border border-border/60 p-5 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">

              <img
                src={tutor.avatar_url}
                alt={tutor.name}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl object-cover shrink-0 border border-border shadow-sm"
              />

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                  {tutor.is_verified && (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verified Tutor
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  {tutor.name}
                </h1>

                <p className="mt-2 text-base sm:text-lg text-emerald-600 dark:text-[#6FD4D8] font-semibold">
                  {tutor.headline}
                </p>

                <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">

                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <strong className="text-foreground">
                      {tutor.rating_avg.toFixed(2)}
                    </strong>
                    ({tutor.rating_count} reviews)
                  </span>

                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    {tutor.years_experience}+ years experience
                  </span>

                  {tutor.languages.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      {tutor.languages.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left */}
          <div className="lg:col-span-8 space-y-5">

            {/* About */}
            <section className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6">
              <h2 className="text-xl font-bold">
                What {tutor.name.split(" ")[0]} Wants You to Know
              </h2>

              {tutor.testimonial && (
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50 p-4">
                  <div className="flex gap-2">
                    <span className="text-2xl leading-none text-emerald-600">
                      “
                    </span>

                    <p className="text-sm italic leading-6 text-muted-foreground">
                      {tutor.testimonial}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {tutor.about || "This tutor has not added a bio yet."}
                </p>
              </div>
            </section>

            {/* Subjects & Levels */}
            <section className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6">
              <h2 className="text-xl font-bold">Teaching Specialties</h2>

              <div className="mt-5 grid sm:grid-cols-2 gap-5">

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Subjects
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.length > 0 ? (
                      tutor.subjects.map((subject) => (
                        <Badge
                          key={subject}
                          className="rounded-lg bg-emerald-50 text-[#164E5E] border-[#3D7F8F]/30 dark:bg-[#3D7F8F]/20 dark:text-emerald-300"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Academic Levels
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tutor.levels.length > 0 ? (
                      tutor.levels.map((level) => (
                        <Badge key={level} variant="outline" className="rounded-lg">
                          {level}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Qualifications */}
            <section className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6">
              <h2 className="text-xl font-bold">Education & Experience</h2>

              <div className="mt-5 grid sm:grid-cols-2 gap-4">

                {tutor.highestQualification && (
                  <Detail
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Highest Qualification"
                    value={tutor.highestQualification}
                  />
                )}

                {tutor.examBoard && (
                  <Detail
                    icon={<CheckCircle className="h-4 w-4" />}
                    label="Exam Board"
                    value={tutor.examBoard}
                  />
                )}

                {tutor.examResultSummary && (
                  <Detail
                    icon={<AwardIcon />}
                    label="Academic Results"
                    value={tutor.examResultSummary}
                  />
                )}

                {tutor.teachingFormat && (
                  <Detail
                    icon={<Globe className="h-4 w-4" />}
                    label="Teaching Format"
                    value={tutor.teachingFormat}
                  />
                )}

                {tutor.responseTime && (
                  <Detail
                    icon={<Clock className="h-4 w-4" />}
                    label="Typical Response Time"
                    value={tutor.responseTime}
                  />
                )}

                <Detail
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Teaching Experience"
                  value={`${tutor.years_experience}+ years`}
                />
              </div>
            </section>

            {/* Reviews */}
            <section className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Testimonials & Reviews</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    What students have said about learning with {tutor.name.split(" ")[0]}.
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <strong>{tutor.rating_avg.toFixed(2)}</strong>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No public reviews available for this tutor yet.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-border/60 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>

                          <div>
                            <span className="text-xs font-bold block">
                              {review.student_name}
                            </span>

                            <span className="text-[10px] text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-0.5 text-amber-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 fill-amber-500"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                        “{review.comment}”
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right / CTA */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 rounded-2xl bg-background border border-border/60 p-5 sm:p-6">

              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tuition
                </p>

                <div className="mt-1 text-3xl font-black tracking-tight">
                  ${tutor.oneOnOneRateUsd ?? tutor.hourly_rate}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}/ hour
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-border/60" />

              <div className="space-y-4">
                <Detail
                  icon={<Calendar className="h-4 w-4" />}
                  label="Availability"
                  value={tutor.availability || "Contact tutor"}
                />

                {tutor.classDurationMinutes && (
                  <Detail
                    icon={<Clock className="h-4 w-4" />}
                    label="Class Duration"
                    value={`${tutor.classDurationMinutes} minutes`}
                  />
                )}

                {tutor.groupRateUsd && (
                  <Detail
                    icon={<User className="h-4 w-4" />}
                    label="Group Rate"
                    value={`$${tutor.groupRateUsd} / hour`}
                  />
                )}

                {tutor.maxGroupStudents && (
                  <Detail
                    icon={<UsersIcon />}
                    label="Maximum Group Size"
                    value={`${tutor.maxGroupStudents} students`}
                  />
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <Button
                  asChild
                  className="bg-[#164E5E] hover:bg-[#3D7F8F] text-white font-semibold rounded-xl h-11"
                >
                  <Link
                    to="/contact"
                    search={{ tutorId: tutor.id }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Demo
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl h-11"
                >
                  <Link
                    to="/contact"
                    search={{ tutorId: tutor.id }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Link>
                </Button>
              </div>

              {/* Payment notice */}
              <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50 p-4">
                <div className="flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />

                  <p className="text-[11px] leading-5 text-muted-foreground">
                    <strong className="text-foreground">
                      Payment 100% upfront
                    </strong>{" "}
                    and kept by Alvey. Read Alvey policies for more details.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Similar tutors */}
        {similarTutors.length > 0 && (
          <section className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6">

            <div>
              <h2 className="text-xl font-bold">You Might Also Like</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Similar tutors based on subjects, academic levels, and a small
                amount of randomized discovery.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {similarTutors.map((candidate) => (
                <Link
                  key={candidate.id}
                  to="/tutors/$tutorSlug"
                  params={{ tutorSlug: candidate.slug }}
                  className="group rounded-xl border border-border/60 overflow-hidden hover:border-emerald-500/50 hover:shadow-sm transition-all"
                >
                  <img
                    src={candidate.avatar_url}
                    alt={candidate.name}
                    className="w-full aspect-square object-cover"
                  />

                  <div className="p-3">
                    <h3 className="font-bold text-sm group-hover:text-emerald-600 transition-colors">
                      {candidate.name}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {candidate.subjects.join(", ") || candidate.headline}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        ${candidate.oneOnOneRateUsd ?? candidate.hourly_rate}/hr
                      </span>

                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {candidate.rating_avg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-emerald-600 shrink-0">{icon}</div>

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-semibold break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function AwardIcon() {
  return <Star className="h-4 w-4" />;
}

function UsersIcon() {
  return <User className="h-4 w-4" />;
}