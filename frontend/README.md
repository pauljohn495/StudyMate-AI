# StudyMate Web

Standalone React, TypeScript, and Vite frontend for StudyMate AI.

## Local development

```bash
copy .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL` to the backend API URL, including `/api`.

## Vercel

Use `frontend` as the Root Directory. Vercel can use the standard `npm run build` command and `dist` output directory; `vercel.json` supplies SPA route fallback behavior. Add `VITE_API_URL=https://YOUR-API.onrender.com/api` to the Vercel project environment.
