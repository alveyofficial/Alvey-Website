/**
 * seed-firestore.mjs — Seed missing Firestore collections.
 *
 * Seeds:
 *   - subject_categories  (8 documents, slug as doc ID, idempotent)
 *   - Platform_reviews    (1 sample document, only if it doesn't exist)
 *
 * Usage:
 *   node -r dotenv/config scripts/seed-firestore.mjs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in .env
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Init Firebase Admin ───────────────────────────────────────────────────────

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const firestore = getFirestore();

// ── Subject Categories ────────────────────────────────────────────────────────

const subjectCategories = [
  {
    name: 'Primary',
    description: 'Primary school level subjects. (Kindergarten to grade 5-6)',
    slug: 'primary',
    active: true,
    displayOrder: 1,
  },
  {
    name: 'Lower Secondary',
    description: 'Checkpoints (Grades 6-8)',
    slug: 'lower-secondary',
    active: true,
    displayOrder: 2,
  },
  {
    name: 'IGCSE/GCSE',
    description: 'High-school (Grades 9 & 10)',
    slug: 'igcse-gcse',
    active: true,
    displayOrder: 3,
  },
  {
    name: 'AS/A-Levels',
    description: 'Grades 11 & 12',
    slug: 'as-a-levels',
    active: true,
    displayOrder: 4,
  },
  {
    name: 'Test Prep',
    description: 'SAT/ACT/IELTS/TOEFL etc',
    slug: 'test-prep',
    active: true,
    displayOrder: 5,
  },
  {
    name: 'University',
    description: "Bachelor's/Master's/PhD",
    slug: 'university',
    active: true,
    displayOrder: 6,
  },
  {
    name: 'Professional Certificates',
    description: 'ACCA/CFA/PMP/AWS etc',
    slug: 'professional',
    active: true,
    displayOrder: 7,
  },
  {
    name: 'Languages',
    description: 'Arabic, French, Spanish and more',
    slug: 'languages',
    active: true,
    displayOrder: 8,
  },
];

console.log('Seeding subject_categories...');
for (const category of subjectCategories) {
  await firestore
    .collection('subject_categories')
    .doc(category.slug)
    .set(category, { merge: true });
}
console.log(`✅ Seeded ${subjectCategories.length} subject categories`);

// ── Platform Reviews ──────────────────────────────────────────────────────────

const sampleReviewId = 'sample_1';
const sampleReviewRef = firestore.collection('Platform_reviews').doc(sampleReviewId);
const existing = await sampleReviewRef.get();

if (!existing.exists) {
  await sampleReviewRef.set({
    authorName: 'Huraim Kamran',
    authorInitials: 'HK',
    title: 'Great tutoring platform',
    body: 'Alvey has an amazing tutor dashboard setup, onboarding was easy too!',
    rating: 4,
    authorid: 'sample_1',
    isPublic: true,
    isDeleted: false,
    helpfulCount: 0,
    _createdAt: new Date().toISOString(),
  });
  console.log('✅ Seeded 1 sample review');
} else {
  console.log('⏭️  Platform_reviews sample already exists, skipping');
}

process.exit(0);
