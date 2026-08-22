import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Mail,
  Instagram,
  Linkedin,
  Youtube,
  MessageSquare,
  Twitter,
  Facebook,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: "Solutions",
      links: [
        { label: "Find a Tutor", to: "/find-a-tutor" },
        { label: "Apply as a Tutor", to: "/apply" },
        { label: "Work With Us", to: "/work-with-us" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact Us", to: "/contact" },
        { label: "FAQs", to: "/contact" }, // FAQs on contact page
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", to: "/privacy-policy" },
        { label: "Terms of Service", to: "/terms-of-service" },
        { label: "Credits", to: "/credits" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Logo & Info */}
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group w-fit text-white">
              <div className="bg-blue-600 group-hover:bg-blue-700 h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-blue-500/10">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Alvey
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-slate-400">
              Connecting ambitious students with certified Ivy League, Oxbridge, and elite level
              tutors globally. We make elite learning personal, trusted, and digital.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/alveyofficial/"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all text-slate-400"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/alveyofficial"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all text-slate-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/AlveyOfficialX"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all text-slate-400"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@alveyofficialtt"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all text-slate-400"
                aria-label="TikTok"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@AlveyOfficial"
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all text-slate-400"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <span
                className="bg-slate-800 p-2 rounded-lg transition-all text-slate-500 cursor-not-allowed"
                aria-label="Facebook coming soon"
              >
                <Facebook className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Nav Links columns */}
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {sec.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {sec.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.to}
                      className="hover:text-white hover:translate-x-0.5 inline-block transition-all duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support email and copyright border */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-blue-500" />
            <span>Official Support:</span>
            <a
              href="mailto:support@alvey.study"
              className="text-slate-200 hover:text-blue-400 font-medium transition-colors"
            >
              support@alvey.study
            </a>
          </div>
          <div className="text-center sm:text-right">
            &copy; {currentYear} Alvey. All rights reserved. Registered under global
            educational brand parameters.
          </div>
        </div>
      </div>
    </footer>
  );
}
