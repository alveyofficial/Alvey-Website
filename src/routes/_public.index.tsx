import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStore } from "@/lib/data-store";
import { motion } from "motion/react";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Alvey · Find the right tutor" },
      {
        name: "description",
        content: "A modern tutoring platform connecting students with qualified tutors.",
      },
      { property: "og:title", content: "Alvey" },
      {
        property: "og:description",
        content: "A modern tutoring platform connecting students with qualified tutors.",
      },
    ],
  }),
  component: Index,
});

const FALLBACK_LEVELS = [
  "Primary",
  "Secondary",
  "IGCSE",
  "GCSE",
  "A-Level",
  "SAT",
  "University",
  "Professional",
];

function Index() {
  const [levels, setLevels] = useState<string[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const docs = await DataStore.getSubjectCategories();
        if (docs.length > 0) {
          const names = docs
            .map((doc: any) => doc.name || doc.title || doc.label || "")
            .filter(Boolean) as string[];
          setLevels(names.length > 0 ? names : FALLBACK_LEVELS);
        } else {
          setLevels(FALLBACK_LEVELS);
        }
      } catch {
        setLevels(FALLBACK_LEVELS);
      } finally {
        setLevelsLoading(false);
      }
    })();
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const [stats, setStats] = useState({
    tutors: 0,
    members: 0,
    subjects: 0,
    rating: 0,
  });

  useEffect(() => {
    DataStore.getHomepageStats().then(setStats);
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#CFDFEF] to-white">
        <div className="max-w-7xl mx-auto px-6 min-h-[90vh] grid lg:grid-cols-2 gap-20 items-center">


          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-10"
          >

            <motion.h1
              variants={fadeInUp}
              className="font-manrope text-6xl md:text-8xl font-extrabold leading-tight tracking-tight"
            >
              Find a tutor
              <br />

              <span className="text-[#164E5E]">
                that actually fits you.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-xl leading-8"
            >
              Learning shouldn't feel stressful.
              Discover trusted tutors for every stage of your education.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex gap-4 flex-wrap"
            >

              <Button
                size="lg"
                asChild
                className="h-14 px-10 text-lg rounded-2xl"
              >
                <Link
                  to="/find-a-tutor"
                  search={{ level: "", subject: "" }}
                >
                  Find Tutor
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="h-14 px-10 rounded-2xl text-lg"
              >
                <Link to="/apply">
                  Become Tutor
                </Link>
              </Button>

            </motion.div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex flex-col items-center justify-center"
          >

            <img
              src="/logo.png"
              className="w-44 mb-8 animate-float rounded-3xl shadow-[0_30px_50px_-20px_rgba(0,0,0,0.35)]"
            />

            <h1
              className="font-manrope text-[7rem] leading-none font-extrabold text-[#164E5E]"
            >
              ALVEY
            </h1>

            <p
              className="font-manrope text-4xl font-semibold tracking-wide text-[#7D868C]"
            >
              Study Better.
            </p>

          </motion.div>

        </div>

      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {
              value: `${stats.tutors}`,
              label: "Qualified Tutors",
            },
            {
              value: `${stats.members}`,
              label: "Members",
            },
            {
              value: `${stats.subjects}`,
              label: "Subjects",
            },
            {
              value: `${stats.rating}/5`,
              label: "Average Rating",
            },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="space-y-2">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{stat.value}</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Browse by Academic Level */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Browse by Academic Level</h2>
          <p className="text-lg text-muted-foreground">
            Find specialists for your specific educational journey
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {levelsLoading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-muted animate-pulse"
              />
            ))
            : levels.map((level) => (
              <motion.div key={level} variants={fadeInUp} whileHover={{ y: -5 }}>
                <Link to="/find-a-tutor" search={{ level, subject: "" }}>
                  <Card className="hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer h-full border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-8 text-center font-semibold text-lg">{level}</CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-4 bg-muted/10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-4xl font-bold mb-20 tracking-tight"
          >
            How Alvey Works
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-12 relative"
          >
            {[
              { step: "1", title: "Search Tutors", desc: "Browse our marketplace of vetted professionals." },
              { step: "2", title: "Choose a Tutor", desc: "Review profiles, ratings, and experience." },
              { step: "3", title: "Contact Us", desc: "We facilitate the connection and scheduling." },
              { step: "4", title: "Begin Learning", desc: "Achieve your academic goals." }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="space-y-8 -mt-16">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl font-bold mx-auto shadow-sm transform rotate-3 transition-transform hover:rotate-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-base text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-4 bg-blue-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-3xl mx-auto space-y-10 relative z-10"
        >
          <h2 className="text-5xl font-bold tracking-tight">Ready to unlock your potential?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Join thousands of students who have transformed their grades and confidence with Alvey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" variant="secondary" asChild className="text-lg px-10 rounded-xl font-semibold shadow-xl hover:scale-105 transition-transform text-blue-600">
              <Link to="/find-a-tutor" search={{ level: "", subject: "" }}>
                Find a Tutor
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-10 rounded-xl font-semibold shadow-xl hover:scale-105 transition-all">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
