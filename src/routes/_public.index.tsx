import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataStore } from "@/lib/data-store";
import { seoMeta, seoLinks, jsonLdScript, websiteSchema, organizationSchema, serviceSchema } from "@/lib/seo";
import { motion } from "motion/react";

const HOME_DESCRIPTION =
  "Find a tutor or Find Students. Alvey makes it easy for both! We connect studetns and tutors all over the world, Weather youre doing IGCSE, GCSE, A-Level, IB, SAT, or University subjects, Alvey has you covered!";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: seoMeta({
      title: "Alvey | Find the Right Tutor",
      description: HOME_DESCRIPTION,
      path: "/",
      exactTitle: true,
    }),
    links: seoLinks("/"),
    scripts: [
      jsonLdScript(websiteSchema()),
      jsonLdScript(organizationSchema()),
      jsonLdScript(serviceSchema()),
    ],
  }),
  component: Index,
});

const FALLBACK_LEVELS = [
  {
    name: "Primary",
    description: "Primary school level subjects. (Kindergarten to grade 5-6)",
    slug: "primary",
  },
  {
    name: "Middle School",
    description: "Middle school level subjects (grades 6-8)",
    slug: "middle school",
  },
  {
    name: "High School",
    description: "High school/Upper Secondary/IGCSE-GCSE",
    slug: "high school",
  },
  {
    name: "College/A-Levels",
    description: "College/High school/A-Levels",
    slug: "College",
  },
  {
    name: "Test Prep",
    description: "SAT/ACT/IELTS/TOEFL etc",
    slug: "Test Prep",
  },
  {
    name: "University",
    description: "Bachelor's/Master's/PhD",
    slug: "university",
  },
  {
    name: "Professional Certificates",
    description: "ACCA/CFA/PMP/AWS etc",
    slug: "professional",
  },
  {
    name: "Languages",
    description: "Languages",
    slug: "Languages",
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

              <span className="text-[#164E5E] dark:text-[#6FD4D8]">
                that actually fits you.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground dark:text-slate-300 max-w-xl leading-8"
            >
              Learning shouldn't feel stressful, BUT it does.. :(
              Sooo... Find yourself a Tutor right away!
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
                className="w-64 md:w-80 lg:w-[490px] object-contain drop-shadow-[0_30px_50px_rgba(22,78,94,.25)] animate-float dark:[filter:brightness(0)_saturate(100%)_invert(90%)_sepia(30%)_saturate(684%)_hue-rotate(145deg)_brightness(102%)_contrast(101%)]"
              />
            </div>
          </motion.div>

        </div>

      </section>

      {/* Statistics Section */}
      <section className="section-blend py-20 bg-white dark:bg-[#08131A] [--section-blend-color:white] dark:[--section-blend-color:#08131A]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {
              value: `${stats.tutors}`,
              label: "Peak Tutors",
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
      <section className="section-blend py-32 bg-white dark:bg-[#08131A] [--section-blend-color:white] dark:[--section-blend-color:#08131A]">

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
                desc: "Search tutors by subject and level. Its easy.. Trust me!"
              },
              {
                num: "02",
                title: "Compare",
                desc: "Read tutor profiles and reviews. Be judgy, its fun!"
              },
              {
                num: "03",
                title: "Connect",
                desc: "Contact us and schedule a demo. Test us and the tutor.."
              },
              {
                num: "04",
                title: "Flex",
                desc: "Now that you easily got a tutor, Flex to your friends know about us!"
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
      {/* reviews */}
      <section className="py-24 bg-[#F8FCFD] dark:bg-[#0D2330]">
        <div className="max-w-7xl mx-auto px-8">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3D7F8F] dark:text-[#6FD4D8]">
              What people say
            </p>

            <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-[#164E5E] dark:text-white">
              Real people. Real experiences.
            </h2>

            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See what tutors and students have to say about their experience with Alvey.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-2xl rounded-3xl border border-[#D8E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 md:p-10">
                <div
                  className="flex justify-center gap-1 mb-6"
                  aria-label="5 out of 5 stars"
                >
                  {"★★★★★".split("").map((star, i) => (
                    <span
                      key={i}
                      className="text-[#F4B942] text-xl"
                    >
                      {star}
                    </span>
                  ))}
                </div>
                <p className="text-lg md:text-xl leading-8 text-center text-gray-700 dark:text-gray-200">
                  “Tutors Link is an awesome platform. As a tutor, I'd been
                  struggling to find students since the Oct-Nov examination
                  session finished, but just 1 week of me joining this platform
                  and I already have a prospective student. 10/10.”
                </p>
                <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                  <div className="h-11 w-11 rounded-full bg-[#164E5E] text-white flex items-center justify-center font-bold">
                    A
                  </div>

                  <div className="text-left">
                    <p className="font-semibold text-[#164E5E] dark:text-white">
                      Alvey Tutor
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tutor
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

        </div>
      </section>
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
      <footer className="section-blend border-t bg-white dark:bg-[#08131A] dark:border-slate-800 [--section-blend-color:white] dark:[--section-blend-color:#08131A]">

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
                  to="/privacy-policy"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Privacy Policy
                </Link>

                <Link
                  to="/terms-of-service"
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
                  href="https://www.instagram.com/alveyofficial/"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  Instagram
                </a>

                <a
                  href="https://www.linkedin.com/company/alveyofficial"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  LinkedIn
                </a>

                <a
                  href="https://x.com/AlveyOfficialX"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  X (Twitter)
                </a>

                <a
                  href="https://www.tiktok.com/@alveyofficialtt"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  TikTok
                </a>

                <a
                  href="https://www.youtube.com/@AlveyOfficial"
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#3D7F8F] dark:hover:text-[#6FD4D8] transition-colors"
                >
                  YouTube
                </a>

                <span className="block text-gray-400 dark:text-gray-500">
                  Facebook (coming soon)
                </span>

                <span className="block text-gray-400 dark:text-gray-500">
                  Reddit (coming soon)
                </span>

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
