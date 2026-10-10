/**
 * Firebase Admin SDK — server-side only.
 * Initialized lazily from the FIREBASE_SERVICE_ACCOUNT_JSON environment variable.
 * Never import this from client-side code.
 *
 * SETUP: Firebase Console → Project Settings → Service Accounts → Generate new key.
 * Set the full JSON content (minified) as FIREBASE_SERVICE_ACCOUNT_JSON in your env.
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _adminApp: App | null = null;

function getAdminApp(): App {
  if (_adminApp) return _adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    _adminApp = existing[0];
    return _adminApp;
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var is not set. ' +
      'Download a service account key from Firebase Console → Project Settings → Service Accounts.',
    );
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  _adminApp = initializeApp({ credential: cert(serviceAccount) });
  return _adminApp;
}

// Lazy getters — initialization is deferred until the first request that needs it.
// This prevents the server from crashing on startup when the env var isn't set.

let _adminAuth: Auth | null = null;
export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

let _adminDb: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

// Convenience re-exports for callers that prefer property access.
// These are getters so they remain lazy.
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getAdminAuth() as any)[prop];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as any)[prop];
  },
});
