-- Run this after backend/database/schema.sql in the Supabase SQL Editor.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('study-documents','study-documents',false,20971520,ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
