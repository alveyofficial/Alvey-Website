/**
 * migrate-auth-users.mjs — Migrate Appwrite auth users to Firebase Auth.
 *
 * For each Appwrite user:
 *   1. Imports them into Firebase Auth (no password — they'll set their own)
 *   2. Generates a Firebase password-reset link
 *   3. Sends a password-set email via Resend
 *
 * Usage:
 *   node -r dotenv/config scripts/migrate-auth-users.mjs
 *
 * Requires in .env:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 *   FIREBASE_SERVICE_ACCOUNT_JSON
 *   RESEND_API_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Client, Users, Query } from 'node-appwrite';

// ── Init Firebase Admin ───────────────────────────────────────────────────────

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
}

const adminAuth = getAuth();

// ── Init Appwrite ─────────────────────────────────────────────────────────────

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, RESEND_API_KEY } = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('Error: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY are required.');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.warn('Warning: RESEND_API_KEY is not set — password reset emails will be skipped.');
}

const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const users = new Users(appwriteClient);

// ── Fetch all Appwrite users ──────────────────────────────────────────────────

console.log('Fetching Appwrite users...');

const allAppwriteUsers = [];
const PAGE_SIZE = 100;
let offset = 0;

while (true) {
  // node-appwrite v13+ uses Query-based pagination (not positional offset/limit params)
  const response = await users.list({
    queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
  });
  const batch = response.users ?? [];

  if (batch.length === 0) break;

  allAppwriteUsers.push(...batch);
  offset += batch.length;

  console.log(`  Fetched ${allAppwriteUsers.length} / ${response.total} users`);

  if (allAppwriteUsers.length >= response.total) break;
}

console.log(`Total Appwrite users: ${allAppwriteUsers.length}`);

if (allAppwriteUsers.length === 0) {
  console.log('No users to migrate.');
  process.exit(0);
}

// ── Import into Firebase Auth ─────────────────────────────────────────────────

let totalImported = 0;
let totalEmailsSent = 0;
let totalErrors = 0;

// Import in batches of 100 (Firebase max)
for (let i = 0; i < allAppwriteUsers.length; i += PAGE_SIZE) {
  const batch = allAppwriteUsers.slice(i, i + PAGE_SIZE);

  const importRecords = batch.map((u) => ({
    uid: u.$id,
    email: u.email || undefined,
    displayName: u.name || undefined,
    emailVerified: u.emailVerification ?? false,
  }));

  let importResult;
  try {
    importResult = await adminAuth.importUsers(importRecords);

    const successCount = importRecords.length - importResult.errors.length;
    totalImported += successCount;

    if (importResult.errors.length > 0) {
      for (const err of importResult.errors) {
        const u = importRecords[err.index];
        // Skip "already exists" errors — those users were already migrated
        if (err.error?.code === 'auth/uid-already-exists') {
          totalImported += 1; // count them as already imported
          continue;
        }
        console.warn(`  Import error for uid ${u?.uid}: ${err.error?.message}`);
        totalErrors += 1;
      }
    }

    console.log(`  Imported batch ${Math.floor(i / PAGE_SIZE) + 1}: ${successCount} users`);
  } catch (importErr) {
    console.error(`  Batch import failed: ${importErr.message}`);
    totalErrors += batch.length;
    continue;
  }

  // ── Send password reset emails ────────────────────────────────────────────

  if (!RESEND_API_KEY) continue;

  for (const u of batch) {
    if (!u.email) continue;

    try {
      const resetLink = await adminAuth.generatePasswordResetLink(u.email);
      const name = u.name || 'there';

      const emailHtml = `
        <p>Hi ${name},</p>
        <p>We have moved to a new platform. Your account has been migrated and you can continue using Alvey as normal.</p>
        <p>To get started, you need to set a new password by clicking the link below:</p>
        <p><a href="${resetLink}" style="background:#164e5e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Set My Password →</a></p>
        <p>This link expires in 1 hour. If you need a new one, use the "Forgot password" link on the sign-in page.</p>
        <p>If you did not expect this email, you can safely ignore it.</p>
        <p>— The Alvey Team</p>
      `.trim();

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@alvey.study',
          to: u.email,
          subject: 'Set your password for Alvey',
          html: emailHtml,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.warn(`  Email failed for ${u.email}: ${errText}`);
        totalErrors += 1;
      } else {
        totalEmailsSent += 1;
      }
    } catch (emailErr) {
      console.warn(`  Error for ${u.email}: ${emailErr.message}`);
      totalErrors += 1;
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n──────────────────────────────────');
console.log(`✅ Imported  ${totalImported} users`);
console.log(`📧 Sent      ${totalEmailsSent} reset emails`);
console.log(`❌ Errors    ${totalErrors}`);
console.log('──────────────────────────────────\n');

process.exit(0);
