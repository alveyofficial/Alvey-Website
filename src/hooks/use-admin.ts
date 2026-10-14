/**
 * useAdmin — React hook that reads custom claims from the current user's
 * Firebase ID token.
 *
 * - Forces a token refresh once on mount so claims are always fresh.
 * - Returns { isAdmin, role, isStaff, isTutor, isStudent, loading, error }.
 *
 * Usage:
 *   const { isAdmin, role, loading } = useAdmin();
 *   if (loading) return <Spinner />;
 *   if (!isAdmin) return <Redirect to="/" />;
 */

import { useEffect, useState } from "react";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import type { UserRole } from "@/lib/user-role";

interface UseAdminResult {
  isAdmin: boolean;
  role: UserRole | null;
  isStaff: boolean;
  isTutor: boolean;
  isStudent: boolean;
  loading: boolean;
  error: Error | null;
}

export function useAdmin(): UseAdminResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setRole(null);
        setIsStaff(false);
        setIsTutor(false);
        setIsStudent(false);
        setLoading(false);
        return;
      }

      try {
        // Force refresh = true ensures we get the latest claims,
        // not a potentially stale cached token.
        const tokenResult = await user.getIdTokenResult(/* forceRefresh */ true);
        const adminClaim = tokenResult.claims.admin === true;
        const roleClaim = (tokenResult.claims.role as string | undefined) ?? null;

        setIsAdmin(adminClaim);
        setRole(roleClaim as UserRole);
        setIsStaff(roleClaim === "staff");
        setIsTutor(roleClaim === "tutor");
        setIsStudent(roleClaim === "student");
        setError(null);
      } catch (err) {
        console.error("useAdmin: failed to read token claims", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAdmin(false);
        setRole(null);
        setIsStaff(false);
        setIsTutor(false);
        setIsStudent(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, role, isStaff, isTutor, isStudent, loading, error };
}

/**
 * Standalone helper — gets the current admin status once without subscribing.
 * Useful in server route handlers or one-off checks.
 */
export async function getAdminStatus(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(true);
    return tokenResult.claims.admin === true;
  } catch {
    return false;
  }
}

/**
 * Gets the current user's raw ID token (for Authorization headers).
 * Forces a refresh to ensure the admin claim is included.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(/* forceRefresh */ true);
  } catch {
    return null;
  }
}
