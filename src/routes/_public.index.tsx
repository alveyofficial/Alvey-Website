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
  {
    name: "Primary",
    description: "",
    slug: "primary",
  },
  {
    name: "Secondary",
    description: "",
    slug: "secondary",
  },
  {
    name: "IGCSE",
    description: "",
    slug: "igcse",
  },
  {
    name: "GCSE",
    description: "",
    slug: "gcse",
  },
  {
    name: "A-Level",
    description: "",
    slug: "a-level",
  },
  {
    name: "SAT",
    description: "",
    slug: "sat",
  },
  {
    name: "University",
    description: "",
    slug: "university",
  },
  {
    name: "Professional",
    description: "",
    slug: "professional",
  },
];
type Level = {
  name: string;
  description: string;
  slug: string;
};
function Index() {

  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const docs = await DataStore.getSubjectCategories();
        console.log(docs);
        if (docs.length > 0) {
          const categories: Level[] = docs.map((doc) => ({
            name: doc.name,
            description: doc.description,
            slug: doc.slug,
          }));

          setLevels(categories);
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
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#CFDFEF_0%,#F8FCFD_55%,white_100%)] dark:bg-[linear-gradient(180deg,#08131A_0%,#0D2330_55%,#111827_100%)]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-56 -left-40 h-[700px] w-[700px] rounded-full bg-[#164E5E]/10 dark:bg-[#3D7F8F]/20 blur-[120px]" />
          <div className="absolute bottom-[-250px] right-[-150px] h-[600px] w-[600px] rounded-full bg-[#3D7F8F]/20 dark:bg-[#3D7F8F]/30 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-32 grid lg:grid-cols-[1.1fr_.9fr] items-center gap-10">


          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-10"
          >

            <motion.h1
              variants={fadeInUp}
              className="font-manrope text-5xl md:text-7xl xl:text-8xl font-extrabold leading-tight tracking-tight"
            >
              Find a tutor
              <br />

              <span className="text-[#164E5E] dark:text-cyan-300">
                that actually fits you.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground dark:text-slate-300 max-w-xl leading-8"
            >
              Learning shouldn't feel stressful.
              Discover trusted tutors for every stage of your education.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex gap-4 flex-wrap"
            >

              <Button
                asChild
                className="
h-14
px-10
rounded-full
bg-[#164E5E]
text-white
font-semibold
shadow-[0_15px_35px_rgba(22,78,94,.28)]
hover:bg-[#3D7F8F]
hover:shadow-[0_20px_40px_rgba(61,127,143,.35)]
hover:-translate-y-1
transition-all
duration-300
"
              >
                <Link
                  to="/find-a-tutor"
                  search={{ level: "", subject: "" }}
                >
                  Find Tutor
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="
h-14
px-10
rounded-full
border-2
border-[#164E5E]
bg-white/80
backdrop-blur
text-[#164E5E]
font-semibold
shadow-lg
hover:bg-[#3D7F8F]
hover:border-[#3D7F8F]
hover:text-white
hover:border-[#164E5E]
hover:-translate-y-1
transition-all
duration-300
"
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
            className="relative hidden lg:flex items-center justify-center"
          >
            <div>
              <img
                src="/logo.webp"
                className=" w-64 md:w-80 lg:w-[490px] object-contain drop-shadow-[0_30px_50px_rgba(22,78,94,.25)] animate-float"
              />
            </div>
          </motion.div>

        </div>

      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white dark:bg-[#08131A]">
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
              <div className="text-5xl font-extrabold text-[#164E5E] dark:text-[#6FD4D8]">{stat.value}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
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
              <motion.div key={level.name} variants={fadeInUp} whileHover={{ y: -5 }} >
                <Link to="/find-a-tutor" search={{
                  level: level.slug,
                  subject: "",
                }}>
                  <Card
                    className="rounded-3xl border border-[#262345] bg-white dark:bg-slate-900 shadow-md hover:bg-gradient-to-br hover:from-[#164E5E] hover:to-[#3D7F8F] hover:text-white hover:text-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                    <CardContent className="py-8 px-6 flex flex-col items-center text-center">
                      <h3 className="font-semibold text-lg">
                        {level.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors">
                        {level.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-white dark:bg-[#08131A]">

        <div className="max-w-7xl mx-auto px-8">

          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-[#164E5E]">
              How Alvey works
            </h2>

            <p className="mt-5 text-xl text-gray-700 dark:text-gray-300">
              Getting started takes less than five minutes.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">

            {[
              {
                num: "01",
                title: "Browse",
                desc: "Search tutors by subject and level."
              },
              {
                num: "02",
                title: "Compare",
                desc: "Read tutor profiles and reviews."
              },
              {
                num: "03",
                title: "Connect",
                desc: "Contact us and schedule lessons."
              },
              {
                num: "04",
                title: "Learn",
                desc: "Improve faster with expert guidance."
              }
            ].map((step) => (
              <Card
                className="rounded-3xl border-0 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-3">

                <CardContent className="p-10">

                  <p className="text-5xl font-black text-[#3D7F8F] dark:text-[#6FD4D8]">
                    {step.num}
                  </p>

                  <h3 className="mt-6 text-2xl font-bold text-[#164E5E]">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-gray-700 dark:text-gray-300 leading-7">
                    {step.desc}
                  </p>

                </CardContent>

              </Card>
            ))}

          </div>

        </div>

      </section>

      {/* Call to Action */}
      <section className="py-36">

        <div className="max-w-6xl mx-auto px-8">

          <div className="relative overflow-hidden rounded-[42px] bg-gradient-to-br from-[#164E5E] via-[#205C6D] to-[#3D7F8F] shadow-[0_40px_90px_rgba(22,78,94,.35)]">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-[-120px] bottom-[-120px] h-80 w-80 rounded-full bg-white/10 blur-[140px]" />
              <div className="absolute right-[-80px] top-[-80px] h-96 w-96 rounded-full bg-cyan-300/20 blur-[140px]" />
              <div className="absolute w-96 h-96 bg-white rounded-full blur-[140px] -top-32 -right-32" />
            </div>
            <div className="relative z-10 py-24 px-16 text-center">
              <h2 className="text-5xl font-black text-white">
                Ready to learn smarter?
              </h2>
              <p className="text-white/80 text-xl mt-6 max-w-2xl mx-auto">
                Thousands of students trust Alvey to connect them with
                qualified tutors.
              </p>
              <div className="flex justify-center gap-6 mt-12">
                <Button
                  asChild
                  className="
h-14
px-10
rounded-full
bg-[#164E5E]
text-white
font-semibold
shadow-[0_15px_35px_rgba(22,78,94,.28)]
hover:bg-[#3D7F8F]
hover:shadow-[0_20px_40px_rgba(61,127,143,.35)]
hover:-translate-y-1
transition-all
duration-300
"
                >
                  <Link
                    to="/find-a-tutor"
                    search={{ level: "", subject: "" }}
                  >
                    Find Tutor
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="
h-14
px-10
rounded-full
border-2
border-[#164E5E]
bg-white/80
backdrop-blur
text-[#164E5E]
font-semibold
shadow-lg
hover:bg-[#3D7F8F]
hover:border-[#3D7F8F]
hover:text-white
hover:border-[#164E5E]
hover:-translate-y-1
transition-all
duration-300
"
                >
                  <Link to="/apply">
                    Become Tutor
                  </Link>
                </Button>

              </div>

            </div>

          </div>

        </div>

      </section>
      <footer className="border-t bg-white dark:bg-[#08131A] dark:border-slate-800">

        <div className="max-w-7xl mx-auto px-8 py-16">

          <div className="grid md:grid-cols-4 gap-12">

            {/* Brand */}

            <div>

              <h2 className="text-3xl font-black text-[#164E5E]">
                Alvey
              </h2>

              <p className="mt-4 text-gray-700 dark:text-gray-300 dark:text-slate-400 leading-7">
                Helping students connect with trusted tutors across every subject.
              </p>

            </div>

            {/* Platform */}

            <div>

              <h3 className="font-bold text-[#164E5E] dark:text-white mb-6">
                Platform
              </h3>

              <div className="space-y-3 text-gray-700 dark:text-gray-300">

                <Link
                  to="/find-a-tutor"
                  search={{
                    level: "",
                    subject: "",
                  }}
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Find Tutor
                </Link>

                <Link
                  to="/apply"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Become Tutor
                </Link>

              </div>

            </div>

            {/* Support */}

            <div>

              <h3 className="font-bold text-[#164E5E] mb-6">
                Support
              </h3>

              <div className="space-y-3 text-gray-700 dark:text-gray-300">

                <Link
                  to="/contact"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Contact Us
                </Link>

                <a
                  href="mailto:support@alvey.study"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  support@alvey.study
                </a>

                <Link
                  to="/contact"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Privacy Policy
                </Link>

                <Link
                  to="/contact"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Terms of Service
                </Link>

              </div>

            </div>

            {/* Social */}

            <div>

              <h3 className="font-bold text-[#164E5E] mb-6">
                Follow Us
              </h3>

              <div className="space-y-3 text-gray-700 dark:text-gray-300">

                <a
                  href="#"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Instagram
                </a>

                <a
                  href="#"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  LinkedIn
                </a>

                <a
                  href="#"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  X (Twitter)
                </a>

              </div>

            </div>

          </div>

          <hr className="my-10 border-gray-200" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-700 dark:text-gray-300 text-sm">

            <p>
              © {new Date().getFullYear()} Alvey. All rights reserved.
            </p>

            <p className="font-medium">
              Built with CHAII HAHAH by the Alvey Team
            </p>

          </div>

        </div>

      </footer>
    </div >
  );
}
