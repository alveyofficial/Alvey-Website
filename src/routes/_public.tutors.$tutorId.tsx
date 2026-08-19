import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star,
  CheckCircle,
  Award,
  ArrowLeft,
  Mail,
  Calendar,
  Globe,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataStore, Tutor, Review } from "@/lib/data-store";
import { seoMeta, seoLinks, jsonLdScript, tutorPersonSchema, SITE } from "@/lib/seo";

export const Route = createFileRoute("/_public/tutors/$tutorId")({
  loader: async ({ params }) => {
    // Fetch tutor server-side so head() can use the real name/description.
    try {
      const tutor = await DataStore.getTutorById(params.tutorId);
      return { tutor };
    } catch {
      return { tutor: null };
    }
  },
  head: ({ loaderData, params }) => {
    const tutor = loaderData?.tutor;
    const name = tutor?.name ?? "Tutor Profile";
    const headline = tutor?.headline ?? "";

    const description = tutor
      ? `${headline ? headline + " — " : ""}Learn more about ${name} on Alvey: subjects, levels, reviews, and availability.`
      : "Learn more about this elite private academic tutor, including curriculum specialties, student reviews, and availability.";

    const image = tutor?.avatar_url ?? SITE.ogImage;
    const path = `/tutors/${params.tutorId}`;

    return {
      meta: seoMeta({
        title: tutor ? `${name} · Private Tutor` : "Tutor Profile",
        description,
        path,
        image,
        type: "profile",
      }),
      links: seoLinks(path),
      scripts: tutor ? [jsonLdScript(tutorPersonSchema(tutor))] : [],
    };
  },
  links: seoLinks(path),
  scripts: tutor ? [jsonLdScript(tutorPersonSchema(tutor))] : [],
};
  },
component: TutorProfilePage,
});

function TutorProfilePage() {
  const { tutorId } = useParams({ from: "/_public/tutors/$tutorId" });
  const { tutor: initialTutor } = Route.useLoaderData();
  const [tutor, setTutor] = useState<Tutor | null>(initialTutor ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialTutor);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [tRecord, rList] = await Promise.all([
        initialTutor ? Promise.resolve(initialTutor) : DataStore.getTutorById(tutorId),
        DataStore.getReviews(tutorId),
      ]);
      setTutor(tRecord);
      setReviews(rList);
      setLoading(false);
    })();
  }, [tutorId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
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
        <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
          <Link to="/find-a-tutor">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/find-a-tutor"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tutor Marketplace
      </Link>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Info Columns (Left - 8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header profile info card */}
          <Card className="rounded-2xl border-border/80 bg-background overflow-hidden p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <img
                src={tutor.avatar_url}
                alt={tutor.name}
                className="h-24 w-24 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm"
              />
              <div className="space-y-3 flex-1">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      {tutor.name}
                    </h1>
                    {tutor.is_verified && (
                      <Badge className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/50 gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 shrink-0">
                        <CheckCircle className="h-3 w-3 text-blue-600 fill-blue-50" /> Verified
                        Tutor
                      </Badge>
                    )}
                    {tutor.is_featured && (
                      <Badge className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/50 gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 shrink-0">
                        <Award className="h-3.5 w-3.5 text-amber-500" /> Featured Elite
                      </Badge>
                    )}
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {tutor.headline}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <strong className="text-foreground">{tutor.rating_avg.toFixed(2)}</strong> (
                    {tutor.rating_count} reviews)
                  </span>
                  <span className="h-3 w-px bg-border hidden sm:inline" />
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-blue-600" />
                    <strong className="text-foreground">{tutor.years_experience} Yrs</strong>{" "}
                    Teaching Experience
                  </span>
                  <span className="h-3 w-px bg-border hidden sm:inline" />
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-500" />
                    Speaks {tutor.languages.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Biography */}
          <Card className="rounded-2xl border-border/80 bg-background p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold">About {tutor.name.split(" ")[1] || "Tutor"}</h2>
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {tutor.about}
            </div>
          </Card>

          {/* Subjects and Syllabus Specialties */}
          <Card className="rounded-2xl border-border/80 bg-background p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold">Academic Subjects & Levels</h2>
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Subjects Offered:
                </span>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((sub) => (
                    <Badge
                      key={sub}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/30 font-medium px-3 py-1 text-xs rounded-lg"
                    >
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Target Curriculum Levels:
                </span>
                <div className="flex flex-wrap gap-2">
                  {tutor.levels.map((lvl) => (
                    <Badge
                      key={lvl}
                      variant="outline"
                      className="border-border hover:bg-accent font-medium px-3 py-1 text-xs rounded-lg"
                    >
                      {lvl}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Student Reviews List */}
          <Card className="rounded-2xl border-border/80 bg-background p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold">Student Testimonials & Reviews</h2>
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-5">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No public reviews available for this tutor yet. Rest assured they have completed
                  academic verification.
                </div>
              ) : (
                reviews.map((r) => (
                  <div
                    key={r.id}
                    className="space-y-2.5 pb-5 border-b border-slate-100 dark:border-slate-800 last:border-none last:pb-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{r.student_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground italic pl-10">
                      "{r.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Booking & Side card panel (Right - 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-blue-200 dark:border-slate-800 bg-background shadow-lg shadow-blue-500/5 p-6 space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">
                Hourly Tuition Rate
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                ${tutor.hourly_rate}
                <span className="text-sm text-muted-foreground font-normal"> / hour</span>
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground block">Weekly Availability:</span>
                  <span className="font-semibold">{tutor.availability}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground block">Avg Response Time:</span>
                  <span className="font-semibold">&lt; 2 hours</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground block">Teaching Medium:</span>
                  <span className="font-semibold">Interactive Video Classroom</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-muted-foreground block">Guarantee:</span>
                  <span className="font-semibold">Satisfaction Matched Guarantee</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                asChild
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-11 shadow-md shadow-blue-500/10"
              >
                <Link to="/contact" search={{ tutorId: tutor.id }}>
                  I .. I want! Book now!!!
                </Link>
              </Button>
            </div>

            <div className="text-[10px] text-center text-muted-foreground leading-relaxed">
              Make sure to review our policies, you can contact us for any issues you face.
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
