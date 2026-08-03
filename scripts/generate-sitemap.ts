/**
 * scripts/generate-sitemap.ts
 *
 * Generates public/sitemap.xml at build time.
 *
 * Static routes are hard-coded below.
 * Dynamic tutor routes are fetched from Appwrite via the node-appwrite SDK;
 * if Appwrite is unreachable (e.g. no API key in CI) the script falls back to
 * the hard-coded default tutor IDs that ship with the app.
 *
 * Run:  bun run generate-sitemap   (or npx tsx scripts/generate-sitemap.ts)
 * Auto: called by `bun run build` via the "prebuild" hook in package.json.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT = join(ROOT, "public", "sitemap.xml");

const BASE_URL = "https://alvey.study";
const NOW = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// ─── Static routes ────────────────────────────────────────────────────────────
// changefreq + priority follow standard SEO conventions:
//   homepage: daily / 1.0   landing pages: weekly / 0.8   legal: monthly / 0.3

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/",                 changefreq: "daily",   priority: "1.0" },
  { path: "/find-a-tutor",    changefreq: "daily",   priority: "0.9" },
  { path: "/apply",           changefreq: "monthly", priority: "0.7" },
  { path: "/work-with-us",    changefreq: "monthly", priority: "0.7" },
  { path: "/contact",         changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy",  changefreq: "monthly", priority: "0.3" },
  { path: "/terms-of-service",changefreq: "monthly", priority: "0.3" },
];

// ─── Default / fallback tutor IDs ─────────────────────────────────────────────
// These match the defaultTutors array in src/lib/data-store.ts.
const FALLBACK_TUTOR_IDS = ["tutor_1", "tutor_2", "tutor_3", "tutor_4"];

// ─── Fetch live tutor IDs from Appwrite ───────────────────────────────────────
async function fetchTutorIds(): Promise<string[]> {
  const endpoint =
    process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const projectId =
    process.env.VITE_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    "tutorslink";
  const apiKey = process.env.APPWRITE_API_KEY || "";
  const databaseId =
    process.env.VITE_APPWRITE_DATABASE_ID ||
    process.env.APPWRITE_DATABASE_ID ||
    "Database";

  if (!apiKey) {
    console.warn(
      "[sitemap] APPWRITE_API_KEY not set — using fallback tutor IDs.",
    );
    return FALLBACK_TUTOR_IDS;
  }

  try {
    // Dynamically import to avoid hard-failing when the package isn't installed.
    const { Client, Databases, Query } = await import("node-appwrite");

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);
    const result = await databases.listDocuments(databaseId, "tutor_profiles", [
      Query.equal("active", true),
      Query.limit(500),
    ]);

    const ids = result.documents.map((d) => d.$id as string).filter(Boolean);
    if (ids.length === 0) {
      console.warn("[sitemap] No active tutors returned — using fallback IDs.");
      return FALLBACK_TUTOR_IDS;
    }
    console.log(`[sitemap] Found ${ids.length} active tutor(s) in Appwrite.`);
    return ids;
  } catch (err) {
    console.warn("[sitemap] Appwrite fetch failed — using fallback IDs.", err);
    return FALLBACK_TUTOR_IDS;
  }
}

// ─── XML builders ─────────────────────────────────────────────────────────────

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
): string {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const tutorIds = await fetchTutorIds();

  const entries: string[] = [];

  // Static pages
  for (const route of STATIC_ROUTES) {
    entries.push(
      urlEntry(
        `${BASE_URL}${route.path}`,
        NOW,
        route.changefreq,
        route.priority,
      ),
    );
  }

  // Dynamic tutor profile pages
  for (const id of tutorIds) {
    entries.push(
      urlEntry(`${BASE_URL}/tutors/${id}`, NOW, "weekly", "0.8"),
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "", // trailing newline
  ].join("\n");

  writeFileSync(OUTPUT, xml, "utf-8");
  console.log(`[sitemap] Written ${entries.length} URLs → ${OUTPUT}`);
}

main().catch((err) => {
  console.error("[sitemap] Fatal error:", err);
  process.exit(1);
});
