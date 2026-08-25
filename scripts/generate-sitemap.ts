/**
 * scripts/generate-sitemap.ts
 *
 * Generates public/sitemap.xml at build time.
 *
 * Uses the Appwrite REST API directly (plain fetch) — no SDK dependency.
 * Requires these environment variables, which should already be set in your
 * Appwrite Sites build environment:
 *
 *   APPWRITE_API_KEY          — server API key (required)
 *   VITE_APPWRITE_PROJECT_ID  — project ID         (default: "tutorslink")
 *   VITE_APPWRITE_DATABASE_ID — database ID        (default: "Database")
 *   VITE_APPWRITE_ENDPOINT    — API endpoint       (default: https://fra.cloud.appwrite.io/v1)
 *
 * Run:  bun scripts/generate-sitemap.ts
 * Auto: called by `bun run build` via the "prebuild" hook in package.json.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "sitemap.xml");

const BASE_URL = "https://alvey.study";
const NOW = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// ─── Config (read from env) ───────────────────────────────────────────────────

const ENDPOINT =
  process.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID ?? "tutorslink";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID ?? "Database";
const API_KEY = process.env.APPWRITE_API_KEY ?? "";

// ─── Static routes ────────────────────────────────────────────────────────────

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/find-a-tutor", changefreq: "daily", priority: "0.9" },
  { path: "/apply", changefreq: "monthly", priority: "0.7" },
  { path: "/work-with-us", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "monthly", priority: "0.3" },
];

// ─── Slug helper (mirrors the one in src/lib/data-store.ts) ──────────────────

/**
 * Converts a tutor display name into a URL-safe slug.
 * Must stay in sync with nameToSlug() in src/lib/data-store.ts.
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Fetch active tutor slugs via REST API ────────────────────────────────────

interface TutorDoc {
  $id: string;
  slug?: string;
  displayName?: string;
  name?: string;
}

async function fetchTutorSlugs(): Promise<string[]> {
  if (!API_KEY) {
    throw new Error(
      "[sitemap] APPWRITE_API_KEY is not set. " +
      "Add it as a build environment variable in Appwrite Sites.",
    );
  }

  const url = new URL(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/tutor_profiles/documents`,
  );
  url.searchParams.append(
    "queries[]",
    JSON.stringify({ method: "equal", attribute: "active", values: [true] }),
  );
  url.searchParams.append(
    "queries[]",
    JSON.stringify({ method: "limit", values: [500] }),
  );

  const res = await fetch(url.toString(), {
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[sitemap] Appwrite API returned ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { documents: TutorDoc[] };

  if (data.documents.length === 0) {
    throw new Error(
      "[sitemap] Appwrite returned 0 active tutors. " +
      "Check that the tutor_profiles collection has documents with active=true.",
    );
  }

  const slugs = data.documents.map((doc) => {
    // Prefer an explicit slug field stored in Appwrite, then derive one from
    // the display name, then fall back to the raw document $id so we always
    // emit a valid URL.
    const explicitSlug = typeof doc.slug === "string" ? doc.slug.trim() : "";
    if (explicitSlug) return explicitSlug;

    const displayName =
      typeof doc.displayName === "string" ? doc.displayName :
      typeof doc.name === "string" ? doc.name : "";
    const derived = nameToSlug(displayName);
    if (derived) return derived;

    return doc.$id;
  });

  console.log(`[sitemap] Found ${slugs.length} active tutor(s).`);
  return slugs;
}

// ─── XML builder ──────────────────────────────────────────────────────────────

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
  const tutorSlugs = await fetchTutorSlugs();

  const entries: string[] = [];

  for (const route of STATIC_ROUTES) {
    entries.push(urlEntry(`${BASE_URL}${route.path}`, NOW, route.changefreq, route.priority));
  }

  for (const slug of tutorSlugs) {
    entries.push(urlEntry(`${BASE_URL}/tutors/${slug}`, NOW, "weekly", "0.8"));
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(OUTPUT, xml, "utf-8");
  console.log(`[sitemap] Written ${entries.length} URLs → ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
