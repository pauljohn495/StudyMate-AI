# StudyMate AI — System Design

## Phase 11: production polish

Phase 11 adds authenticated workspace search across all major study resources, persisted desktop sidebar preferences, mobile bottom navigation, route announcements and focus management, a keyboard-accessible skip link and search dialog, a global render error boundary, editable user profiles, and clearer install/offline settings. The API applies a tighter limiter to authentication endpoints, suppresses framework disclosure, and marks responses as non-cacheable at the HTTP layer; user-isolated offline storage remains an explicit client-side feature.

## Architecture

```text
Responsive React PWA
        |
        | HTTPS / JSON + multipart uploads
        v
Express REST API
  |-- auth + ownership + validation middleware
  |-- controllers (HTTP translation)
  |-- services (business rules)
  |-- repositories (database access)
  |-- AI gateway (Gemini, quotas, cache, validation)
  |-- document pipeline (extract, clean, chunk)
        |
        +-- MySQL 8
        +-- local file storage (replaceable adapter)
        +-- Gemini API (server-side only)
```

The API is stateless and can scale horizontally. Generated resources are persisted and opened from MySQL; AI is called only for explicit generation or regeneration. Storage and AI providers are adapters so cloud storage, another model, or vector retrieval can be introduced without rewriting controllers.

## Project structure

```text
apps/web/src/
  components/       shared UI and responsive shell
  pages/            route-level views
  lib/              API client, query client, utilities
  store/            authentication and demo persistence
apps/api/src/
  config/           validated environment and database pool
  controllers/      request/response translation
  middleware/       authentication, validation, errors
  repositories/     parameterized SQL and row mapping
  routes/           REST route composition
  services/         domain orchestration and AI gateway
  utils/            errors and async helpers
database/           base schema and incremental migrations
```

## REST API

All protected resources are scoped to the authenticated user. IDs are UUIDs.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account and return a JWT |
| POST | `/api/auth/login` | Verify credentials and return a JWT |
| GET | `/api/auth/me` | Restore the current session |
| GET/POST | `/api/subjects` | List or create subjects |
| GET/PATCH/DELETE | `/api/subjects/:id` | Read, edit, archive/delete a subject |
| GET/POST | `/api/subjects/:subjectId/lessons` | List or create lessons |
| GET/PATCH/DELETE | `/api/lessons/:id` | Read, edit, or delete a lesson |
| GET | `/api/dashboard` | Read the compact analytics overview |
| GET | `/api/documents` | List the authenticated user's materials |
| GET/POST | `/api/lessons/:id/documents` | List or upload lesson materials |
| GET | `/api/documents/:id/content` | Read persisted extracted text and chunks |
| GET | `/api/documents/:id/download` | Download an ownership-checked original |
| DELETE | `/api/documents/:id` | Remove an original, extraction, and chunks |
| GET | `/api/ai/status` | Read Gemini configuration and per-feature daily quotas |
| POST | `/api/ai/detect-topics` | Detect and persist grounded lesson topics |
| POST | `/api/ai/generate-reviewer` | Generate or reuse a grounded reviewer |
| POST | `/api/ai/generate-summary` | Generate or reuse a grounded summary |
| POST | `/api/ai/generate-flashcards` | Generate or reuse a persisted flashcard deck |
| GET | `/api/lessons/:id/flashcard-decks` | List decks belonging to one lesson |
| GET | `/api/flashcard-decks` | List the user's decks with due/reviewed counters |
| GET/DELETE | `/api/flashcard-decks/:id` | Open or delete an ownership-checked deck |
| POST | `/api/flashcards/:id/review` | Save a rating and deterministic next-due date |
| POST | `/api/ai/generate-quiz` | Generate or reuse a grounded quiz |
| GET | `/api/lessons/:id/quizzes` | List quizzes belonging to one lesson |
| GET | `/api/quizzes` | List the user's quizzes and attempt summaries |
| GET/DELETE | `/api/quizzes/:id` | Open a quiz without answer keys, or delete it |
| POST | `/api/quizzes/:id/attempts` | Score and persist a quiz submission |
| GET | `/api/quiz-attempts/:id` | Read an ownership-checked result and answer review |
| POST | `/api/flashcard-decks/:id/study-sessions` | Record one completed deck study session |
| GET | `/api/progress` | Read full activity, trend, topic, and subject analytics |
| GET | `/api/tutor/lessons` | List processed lessons available to the grounded tutor |
| GET | `/api/tutor/conversations` | List the user's tutor conversations |
| GET | `/api/tutor/conversations/:id` | Read an ownership-checked conversation and message history |
| POST | `/api/tutor/messages` | Retrieve relevant chunks and create a grounded, cited response |
| GET/POST | `/api/exams`, `/api/exams/generate` | List or generate multi-lesson practice exams |
| GET | `/api/exams/:id` | Open an exam without answer keys |
| POST | `/api/exams/:id/attempts` | Deterministically score and persist an exam attempt |
| GET | `/api/exams/attempts/:id` | Read an ownership-checked exam result and answer review |
| GET/POST | `/api/study-plans` | List or create deterministic study plans |
| GET/DELETE | `/api/study-plans/:id` | Read a smart preparation plan or delete it |
| POST | `/api/study-plans/:id/regenerate` | Recalculate pending tasks from current progress |
| PATCH | `/api/study-plans/:id/tasks/:taskId` | Complete or reopen an ownership-checked task |

Every AI endpoint runs the same chain: authenticate → validate → assert ownership → enforce quota → retrieve chunks → invoke AI → validate with Zod when structured output is required → persist → log usage → respond. Planner ranking and scheduling do not call AI.

## AI service architecture

`AIService` is the only module allowed to call Gemini. Feature services submit a typed task containing selected chunks and generation options. The gateway applies a shared grounding preamble, protects against prompt injection in uploaded text, requests structured JSON, records token/error metadata, and maps provider failures to stable API errors.

The gateway retries transient errors and can move to a configured fallback model. Output is validated with Zod; one controlled repair attempt is allowed before returning a typed failure.

Generated data is keyed by lesson, generation type, configuration hash, and source-content version. A normal open reads the saved result. Regenerate is explicit and creates a new version. “Use original wording” assigns stable paragraph IDs, asks Gemini only for IDs, and assembles exact source paragraphs in application code.

## Flashcard scheduling

Flashcard generation produces a persisted deck and cards in one transaction. Each review is append-only and stores both the rating and next due time. Intervals are deterministic: Again = 10 minutes, Hard = 1 day, Good = 3 days, and Easy = 7 days. Library counters derive reviewed and currently due cards from review history.

## Quiz scoring and topic performance

Quiz generation persists validated questions, answer keys, explanations, and topic relationships in one transaction. The public take endpoint deliberately omits answer keys. Submission uses normalized exact matching against the saved answer and explicit acceptable identification variants; Gemini is never involved in scoring. Attempts and answers are append-only, while per-topic correct and total counts are updated transactionally. Accuracy classification is deterministic: Strong = 80–100%, Good = 60–79.99%, Needs review = 40–59.99%, and Weak = below 40%.

## Progress analytics

Quiz attempts and completed flashcard decks create timed study sessions. Analytics use weighted correct/total question counts rather than averaging percentages. Streaks operate on distinct local calendar dates using the browser timezone offset, and weekly charts are filled deterministically for all seven days. Topic classifications use centrally configured thresholds. The lowest-performing topic drives a rule-based action that links back to the lesson, flashcards, or quizzes; AI does not select priorities or calculate metrics.

## Grounded tutor and practice exams

Tutor retrieval ranks owned lesson chunks by deterministic keyword overlap and sends at most five excerpts plus the ten most recent messages to Gemini. The system instruction requires answers to stay within those excerpts, say when evidence is insufficient, and cite numbered sources. Conversations, messages, and source metadata are persisted and ownership checked.

Practice exams combine one to ten processed lessons. Gemini creates validated questions with an explicit lesson ID, but never participates in scoring. Public exam reads omit answer keys and explanations; submissions use normalized exact matching, persist append-only answers, update topic performance transactionally, and record a study session. Optional timers run in the client while the API derives the authoritative elapsed duration from the submitted start time.

## Study planner

Plans store an event or deadline, selected lesson coverage, and a generated task schedule. The rule engine ranks lessons using weighted topic accuracy, weak-topic count, and whether any performance data exists. Unstudied lessons receive the highest priority; weak and needs-review lessons receive review or flashcard work before follow-up quizzes; multi-lesson exams end with a cumulative practice exam. Task dates are distributed across the available time before the deadline. Recalculation replaces only pending tasks, preserving completed work.

## PWA and offline behavior

The production frontend registers a versioned service worker. Installation precaches the manifest, offline document, icons, root application shell, and hashed entry bundles discovered from the built HTML. Previously opened lazy route bundles are runtime-cached. Navigation uses network-first behavior with the cached shell and dedicated offline page as fallbacks; API requests are deliberately excluded from the shared service-worker cache.

Successful ownership-checked GET responses for study resources are stored for up to 30 days in IndexedDB under a key containing the authenticated user ID. Network failures may use only that user's cached response. Authentication, AI status, downloads, mutations, uploads, and generation requests are never served from the offline cache, and logout removes the user's cached API data. Supporting browsers receive an install button and update-ready prompt; iOS receives Add to Home Screen guidance.

## Development roadmap

1. **Foundation (implemented):** responsive shell, auth, MySQL, subject and lesson CRUD.
2. **Documents (implemented):** secure multipart upload, replaceable local storage adapter, PDF/DOCX/PPTX/TXT extractors, cleaning, chunking, processing states, preview, download, and deletion.
3. **Initial AI (implemented):** centralized Gemini adapter with retry/fallback, quota log, grounded topic/reviewer/summary generation, schema validation and source-version caching.
4. **Flashcards (implemented):** grounded generation, persisted decks, library and study mode, Again/Hard/Good/Easy scheduling, review history, and due counters.
5. **Quizzes (implemented):** validated grounded generation, source-version caching, private answer keys, deterministic scoring, attempts, answer review, and topic aggregation.
6. **Analytics (implemented):** configurable weak-topic thresholds, deterministic recommendations, timed study activity, streaks, subject performance, quiz trends, and live dashboard/progress charts.
7. **AI tutor (implemented):** keyword retrieval, constrained context, cited conversations, chat history limits, and daily quotas.
8. **Practice exams (implemented):** validated multi-lesson generation, timer, navigation, flags, deterministic scoring, and answer review.
9. **Study planner (implemented):** exam dates, selected lesson coverage, weak-topic-aware priorities, paced tasks, completion tracking, and recalculation.
10. **PWA (implemented):** install manifest and icons, install prompts, versioned service worker, update flow, offline shell, and user-isolated saved-resource cache.
11. **Polish:** accessibility audit, load/performance tests, exports, observability, and deployment hardening.

## Security and reliability

- bcrypt password hashing; short payload validation; JWT verification on protected routes.
- Parameterized SQL, resource ownership in every query, Helmet, explicit CORS origin, and API rate limits.
- Uploaded files are untrusted: extension + MIME signature + size checks, generated filenames, no executable serving.
- AI outputs are untrusted: Zod validation, one controlled repair attempt, then a typed failure.
- Normal calculations—scores, streaks, weak topics, and planner priorities—remain deterministic application logic.
