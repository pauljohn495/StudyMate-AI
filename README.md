# StudyMate AI

StudyMate AI is a mobile-first study workspace that turns student-owned learning materials into organized lessons, reviewers, summaries, flashcards, and measurable learning progress.

Phases 1–11 are implemented: a responsive installable PWA, Express API, JWT authentication, subject and lesson management, secure document upload, PDF/DOCX/PPTX/TXT extraction, grounded Gemini study tools, persisted flashcards and quizzes, deterministic scoring and analytics, a cited lesson tutor, timed multi-lesson practice exams, a weak-topic-aware study planner, and a production-polish pass covering accessibility, global search, mobile navigation, editable profiles, error recovery, and API hardening.

## Quick start

Requirements: Node.js 20+, npm, and Docker Desktop.

```bash
copy .env.example .env
npm install
npm run db:up
npm run dev
```

Open `http://localhost:5173`. The **Explore demo** path runs entirely in the browser and includes flashcard, quiz, tutor, practice-exam, and study-planner workflows without MySQL or Gemini. Registering a real account uses the Express API and MySQL.

In a production build served over HTTPS (or locally through `localhost`), supported browsers offer an **Install** action in the application header. Safari on iPhone and iPad displays instructions for adding StudyMate to the Home Screen. The service worker keeps the application shell and previously opened frontend bundles available offline. Safe GET responses are cached for 30 days in user-isolated IndexedDB storage and are removed at logout; AI generation, uploads, scoring submissions, and other writes still require a connection.

## Commands

```bash
npm run dev                         # web + API
npm run build                       # production builds
npm run typecheck                   # TypeScript validation
npm run test -w @studymate/api      # document and study-feature tests
npm run db:up                       # start MySQL with Docker
npm run db:down                     # stop local services
```

API health check: `GET http://localhost:4000/api/health`

Document limits default to 20 MB, 200 PDF pages or presentation slides, and five uploads per user per day. AI generation limits are configurable in `.env`. Image-only PDFs require OCR, which is intentionally deferred to a later version.

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

- `apps/web` — React, TypeScript, Vite, Tailwind, React Router
- `apps/api` — Express, TypeScript, MySQL, JWT, bcrypt, Zod, Gemini
- `database/schema.sql` — normalized database schema and indexes
- `database/migrations` — incremental schema upgrades
- `docs/SYSTEM_DESIGN.md` — architecture, endpoint map, AI design, and roadmap

Secrets belong in `.env`, which is gitignored. The Gemini key is server-only.
