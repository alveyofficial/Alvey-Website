/**
 * One-time bootstrap script — grants a custom claim (admin or role) to a user by UID.
 *
 * Usage:
 *   node -r dotenv/config scripts/set-admin.mjs <uid> [admin|student|tutor|staff]
 *
 * Examples:
 *   node -r dotenv/config scripts/set-admin.mjs abc123              # grants admin
 *   node -r dotenv/config scripts/set-admin.mjs abc123 admin        # grants admin
 *   node -r dotenv/config scripts/set-admin.mjs abc123 tutor        # sets role=tutor
 *   node -r dotenv/config scripts/set-admin.mjs abc123 student      # sets role=student
 *   node -r dotenv/config scripts/set-admin.mjs abc123 staff        # sets role=staff
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON to be set in your .env file.
 * Run from the repo root:
 *   node -r dotenv/config scripts/set-admin.mjs <uid>
 *
 * How to find your UID:
 *   Firebase Console → Authentication → Users → copy the User UID column.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['admin', 'student', 'tutor', 'staff'];

const uid = process.argv[2];
const role = process.argv[3] ?? 'admin';

if (!uid) {
  console.error('Usage: node scripts/set-admin.mjs <uid> [admin|student|tutor|staff]');
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`Error: role must be one of: ${VALID_ROLES.join(', ')}`);
  console.error('Usage: node scripts/set-admin.mjs <uid> [admin|student|tutor|staff]');
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error(
    'Error: FIREBASE_SERVICE_ACCOUNT_JSON is not set.\n' +
    'Run with: node -r dotenv/config scripts/set-admin.mjs <uid>',
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const auth = getAuth();

try {
  let claims;
  if (role === 'admin') {
    claims = { admin: true, role: 'admin' };
  } else {
    claims = { role };
  }

  await auth.setCustomUserClaims(uid, claims);

  // Verify it was set correctly
  const user = await auth.getUser(uid);
  console.log(`\n✅ Claims set for: ${user.email || uid}`);
  console.log(`   Custom claims: ${JSON.stringify(user.customClaims)}`);
  console.log(`\nThe user must sign out and sign back in (or refresh their token) for the claim to take effect in the browser.\n`);
} catch (error) {
  console.error('Failed to set claims:', error.message);
  process.exit(1);
}
