// Temporary CJS-compatible sitemap bootstrapper for initial generation.
// Called by: node scripts/gen-sitemap-init.mjs
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "sitemap.xml");
const BASE = "https://alvey.study";
const NOW = new Date().toISOString().split("T")[0];

const STATIC = [
  ["/",                  "daily",   "1.0"],
  ["/find-a-tutor",     "daily",   "0.9"],
  ["/apply",            "monthly", "0.7"],
  ["/work-with-us",     "monthly", "0.7"],
  ["/contact",          "monthly", "0.6"],
  ["/privacy-policy",   "monthly", "0.3"],
  ["/terms-of-service", "monthly", "0.3"],
];

const TUTORS = ["tutor_1", "tutor_2", "tutor_3", "tutor_4"];

function entry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...STATIC.map(([p, cf, pr]) => entry(BASE + p, cf, pr)),
  ...TUTORS.map((id) => entry(`${BASE}/tutors/${id}`, "weekly", "0.8")),
  "</urlset>",
  "",
];

writeFileSync(OUTPUT, lines.join("\n"), "utf-8");
console.log(`[sitemap] Wrote ${STATIC.length + TUTORS.length} URLs to ${OUTPUT}`);
