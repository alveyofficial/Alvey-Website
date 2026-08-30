# Folder & File Structure (dev branch)

## Backend (`/backend`)

- `main.js` — entry point. Sets up Express, CORS, cookies, mounts routes, starts the server.
- `appwrite.js` — the single shared Appwrite client, database ID, and the `table` object (collection ID lookups).
- `env/.env` / `env/.env.example` — environment variables. `.env` is not committed, copy `.env.example`.
- `api/` — logic files only. Talks to Appwrite. No Express (`req`/`res`) in here.
  - `find-a-tutor.js` — pulls tutor profile data from Appwrite.
  - `auth/logic.js` — all Appwrite Auth calls (signup, login, verify, recovery, oauth, roles).
- `routes/` — Express route files only. Talks to `req`/`res`. Calls into `api/` for the actual Appwrite work.
  - `auth.js` — all `/auth/*` endpoints (signup, login, logout, verify, recovery, oauth).

## Frontend (`/frontend`)

- `src/main.tsx` — React entry point, mounts the app.
- `src/App.tsx` — top-level app component.
- `src/App.css` / `src/index.css` — global styles.
- `src/components/` — shared components used across pages.
  - `Navbar/` — site navbar.
- `src/pages/` — one folder per page. Each has a `.tsx` (the page) and a matching `.css` (its styles).
  - `Home/` — homepage.
  - `Auth/` — login/signup page.
  - `Contact/` — contact page.
  - `Apply/` — volunteer/tutor application page.
  - `WorkWithUs/` — work-with-us page.
  - `FindTutor/` — public tutor search page.
  - `Tutors/` — tutor listing/profile page. `TutorsLoading` is its loading state.
  - `ErrorPage/` — fallback error page.
  - `Admin/` — all admin-only pages.
    - `AdminLayout` — shared layout/shell for admin pages.
    - `Homepage`, `LandingPage`, `Pages` — site content management.
    - `Analytics`, `Scheduling`, `Notifications`, `Settings` — admin tools.
    - `Students`, `Tutors`, `TutorApplications`, `ArchivedTutorsApp` — tutor/student management.
    - `RecruitmentApps`, `ArchivedRecruitmentApps` — recruitment management.
    - `Advertisement`, `Reviews` — content/review management.
    - `AIAssistant` — admin AI assistant page.