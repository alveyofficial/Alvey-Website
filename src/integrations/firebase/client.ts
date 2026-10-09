/**
 * Firebase client — drop-in replacement for src/integrations/appwrite/client.ts
 *
 * Exposes the same `firebase` object shape so routes and hooks need minimal changes.
 * All config values are VITE_-prefixed so Vite inlines them at build time.
 * They are safe to expose client-side; Firebase restricts access via Security Rules
 * and authorized domains, not by keeping the config secret.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
  applyActionCode,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";

// ---------------------------------------------------------------------------
// Config — reads from VITE_ env vars, falls back to the project defaults.
// Override these in your .env file (never commit real secrets to git).
// ---------------------------------------------------------------------------

function readEnv(key: string, fallback = ""): string {
  try {
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    if (viteEnv?.[key]) return viteEnv[key];
  } catch {
    // SSR / non-Vite context
  }
  try {
    const processEnv = (
      globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
    ).process?.env;
    if (processEnv?.[key]) return processEnv[key] as string;
  } catch {
    // ignore
  }
  return fallback;
}

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY", "AIzaSyD2wBtozKXsTu7UakF9_VxU6Vb2QDd_zfo"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN", "alvey-website.firebaseapp.com"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID", "alvey-website"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET", "alvey-website.firebasestorage.app"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "1020096383368"),
  appId: readEnv("VITE_FIREBASE_APP_ID", "1:1020096383368:web:5aacf2315e30648042923d"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID", "G-JPFY32QJR1"),
};

// ---------------------------------------------------------------------------
// Singleton app initialisation (safe to call multiple times in SSR contexts)
// ---------------------------------------------------------------------------

function getFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics is browser-only
export const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : Promise.resolve(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AUTH_EVENT = "alvey-auth-change";

function emitAuthChange(user: User | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user ? { user } : null }));
}

type NormalizedUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
};

function normalizeUser(user: User | null): NormalizedUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    name: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
  };
}

export async function getCurrentUser(): Promise<NormalizedUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(normalizeUser(user));
    });
  });
}

// ---------------------------------------------------------------------------
// OAuth provider map
// ---------------------------------------------------------------------------

function getOAuthProvider(provider: string) {
  switch (provider) {
    case "google":
      return new GoogleAuthProvider();
    case "apple":
      return new OAuthProvider("apple.com");
    case "microsoft":
      return new OAuthProvider("microsoft.com");
    case "discord":
      // Discord is not a built-in Firebase OAuth provider.
      // Use a custom OAuthProvider if you add it in the Firebase console.
      return new OAuthProvider("discord.com");
    case "linkedin":
      return new OAuthProvider("linkedin.com");
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

// ---------------------------------------------------------------------------
// Main export — same shape as the Appwrite client so call-sites change minimally
// ---------------------------------------------------------------------------

export const firebase = {
  /** Raw Firebase services — use when you need direct Firestore / Storage access */
  app,
  db,
  storage,
  functions,

  auth: {
    async getUser() {
      const user = await getCurrentUser();
      return { data: { user } };
    },

    async getSession() {
      const user = await getCurrentUser();
      return { data: { session: user ? { user } : null } };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = normalizeUser(credential.user);
        emitAuthChange(credential.user);
        return { data: { session: user ? { user } : null }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: {
        emailRedirectTo?: string;
        data?: Record<string, unknown>;
      };
    }) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        const displayName = String(
          options?.data?.display_name ??
            options?.data?.name ??
            email.split("@")[0] ??
            "Alvey User",
        );

        await updateProfile(credential.user, { displayName });
        await sendEmailVerification(credential.user);

        const user = normalizeUser(credential.user);
        emitAuthChange(credential.user);

        return { data: { session: user ? { user } : null }, error: null };
      } catch (error) {
        return {
          data: { session: null },
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    },

    async signOut() {
      try {
        await firebaseSignOut(auth);
        emitAuthChange(null);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    async createRecovery(email: string, _redirectUrl: string) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    async updateRecovery(_userId: string, oobCode: string, newPassword: string) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    async updateName(name: string) {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");
        await updateProfile(user, { displayName: name });
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    async updatePassword(newPassword: string, _oldPassword: string) {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");
        // Firebase requires recent sign-in for sensitive operations.
        // If this throws, prompt the user to re-authenticate.
        await firebaseUpdatePassword(user, newPassword);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    async updateVerification(_userId: string, oobCode: string) {
      try {
        await applyActionCode(auth, oobCode);
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    },

    async signInWithOAuth(
      provider: "google" | "apple" | "microsoft" | "discord" | "linkedin",
      _opts?: { redirect_uri?: string; extraParams?: Record<string, string> },
    ) {
      try {
        const oauthProvider = getOAuthProvider(provider);
        await signInWithRedirect(auth, oauthProvider);
        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }
    },

    onAuthStateChange(
      callback: (_event: string, session: { user: NormalizedUser } | null) => void,
    ) {
      const listener = (event: Event) => {
        const session = (event as CustomEvent).detail ?? null;
        callback("change", session);
      };
      if (typeof window !== "undefined") {
        window.addEventListener(AUTH_EVENT, listener);
      }
      // Also wire up the native Firebase listener so we catch tab-switches etc.
      const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
        emitAuthChange(user);
      });
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (typeof window !== "undefined") {
                window.removeEventListener(AUTH_EVENT, listener);
              }
              unsubscribeFirebase();
            },
          },
        },
      };
    },
  },
} as const;
