# Assumptions & Constraints — Alvey

Documents the assumptions, constraints, and known open items that shaped
implementation decisions. Corresponds to SRS §27.

---

## Assumptions

### A-1 — Single Firebase project per environment

The Firebase project ID (surfaced via `VITE_FIREBASE_PROJECT_ID`) is the
sole backend in each environment. All collections introduced during the
analytics sprint (`users`, `tutor_profiles`) live in the Firestore database
of that project and are provisioned via `src/lib/data-store.ts`.

### A-2 — `_createdAt` populated by `createDocument`

All Firestore documents written through `createDocument` in
`src/lib/data-store.ts` carry a `_createdAt` ISO 8601 timestamp set at
write time. The enrollment-trend chart (`src/lib/analytics.ts`
`getEnrollmentTrend`) depends on this field being present and accurate.
If a document was backfilled/imported without going through `createDocument`,
`_createdAt` will be absent and that record will be silently excluded from
trend data (safe degradation per A-7).

### A-3 — `DataStore` is the authoritative client for domain reads

All product features read platform data through `src/lib/data-store.ts`.
The analytics module (`src/lib/analytics.ts`) is intentionally additive:
it reuses `DataStore` public methods for all data it can reach that way,
and falls back to direct Firestore reads only for fields `DataStore` does
not expose (specifically `_createdAt` timestamps needed for trend charts,
set by `createDocument` in `data-store.ts`).
This keeps the analytics layer thin and avoids duplicating business logic.

### A-4 — Role identifiers are stable strings

Role-based access guards compare against the string literals
`"website_manager"`, `"owner"`, and `"recruitment"`. These must match
whatever values `DataStore.getUserRoles` returns. Any rename in the roles
collection must be reflected in all three guarded
pages (`admin/index.tsx`, `admin/analytics.tsx`, `recruitment/index.tsx`).

### A-5 — Lessons have a `starts_at` ISO datetime field

`getLessonTrend` and `getAdminDashboardMetrics` bucket lessons by
`starts_at`. If the field name differs in production, update the
`(l as any).starts_at` references in `analytics.ts` accordingly.

### A-6 — Lessons carry a `subject` string field

`getTopSubjects` groups lessons by the `subject` field. Lessons with a
missing or empty subject are silently excluded from the subjects chart.

### A-7 — All analytics failures degrade gracefully

Every Firestore call in `src/lib/analytics.ts` is wrapped in a `safeList`
helper that returns `[]` on error, matching the resilience pattern in
`data-store.ts`. Dashboards will render with zeroed metrics rather than
crashing if a collection is temporarily unavailable or if the app is running
against local mock data.

### A-8 — CSV export is browser-side only

`downloadCsv` (§20.13) creates a Blob URL and triggers a click on an
`<a>` element. It therefore requires a real browser environment and will
not work in SSR/server contexts. The export button is rendered only inside
client components, so this is safe.

---

## Constraints

### C-1 — No new dependencies added in the analytics sprint

`src/lib/analytics.ts` uses only packages already present in `package.json`:
Firebase SDK (`firebase`), Recharts (`recharts`), and the existing Lucide
icon set. No new `npm install` step is required.

### C-2 — Analytics aggregation is computed on the client, in memory

At current data volumes this is acceptable. The aggregation reads at most
a few thousand documents per page load. At materially larger scale (tens of
thousands of lessons or users), the analytics functions should move to a
server function or precomputed/cached representation (see §20.15 and
`docs/MAINTENANCE.md` §5).

### C-3 — Role-based access is enforced client-side per page

Auth guards on `admin/index.tsx`, `admin/analytics.tsx`, and
`recruitment/index.tsx` call `DataStore.getUserRoles` after the component
mounts and show `<EmptyState>` for unauthorized users. This is intentional
client-side defense-in-depth for the UI layer; the actual data is protected
by Firestore Security Rules and is not exposed via unguarded API routes.
A follow-up task to move these guards centrally into `_authenticated.tsx`'s
`beforeLoad` is tracked in C-4.

### C-4 — Centralized auth enforcement is a known open item

**Open item (tracked):** Role-based guards are currently per-page rather
than centralized in the `_authenticated` layout's `beforeLoad` hook.
A centralized implementation would be more maintainable and eliminate the
risk of a new page being added without its own guard. This is flagged for
a follow-up sprint and does not block the current analytics release, because
data is already protected at the Firestore layer (C-3).

### C-5 — AI Assistant analytics not implemented (§20.8)

Conversations in the current chatbot implementation (`/api/chatbot.ts`,
`AIChatbot.tsx`) are not persisted to any database — each request is
stateless. §20.8 (AI Assistant usage analytics) therefore cannot be
implemented without first adding conversation persistence, which is out of
scope for this sprint. The `aiAssistantEnabled` flag in
`AdminDashboardMetrics` reflects only whether the AI config record sets
`enabled: true`, not session volume.

### C-6 — Website analytics not implemented (§20.9)

§20.9 (Website Analytics) requires an external analytics platform
(e.g. Plausible, PostHog, or Google Analytics). No such integration exists
yet. This is explicitly listed as a future enhancement in the SRS itself.

### C-7 — Firebase migration complete

The migration from Appwrite to Firebase is complete. All data operations now
go through Firebase (Firestore, Auth, Storage). The `src/integrations/firebase`
module is the sole backend integration. New features should use `data-store.ts`
and the Firebase SDK exclusively.

---

## Open Items Summary

| ID  | Description                                                              | Blocking?                            |
| --- | ------------------------------------------------------------------------ | ------------------------------------ |
| C-4 | Centralize role guards in `_authenticated.tsx` `beforeLoad`              | No                                   |
| C-5 | AI Assistant conversation persistence needed for §20.8                   | No                                   |
| C-6 | External analytics platform needed for §20.9                             | No                                   |
| —   | Automated test suite not yet wired (`package.json` has no `test` script) | No — see `docs/TESTING_QA.md` §24.15 |
