# StudyMate AI

StudyMate AI is a mobile-first study workspace that turns student-owned learning materials into organized lessons, reviewers, summaries, flashcards, and measurable learning progress.

Phases 1–11 are implemented: a responsive installable PWA, Express API, JWT authentication, subject and lesson management, secure document upload, PDF/DOCX/PPTX/TXT extraction, grounded Gemini study tools, persisted flashcards and quizzes, deterministic scoring and analytics, a cited lesson tutor, timed multi-lesson practice exams, a weak-topic-aware study planner, and a production-polish pass covering accessibility, global search, mobile navigation, editable profiles, error recovery, and API hardening.

## Quick start

Requirements: Node.js 20+, npm, and Docker Desktop.

```bash
npm install
npm run setup
copy backend\.env.example backend\.env
npm run db:up
npm run dev
```

Open `http://localhost:5173`. The **Explore demo** path runs entirely in the browser and includes flashcard, quiz, tutor, practice-exam, and study-planner workflows without PostgreSQL or Gemini. Registering a real account uses the Express API and PostgreSQL.

In a production build served over HTTPS (or locally through `localhost`), supported browsers offer an **Install** action in the application header. Safari on iPhone and iPad displays instructions for adding StudyMate to the Home Screen. The service worker keeps the application shell and previously opened frontend bundles available offline. Safe GET responses are cached for 30 days in user-isolated IndexedDB storage and are removed at logout; AI generation, uploads, scoring submissions, and other writes still require a connection.

## Commands

```bash
npm run dev                         # web + API
npm run build                       # production builds
npm run typecheck                   # TypeScript validation
npm test                            # API and database tests
npm run db:up                       # start PostgreSQL with Docker
npm run db:down                     # stop local services
```

API health check: `GET http://localhost:4000/api/health`

Document limits default to 20 MB, 200 PDF pages or presentation slides, and five uploads per user per day. AI generation limits are configurable in `backend/.env`. Image-only PDFs require OCR, which is intentionally deferred to a later version.

## Implemented study workflow

1. Create a subject and lesson.
2. Upload and process a PDF, DOCX, PPTX, or TXT file.
3. Detect topics or generate a grounded reviewer or summary.
4. Generate a 10, 20, or 30-card deck at a chosen difficulty.
5. Study with flip cards and rate each response Again, Hard, Good, or Easy.
6. Generate a saved quiz with configurable count, type, and difficulty.
7. Complete the quiz using deterministic scoring and review topic-level results and explanations.
8. Ask the lesson tutor questions; each response is constrained to retrieved excerpts and includes source chips.
9. Generate an optional timed practice exam spanning multiple lessons, then review scores by lesson and every saved explanation.
10. Create an exam or deadline plan; the rule engine schedules unstudied and weak lessons first.
11. Complete or recalculate tasks and use the smart preparation ranking to guide review.
12. Use the dashboard and Progress workspace to review streaks, activity, subject accuracy, weak topics, and recommended actions.
13. Reopen decks, quizzes, exams, and plans without another AI call.
14. Install StudyMate and reopen previously visited study screens during a connection outage.
15. Search the entire workspace with Ctrl/Cmd+K and navigate efficiently using the collapsible desktop sidebar or mobile bottom navigation.

## Repository

- `frontend` — independently deployable React, TypeScript, Vite, Tailwind, React Router app
- `backend` — independently deployable Express, TypeScript, PostgreSQL, Supabase Storage, JWT, bcrypt, Zod, Gemini API
- `backend/database/schema.sql` — normalized database schema and indexes
- `backend/database/migrations` — incremental schema upgrades
- `docs/SYSTEM_DESIGN.md` — architecture, endpoint map, AI design, and roadmap

Backend secrets belong in `backend/.env`, which is gitignored. The Gemini key is server-only.

## Vercel + Render + Supabase deployment

1. Create a Supabase project and run `backend/database/schema.sql` once in its SQL Editor.
2. Run `backend/database/supabase-storage.sql` to create the private `study-documents` bucket.
3. Deploy `render.yaml` as a Render Blueprint and provide `CLIENT_URL`, the Supabase Session Pooler `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY`.
4. Import the repository into Vercel with `frontend` as the Root Directory. Set `VITE_API_URL` to the Render URL followed by `/api`.
5. Set Render's `CLIENT_URL` to the final Vercel production origin, then redeploy the API.

See `docs/DEPLOYMENT.md` for the exact environment-variable and smoke-test checklist.

Production uses private Supabase Storage when its URL and secret key are configured. Local development falls back to `UPLOAD_DIR`. Never expose the Supabase secret key, database URL, Gemini key, or JWT secret through a `VITE_` environment variable.
