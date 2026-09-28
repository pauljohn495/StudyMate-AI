# Deployment checklist

## Supabase

1. Create a project near the Render Singapore region.
2. Run `backend/database/schema.sql` in the SQL Editor.
3. Run `backend/database/supabase-storage.sql` to create the private document bucket.
4. Copy the Session Pooler connection string on port 5432 and append `?sslmode=require` if no query string is present.
5. Copy the project URL and a server-side secret key (`sb_secret_...`). Do not use either secret in the frontend.

## Render API

Create the service from `render.yaml`, then provide the prompted secret values:

- `CLIENT_URL`: final Vercel production origin, with no trailing slash
- `DATABASE_URL`: Supabase Session Pooler connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SECRET_KEY`: server-only Supabase secret key
- `GEMINI_API_KEY`: server-only Gemini key

Verify `https://YOUR-API.onrender.com/api/health`. A successful response includes `database: connected`.

## Vercel web app

Import the same repository and set the Root Directory to `frontend`. Vercel should detect Vite. Add:

```text
VITE_API_URL=https://YOUR-API.onrender.com/api
```

Deploy, copy the production origin into Render's `CLIENT_URL`, and redeploy the API. Never place `DATABASE_URL`, `SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, or `JWT_SECRET` in a `VITE_` variable.

## Smoke test

Register a new account, create a subject and lesson, upload and download each supported document type, generate one study resource, complete one quiz, open Progress, refresh a nested route, and sign out. Confirm the uploaded object appears in the private `study-documents` bucket.
