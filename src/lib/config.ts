/**
 * Centralized runtime configuration & feature flags.
 * See docs/ENVIRONMENT.md for the full contract.
 *
 * Rules:
 * - Only VITE_-prefixed values are safe on the client.
 * - Server-only values must be read inside server-fn handlers, not here.
 */

export const APP_VERSION = "1.0.0";
export const APP_NAME = "Alvey";

/** Feature flags — flip to gate incomplete or non-essential features. */
export const features = {
  aiAssistant: true,
  discordSync: true,
  payments: true,
  messaging: false,
  classroom: true,
} as const;

export type FeatureFlag = keyof typeof features;

export function isEnabled(flag: FeatureFlag): boolean {
  return features[flag] === true;
}
