import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star,
  CheckCircle,
  Award,
  ArrowLeft,
  Calendar,
  Globe,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataStore, Tutor, Review } from "@/lib/data-store";
import { seoMeta, seoLinks, jsonLdScript, tutorPersonSchema, SITE } from "@/lib/seo";

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
    // Always use the slug for the canonical path so it matches the sitemap URL.
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
  const { tutorSlug } = useParams({ from: "/_public/tutors/$tutorSlug" });
  const { tutor: initialTutor } = Route.useLoaderData();
  const [tutor, setTutor] = useState<Tutor | null>(initialTutor ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialTutor);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const tRecord = initialTutor
        ? initialTutor
        : await DataStore.getTutorBySlug(tutorSlug);
      // Reviews are stored against the Appwrite document $id, not the slug.
      const rList = tRecord ? await DataStore.getReviews(tRecord.id) : [];
      setTutor(tRecord);
      setReviews(rList);
      setLoading(false);
    })();
  }, [tutorSlug]);

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
          We couldn't locate a profile matching this ID. The tutor may be temporarily inactive.
        </p>
        <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
          <Link to="/find-a-tutor">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <Link
          to="/find-a-tutor"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tutor Marketplace
        </Link>

        {/* Main profile shell */}
        <section className="rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-border/60 p-3 sm:p-5">

          {/* Profile Header */}
          <div className="rounded-2xl bg-background border border-border/60 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">

              <img
                src={tutor.avatar_url}
                alt={tutor.name}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover shrink-0 border border-border shadow-sm"
              />

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {tutor.name}
                  </h1>

                  <p className="mt-1 text-sm sm:text-base text-emerald-600 dark:text-[#6FD4D8] font-medium">
                    {tutor.headline}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <strong className="text-foreground">
                      {tutor.rating_avg.toFixed(2)}
                    </strong>
                    ({tutor.rating_count} reviews)
                  </span>

                  <span className="hidden sm:block h-3 w-px bg-border" />

                  <span>
                    {tutor.years_experience} years experience
                  </span>

                  <span className="hidden sm:block h-3 w-px bg-border" />

                  <span>
                    {tutor.languages.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overview + Booking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 mt-3 sm:mt-5">

            {/* Overview */}
            <div className="lg:col-span-8 rounded-2xl bg-background border border-border/60 p-5 sm:p-6">

              <h2 className="text-lg font-bold">
                Overview
              </h2>

              <div className="mt-5 space-y-5">

                {/* Subjects */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Subjects
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((subject) => (
                      <Badge
                        key={subject}
                        className="rounded-lg bg-emerald-50 text-[#164E5E] border-[#3D7F8F]/30 dark:bg-[#3D7F8F]/20 dark:text-emerald-300"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Academic Levels
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tutor.levels.map((level) => (
                      <Badge
                        key={level}
                        variant="outline"
                        className="rounded-lg"
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Teaching Experience
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {tutor.years_experience} years
                  </p>
                </div>
              </div>
            </div>

            {/* Booking */}
            <div className="lg:col-span-4 rounded-2xl bg-background border border-border/60 p-5 sm:p-6">

              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hourly Tuition Rate
                </p>

                <div className="mt-1 text-3xl font-black tracking-tight">
                  ${tutor.hourly_rate}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "} / hour
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-border/60" />

              {/* Availability */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Weekly Availability
                  </p>

                  <p className="text-sm font-semibold">
                    {tutor.availability}
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="w-full mt-6 bg-[#164E5E] hover:bg-[#3D7F8F] text-white font-semibold rounded-xl h-11"
              >
                <Link
                  to="/contact"
                  search={{ tutorId: tutor.id }}
                >
                  Book This Tutor
                </Link>
              </Button>

              <p className="mt-3 text-[10px] leading-relaxed text-center text-muted-foreground">
                Please review our policies before booking.
                Contact us if you experience any issues.
              </p>
            </div>
          </div>

          {/* About */}
          <div className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6 mt-3 sm:mt-5">

            <h2 className="text-lg font-bold">
              About {tutor.name.split(" ")[0]}
            </h2>

            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {tutor.about}
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="rounded-2xl bg-background border border-border/60 p-5 sm:p-6 mt-3 sm:mt-5">

            <h2 className="text-lg font-bold">
              Testimonials & Reviews
            </h2>

            {/* Tutor testimonial */}
            {tutor.testimonial && (
              <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-emerald-600" />

                  <span className="text-sm font-semibold">
                    Tutor Testimonial
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                  "{tutor.testimonial}"
                </p>
              </div>
            )}

            {/* Student reviews */}
            <div className="mt-5 pt-5 border-t border-border/60 space-y-5">

              {reviews.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No public reviews available for this tutor yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="pb-5 border-b border-border/60 last:border-none last:pb-0"
                  >
                    <div className="flex justify-between items-center gap-4">

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

                    <p className="mt-3 pl-10 text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  )
}
