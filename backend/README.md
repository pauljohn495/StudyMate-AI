# StudyMate API

Standalone Express and TypeScript API for StudyMate AI.

## Local development

```bash
copy .env.example .env
npm install
npm run dev
```

The API runs at `http://localhost:4000` by default. PostgreSQL must be available through `DATABASE_URL`; from the repository root, `npm run db:up` starts the Docker database.

## Render

Use `backend` as the Root Directory, `npm ci --include=dev && npm run build` as the Build Command, and `npm start` as the Start Command. The repository-level `render.yaml` already contains this configuration.

Run `database/schema.sql` and `database/supabase-storage.sql` in Supabase before the first deployment. Keep every value from `.env.example` server-side.
