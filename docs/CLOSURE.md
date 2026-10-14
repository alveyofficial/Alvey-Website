# Project Closure Report — Alvey

Covers the analytics & reporting sprint (SRS §20, §24, §27, §28).

---

## 1. Scope Delivered

### SRS §20 — Analytics & Reporting

| Sub-section | Feature                                                                                                          | Status                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| §20.3       | Admin dashboard — real platform metrics (students, tutors, lessons, ratings, ads, reviews, MoM growth)           | ✅ Delivered                                                                         |
| §20.4       | Enrollment growth trend chart (students + tutors, monthly, 7-month window)                                       | ✅ Delivered                                                                         |
| §20.5       | Lesson volume trend chart (monthly, 7-month window)                                                              | ✅ Delivered                                                                         |
| §20.6       | Top subjects by lesson volume (bar chart with relative %)                                                        | ✅ Delivered                                                                         |
| §20.7       | Recruitment analytics dashboard (pending, under review, approved, rejected, 30-day submissions, approval rate %) | ✅ Delivered                                                                         |
| §20.8       | AI Assistant usage analytics                                                                                     | ⏭ Deferred — conversations not persisted (see `docs/ASSUMPTIONS_CONSTRAINTS.md` C-5) |
| §20.9       | Website analytics                                                                                                | ⏭ Deferred — requires external platform (see C-6)                                    |
| §20.13      | CSV export of admin dashboard metrics                                                                            | ✅ Delivered                                                                         |
| §20.14      | Role-based access guards on all analytics pages                                                                  | ✅ Delivered                                                                         |
| §20.15      | Server-side / cached aggregation at scale                                                                        | ⏭ Deferred — current in-memory approach is sufficient at present volume              |

### SRS §24 — Testing & QA

- `docs/TESTING_QA.md` created, covering functional, UI, security, performance,
  integration, regression, acceptance, accessibility, and data validation
  testing, plus a roadmap for automated testing (Vitest, React Testing Library,
  Playwright).

### SRS §27 — Assumptions & Constraints

- `docs/ASSUMPTIONS_CONSTRAINTS.md` created, recording every design decision,
  constraint, and known open item introduced during this sprint.

### SRS §28 — Project Closure

- This document.

---

## 2. Files Added / Modified

### New files (additive — no existing file was deleted or structurally changed)

| File                                              | Purpose                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/lib/analytics.ts`                            | Aggregation layer: dashboard metrics, trend data, subject breakdown, recruitment metrics, CSV export |
| `src/routes/_authenticated/admin/analytics.tsx`   | Analytics page with date-range filter, charts, CSV export, role guard                                |
| `src/routes/_authenticated/admin/index.tsx`       | Admin dashboard wired to real metrics                                                                |
| `src/routes/_authenticated/recruitment/index.tsx` | Recruitment dashboard wired to real metrics                                                          |
| `docs/TESTING_QA.md`                              | SRS §24 — Testing & QA plan                                                                          |
| `docs/ASSUMPTIONS_CONSTRAINTS.md`                 | SRS §27 — Assumptions & Constraints                                                                  |
| `docs/CLOSURE.md`                                 | This document (SRS §28)                                                                              |

### Dependencies added

None. All charts use the existing Recharts dependency; all icons use the
existing Lucide set; all backend calls use the existing Firebase SDK.

---

## 3. Architecture Decisions

- **Additive analytics module:** `analytics.ts` wraps `DataStore`'s existing
  public methods wherever possible; direct Firestore queries are used only
  for `_createdAt` timestamps (set by `createDocument` in `data-store.ts`)
  that `DataStore` does not expose. This means the analytics layer is
  trivially removable and has no side-effects on existing features.
- **Client-side aggregation:** deliberate at current scale (< thousands of
  records). The `safeList` helper and `Promise.all` fan-out keep perceived
  load times low.
- **Per-page role guards:** chosen over centralized `beforeLoad` guards to
  avoid touching the existing `_authenticated.tsx` layout during this sprint.
  The centralized approach is tracked as an open item (C-4 in
  `ASSUMPTIONS_CONSTRAINTS.md`).

---

## 4. Known Gaps (non-blocking)

| Gap                                | Resolution Path                                                           |
| ---------------------------------- | ------------------------------------------------------------------------- |
| AI Assistant analytics (§20.8)     | Add conversation persistence first, then wire `analytics.ts`              |
| Website analytics (§20.9)          | Integrate Plausible / PostHog / GA and expose events via analytics module |
| Centralized auth enforcement (C-4) | Move `getUserRoles` check into `_authenticated.tsx` `beforeLoad`          |
| Automated test suite               | Follow `docs/TESTING_QA.md` §24.15 roadmap (Vitest + Playwright)          |

---

## 5. Handoff Notes

- The analytics module is designed to be extended: add new exported async
  functions to `src/lib/analytics.ts`; consume them in the relevant page
  using the same `Promise.all` pattern already in use.
- The `ChartContainer` / Recharts pattern used in `admin/analytics.tsx`
  matches the existing chart usage elsewhere in the codebase — new charts
  should follow the same pattern.
- All three role guards check `DataStore.getUserRoles(uid)` client-side.
  If role identifiers are ever renamed, update the guard comparisons in
  all three files (see `docs/ASSUMPTIONS_CONSTRAINTS.md` A-4).
- CSV export via `downloadCsv` is purely client-side. Pass any flat array
  of objects to export arbitrary datasets in the future.

---

## 6. Sign-off

| Role            | Sign-off                     |
| --------------- | ---------------------------- |
| Developer       | Completed — analytics sprint |
| Website Manager | Pending review               |
| Owner           | Pending approval             |
