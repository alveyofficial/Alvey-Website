# Testing & Quality Assurance — Alvey

Implements SRS §24.

## Current State (assumption, see §27)

No automated test runner is wired into `package.json` yet (`scripts.lint`
and `scripts.format` exist; there is no `scripts.test`). Until an automated
suite is added, QA is manual and checklist-driven, following this document.
§24.15 lists automated testing as a planned enhancement — see the "Future
Testing" section below for the intended tooling.

## Testing Scope (§24.3)

Every release should be checked against the surfaces listed in
`docs/DEPLOYMENT.md` §6 (Post-Deploy Verification) plus the scenarios below,
scoped to whichever areas the release actually touched:

| Surface                               | Owner            | Notes                                 |
| ------------------------------------- | ---------------- | ------------------------------------- |
| Public website (`/_public/*`)         | Website Manager  | SEO meta, responsive layout           |
| Auth (`/auth`)                        | Website Manager  | Email/password + Google OAuth         |
| Student portal (`/dashboard/*`)       | Website Manager  | RBAC-gated                            |
| Tutor portal (`/tutor/*`)             | Website Manager  | RBAC-gated                            |
| Recruitment portal (`/recruitment/*`) | Recruitment Team | RBAC-gated                            |
| Admin dashboard (`/admin/*`)          | Owner            | RBAC-gated, incl. Analytics (§20)     |
| AI Assistant (`/api/chatbot`)         | Website Manager  | Requires `GEMINI_API_KEY`             |
| Scheduling & conflict detection       | Website Manager  | See `admin/scheduling.tsx`            |
| Discord integration                   | Website Manager  | Feature-flagged (`src/lib/config.ts`) |
| Notifications                         | Website Manager  | Per-role notification pages           |

## Functional Testing (§24.4)

For each feature above, verify against its acceptance criteria in the
relevant SRS section before merging:

- Registration & authentication (§ auth flows) — sign up, sign in, Google
  OAuth, session persistence, sign out.
- Tutor / recruitment applications — submission, staff review, status
  transitions (`pending` → `under_review` → `approved`/`rejected`),
  automatic role assignment and tutor-profile creation on approval
  (`DataStore.updateTutorApplicationStatus`).
- Lesson scheduling — creation, conflict detection
  (`admin/scheduling.tsx` `checkConflicts`), status changes, cancellation,
  notification dispatch.
- Reviews — submission, moderation (approve/reject/restore), tutor
  responses.
- Notifications — creation, mark-as-read, mark-all-read, per-portal
  filtering by `user_id`.
- Analytics (§20) — dashboard metrics match the underlying record counts;
  date-range filters narrow lesson metrics correctly; CSV export produces
  a valid file; unauthorized roles see "Access Restricted" instead of data.

## UI Testing (§24.5)

- Responsive at 320px, 768px, 1024px, 1440px breakpoints.
- Dark mode and light mode parity (`.dark` class in `src/styles.css`).
- Form validation messages are visible and accurate (`sonner` toasts).
- Navigation highlights the active route (`portal-layout.tsx`
  `isActive` logic).

## Security Testing (§24.6)

- Confirm Firestore Security Rules still match the access patterns each
  portal exercises (e.g. a student cannot read another student's lessons;
  a tutor cannot approve their own application).
- Confirm every `/admin/*` and `/recruitment/*` page that displays
  aggregate or personal data checks `DataStore.getUserRoles` before
  rendering (see the guards added to `admin/index.tsx`,
  `admin/analytics.tsx`, and `recruitment/index.tsx`) — this is currently
  enforced client-side per-page rather than centrally in
  `_authenticated.tsx`'s `beforeLoad`; see §27 for the tracked follow-up.
- Confirm server-role secrets (`GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`,
  `RESEND_API_KEY`) never appear in client-bundled code (only inside
  `*.server.ts`, server route handlers, or Firebase Function secrets).

## Performance Testing (§24.7)

- Confirm list views that can grow unbounded (lessons, applications,
  reviews, audit logs) apply `Query.limit(...)` as they already do in
  `data-store.ts`.
- Confirm analytics aggregation (`src/lib/analytics.ts`) stays responsive
  as record counts grow; it currently does a full in-memory scan per
  dashboard load, which is acceptable at current scale but should move to
  precomputed/cached values per §20.15 once volume grows materially.

## Integration Testing (§24.8)

Verify the seams between:

- Frontend ↔ Firebase (Firestore, Auth, Storage) (`src/integrations/firebase`).
- `/api/chatbot` ↔ Gemini (`@google/genai`).
- Discord synchronization (when `features.discordSync` is enabled in
  `src/lib/config.ts`).

## Regression Testing (§24.9)

Before publishing, re-run the critical workflows in "Functional Testing"
above, prioritizing whichever areas the release touched, plus:

- Login → dashboard redirect for each role.
- Tutor application approval → role + tutor profile creation.
- Lesson scheduling with a deliberate double-booking (should be blocked).

## Acceptance Testing (§24.10)

Major workflow changes should be reviewed against the relevant SRS
section by an Owner or Website Manager before publishing. Features that
fail acceptance criteria are not released.

## Error Handling (§24.11)

- Confirm network/database failures degrade gracefully rather than
  crashing — most of `data-store.ts` already wraps Firestore calls in
  try/catch and falls back to local mock data; new code should follow the
  same pattern (see `src/lib/analytics.ts`'s `safeList` helper).
- Confirm the root error boundary (`src/routes/__root.tsx`
  `ErrorComponent`) renders instead of a blank page on unexpected errors.

## Accessibility Testing (§24.12)

- Keyboard-only navigation through primary flows (sign in, book a lesson,
  submit an application).
- Visible focus rings are preserved (shadcn/ui defaults; do not remove
  `focus-visible` classes).
- Color contrast on status badges and buttons meets WCAG AA.

## Data Validation (§24.13)

- Required fields are enforced both client-side (form checks) and
  server-side (Firestore Security Rules / required field validation in
  `src/lib/data-store.ts`).
- Duplicate prevention: unique constraints exist on
  `student_tutor_assignments (student_id, tutor_id)` and
  `reviews (tutor_id, student_id)`.

## Bug Management (§24.14)

Track defects with: description, reproduction steps, expected vs. actual
behavior, severity, affected components, and resolution status. Verify
the fix against the original repro before closing.

## Future Testing (§24.15)

Planned, not yet implemented — introduce without changing the existing
architecture:

- **Unit/component tests:** Vitest + React Testing Library for
  `src/lib/*` (especially `analytics.ts`'s pure aggregation functions,
  which are already side-effect-free and easy to unit test) and shared
  UI components in `src/components/`.
- **End-to-end tests:** Playwright, covering the "Regression Testing"
  workflows above.
- **CI integration:** run lint + unit tests on every PR; run the
  Playwright suite before publish.
- **Visual regression:** Chromatic or Playwright screenshot comparison
  for the shared design system in `src/components/ui/`.
