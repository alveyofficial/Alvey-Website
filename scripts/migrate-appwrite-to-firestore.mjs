/**
 * Appwrite → Firestore Migration Script
 *
 * Reads every collection from Appwrite and writes it into Firestore.
 * Safe to re-run — uses Appwrite $id as the Firestore document ID so
 * duplicate runs just overwrite with the same data (idempotent).
 *
 * Usage:
 *   node -r dotenv/config scripts/migrate-appwrite-to-firestore.mjs
 *
 * Requires these env vars (already in your .env):
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 *   FIREBASE_SERVICE_ACCOUNT_JSON
 */

import { Client, Databases, Query } from 'node-appwrite';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// 1. Init Appwrite
// ---------------------------------------------------------------------------
const appwriteClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorslink')
  .setKey(process.env.APPWRITE_API_KEY || '');

const appwriteDb = new Databases(appwriteClient);
const AW_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'Database';

// ---------------------------------------------------------------------------
// 2. Init Firebase Admin
// ---------------------------------------------------------------------------
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  initializeApp({ credential: cert(serviceAccount) });
}
const firestore = getFirestore();

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch ALL documents from an Appwrite collection, handling pagination.
 */
async function fetchAllAppwriteDocs(collectionId) {
  const allDocs = [];
  let cursor = null;
  const PAGE_SIZE = 100;

  while (true) {
    const queries = [Query.limit(PAGE_SIZE)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    let response;
    try {
      response = await appwriteDb.listDocuments(AW_DATABASE_ID, collectionId, queries);
    } catch (err) {
      // Collection doesn't exist in Appwrite — skip silently
      if (err?.code === 404 || err?.message?.includes('not found')) {
        console.log(`  ⚠️  Collection "${collectionId}" not found in Appwrite — skipping.`);
        return [];
      }
      throw err;
    }

    allDocs.push(...response.documents);

    if (response.documents.length < PAGE_SIZE) break;
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return allDocs;
}

/**
 * Strip Appwrite system fields ($databaseId, $collectionId, $permissions)
 * and return a clean payload with _createdAt injected.
 */
function cleanDoc(awDoc) {
  const {
    $id,
    $databaseId,
    $collectionId,
    $permissions,
    $createdAt,
    $updatedAt,
    ...rest
  } = awDoc;

  // Remove null values so Firestore doesn't store unnecessary nulls
  const cleaned = {};
  for (const [key, val] of Object.entries(rest)) {
    if (val !== null && val !== undefined) {
      cleaned[key] = val;
    }
  }

  return {
    _createdAt: $createdAt || new Date().toISOString(),
    _updatedAt: $updatedAt || null,
    ...cleaned,
  };
}

/**
 * Write documents to Firestore in batches of 500 (Firestore limit).
 */
async function writeBatch(collectionName, docs) {
  const BATCH_SIZE = 500;
  let written = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();

    for (const awDoc of chunk) {
      const docId = awDoc.$id;
      const payload = cleanDoc(awDoc);
      const ref = firestore.collection(collectionName).doc(docId);
      batch.set(ref, payload, { merge: true });
    }

    await batch.commit();
    written += chunk.length;
  }

  return written;
}

// ---------------------------------------------------------------------------
// 4. Collection migration map
//    { appwriteCollectionId: firestoreCollectionName }
//    Appwrite collection IDs may differ from Firestore names — adjust if needed.
// ---------------------------------------------------------------------------
const MIGRATIONS = [
  // Core public data
  { from: 'tutor_profiles',              to: 'tutor_profiles' },
  { from: 'subjects',                    to: 'subjects' },
  { from: 'subject_categories',          to: 'subject_categories' },

  // CMS / settings
  { from: 'homepage_content',            to: 'homepage_content' },
  { from: 'platform_settings',           to: 'platform_settings' },
  { from: 'pages',                       to: 'pages' },
  { from: 'blog_posts',                  to: 'blog_posts' },

  // Applications
  { from: 'tutor_applications',          to: 'tutor_applications' },
  { from: 'volunteer_applications',      to: 'volunteer_applications' },

  // Reviews
  { from: 'tutor_reviews',               to: 'tutor_reviews' },
  { from: 'Platform_reviews',            to: 'Platform_reviews' },

  // Users & roles
  { from: 'users',                       to: 'users' },
  { from: 'students',                    to: 'students' },

  // Operational
  { from: 'lessons',                     to: 'lessons' },
  { from: 'student_tutor_assignments',   to: 'student_tutor_assignments' },
  { from: 'notifications',               to: 'notifications' },
  { from: 'notification_preferences',   to: 'notification_preferences' },
  { from: 'schedules',                   to: 'schedules' },
  { from: 'ads',                         to: 'ads' },
  { from: 'discord_links',              to: 'discord_links' },
  { from: 'audit_logs',                  to: 'audit_logs' },
];

// ---------------------------------------------------------------------------
// 5. Run
// ---------------------------------------------------------------------------
async function migrate() {
  console.log('\n🚀 Starting Appwrite → Firestore migration...\n');
  console.log(`   Appwrite: ${process.env.APPWRITE_ENDPOINT} / ${AW_DATABASE_ID}`);
  console.log(`   Firebase: ${JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id}`);
  console.log('');

  const results = [];
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const { from, to } of MIGRATIONS) {
    process.stdout.write(`📦 ${from} → ${to} ... `);

    try {
      const docs = await fetchAllAppwriteDocs(from);

      if (docs.length === 0) {
        console.log('(empty — skipped)');
        totalSkipped++;
        results.push({ collection: from, status: 'skipped', count: 0 });
        continue;
      }

      const written = await writeBatch(to, docs);
      console.log(`✅ ${written} docs`);
      totalWritten += written;
      results.push({ collection: from, status: 'ok', count: written });
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      results.push({ collection: from, status: 'error', error: err.message });
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('📊 Migration Summary');
  console.log('─'.repeat(60));

  const pad = (str, n) => str.padEnd(n);
  for (const r of results) {
    if (r.status === 'ok')      console.log(`  ${pad(r.collection, 38)} ✅ ${r.count} docs`);
    if (r.status === 'skipped') console.log(`  ${pad(r.collection, 38)} ⚠️  empty`);
    if (r.status === 'error')   console.log(`  ${pad(r.collection, 38)} ❌ ${r.error}`);
  }

  console.log('─'.repeat(60));
  console.log(`  Total documents written : ${totalWritten}`);
  console.log(`  Collections skipped     : ${totalSkipped}`);
  console.log('─'.repeat(60));
  console.log('\n✅ Migration complete!\n');
  console.log('Next steps:');
  console.log('  1. Check Firebase Console → Firestore to verify the data.');
  console.log('  2. Open your website and confirm tutors/content appear correctly.');
  console.log('  3. If anything looks wrong, re-run this script — it is safe to repeat.\n');
}

migrate().catch((err) => {
  console.error('\n💥 Migration failed:', err);
  process.exit(1);
});
