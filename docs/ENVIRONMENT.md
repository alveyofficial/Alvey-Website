# Environment Configuration — Alvey

Implements SRS §23.4.

## Categories

| Category         | Where it lives                              | Exposed to browser?     |
| ---------------- | ------------------------------------------- | ----------------------- |
| Public config    | `VITE_*` in `.env` / Firebase App Hosting   | Yes (build-time inline) |
| Server secrets   | Firebase / Cloud Functions secrets          | No (server only)        |
| Feature flags    | `src/lib/config.ts` (+ optional env)        | Depends on prefix       |
| DB / auth config | Firebase project config / Function secrets  | No                      |

## Rules

1. Never place a secret in any file that ships to the browser.
2. Only `VITE_`-prefixed vars are inlined into the client bundle.
3. Server code reads secrets via `process.env.*` **inside** handler bodies —
   never at module scope of files the client imports.
4. Add new secrets via `firebase functions:secrets:set` (never edit `.env` in production).
5. Rotate credentials on a schedule and after any suspected exposure (§23.14).

## Current Variables

See `.env.example` for the canonical list. Present today:

**Client (browser-safe, `VITE_` prefix):**

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
  `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` — Firebase project config
- `VITE_FIREBASE_VAPID_KEY` — FCM VAPID key for browser push notifications
- `VITE_NOTIFICATIONS_FUNCTION_URL` — URL of the `websiteNotifications` Cloud Function

**Server / Cloud Functions (secrets, not in client bundle):**

- `GEMINI_API_KEY` — Gemini API key used by the `alveyAiBrain` Cloud Function
- `AI_FUNCTION_URL` — URL of the deployed `alveyAiBrain` Cloud Function

## Adding a New Integration

1. Design the surface (server function or `/api/public/*` route).
2. Register the secret via `firebase functions:secrets:set`.
3. Read it inside the function handler; never at module scope.
4. Update `.env.example` with a **blank** placeholder and a comment.
5. Document rotation ownership in `MAINTENANCE.md`.
