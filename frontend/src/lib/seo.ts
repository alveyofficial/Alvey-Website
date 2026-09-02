/**
 * Shared SEO helpers for TanStack Router head() functions.
 *
 * Usage:
 *   import { seoMeta, seoLinks, jsonLdScript, SITE } from "@/lib/seo";
 *
 *   head: () => ({
 *     meta:    seoMeta({ title: "Page", description: "…", path: "/page" }),
 *     links:   seoLinks("/page"),
 *     scripts: [jsonLdScript(websiteSchema())],
 *   }),
 */

export const SITE = {
  name: "Alvey",
  url: "https://alvey.study",
  description:
    "Find a tutor or Find Students. Alvey makes it easy for both! We connect studetns and tutors all over the world!",
  twitterHandle: "@AlveyOfficialX",
  ogImage: "https://alvey.study/logo.webp",
  email: "support@alvey.study",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeoMetaOptions {
  /**
   * Human-readable page title WITHOUT the " · Alvey" suffix.
   * Pass `exactTitle: true` to suppress the suffix.
   */
  title: string;
  description: string;
  /** Path relative to root, e.g. "/find-a-tutor". Used for og:url. */
  path: string;
  /** Override the default OG image URL. Defaults to /logo.webp. */
  image?: string;
  /** Override the og:type. Default: "website". */
  type?: string;
  /** When true the title is used verbatim (no " · Alvey" suffix). */
  exactTitle?: boolean;
}

// ─── Meta tags ────────────────────────────────────────────────────────────────

/**
 * Returns the full meta array for a TanStack Router head() call:
 * title, description, og:*, and twitter:* tags.
 */
export function seoMeta({
  title,
  description,
  path,
  image = SITE.ogImage,
  type = "website",
  exactTitle = false,
}: SeoMetaOptions) {
  const fullTitle = exactTitle ? title : `${title} · ${SITE.name}`;
  const canonical = `${SITE.url}${path}`;

  return [
    { title: fullTitle },
    { name: "description", content: description },

    // Open Graph
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE.name },

    // Twitter / X Cards
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: SITE.twitterHandle },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

// ─── Links (canonical) ────────────────────────────────────────────────────────

/**
 * Returns the links array for a TanStack Router head() call.
 * Adds a canonical <link> pointing to the given path.
 */
export function seoLinks(path: string) {
  return [{ rel: "canonical", href: `${SITE.url}${path}` }];
}

// ─── JSON-LD helpers ──────────────────────────────────────────────────────────

/** Wraps a JSON-LD object in a TanStack Router head scripts descriptor. */
export function jsonLdScript(schema: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

// ─── Reusable schema builders ─────────────────────────────────────────────────

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.webp`,
    email: SITE.email,
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.email,
      contactType: "customer support",
      availableLanguage: "English",
    },
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/find-a-tutor?subject={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function serviceSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Private Tutoring",
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    description: SITE.description,
    areaServed: "Worldwide",
    serviceType: "Online Tutoring",
    url: `${SITE.url}/find-a-tutor`,
  };
}

export interface TutorSeoData {
  id: string;
  /** URL-safe slug — used for the canonical URL and JSON-LD. */
  slug: string;
  name: string;
  headline: string;
  about: string;
  avatar_url: string;
  subjects: string[];
  levels: string[];
  languages: string[];
  hourly_rate: number;
  rating_avg: number;
  rating_count: number;
  years_experience: number;
}

export function tutorPersonSchema(tutor: TutorSeoData): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: tutor.name,
    description: tutor.about,
    image: tutor.avatar_url,
    url: `${SITE.url}/tutors/${tutor.slug}`,
    jobTitle: tutor.headline,
    knowsLanguage: tutor.languages,
    knowsAbout: tutor.subjects,
    worksFor: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    ...(tutor.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: tutor.rating_avg,
        reviewCount: tutor.rating_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(tutor.hourly_rate > 0 && {
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: tutor.hourly_rate,
        description: `Private tutoring in ${tutor.subjects.slice(0, 3).join(", ")}`,
      },
    }),
  };
}
