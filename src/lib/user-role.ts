/**
 * Shared UserRole union type — single source of truth for valid role values.
 * Import this in every file that reads or writes the `role` field on user documents.
 */

export type UserRole = "guest" | "student" | "tutor" | "admin" | "staff";

const VALID_ROLES = new Set<string>(["guest", "student", "tutor", "admin", "staff"]);

export function isValidRole(r: unknown): r is UserRole {
  return typeof r === "string" && VALID_ROLES.has(r);
}
