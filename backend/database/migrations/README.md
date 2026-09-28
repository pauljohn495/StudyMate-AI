# PostgreSQL migrations

`backend/database/schema.sql` is the canonical baseline for a new PostgreSQL or Supabase database. Run it once in the Supabase SQL Editor before deploying the API.

The numbered phase files in this directory predate the PostgreSQL migration and document the former MySQL evolution only. Do not apply those legacy files to Supabase. Future production changes should be added here as PostgreSQL migrations starting with `008_`.
