# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Express + Vite middleware) at http://localhost:3000
npm run build    # Build frontend (vite) + bundle server (esbuild → dist/server.cjs)
npm run start    # Run production build
npm run lint     # TypeScript type check (no emit)
```

No test suite exists. Type check with `npm run lint` to validate.

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase project credentials (required for all API routes)
- `GEMINI_API_KEY` — Google Gemini AI key
- `APP_URL` — hosting URL (injected automatically in production)

## Architecture

This is a **monorepo SPA** with a unified Express + Vite dev server:

- **Dev**: `server.ts` runs Express with Vite attached as middleware (HMR included).
- **Prod (self-hosted)**: Express serves the `dist/` static build.
- **Prod (Vercel)**: `vercel.json` routes `/api/*` to `api/index.ts` (re-exports the Express app as a serverless function) and everything else to `index.html`.

### Backend (`routes/`, `lib/`, `server.ts`)

Express API mounted at `/api/`:
- `/api/auth` — register, login, avatar upload (Supabase Storage bucket `Avatars`), profile update
- `/api/posts` — cursor-paginated feed using a `posts_view` DB view, likes (`post_likes` table), comments (`post_comments` table with `profiles` join)
- `/api/courses` — read-only course list from `courses` table

`lib/supabase.ts` creates a single Supabase client with the **service role key** (admin privileges, no session persistence). All DB/auth operations go through this single client.

### Frontend (`src/`)

React 19 SPA with feature-based folder structure:

```
src/
  context/AuthContext.tsx   — global auth state (user, token) stored in localStorage
  features/
    auth/                   — Login + Register screens
    landing/                — pre-auth landing page
    muro/                   — social feed (PostFeed, PostCard, CommentSection, CreatePost)
    classroom/              — courses list + detail (CourseCard, CourseDetail)
    profile/                — user profile page with multiple sub-components
    admin/                  — admin dashboard
  shared/layout/Layout.tsx  — nav shell, view switching
  types.ts                  — shared TypeScript interfaces (Post, Course, Comment, View)
```

Navigation is controlled by a `View` union type in `App.tsx` — no router library, just a `useState<View>` switch.

**Auth flow**: `App.tsx` renders `<AuthGate>` (landing/login/register) or `<MainApp>` based on `isAuthenticated` from `AuthContext`. The JWT token is stored in `localStorage` under `edu_token` and the user object under `edu_user`.

### Profile page

Profile data (level, stats, achievements, ranking, activity) lives in `src/features/profile/data/profileMock.ts` as static mock data — it is **not yet connected to Supabase**. Only name, avatar, and bio come from the real user object via `AuthContext`.

### Data patterns

- Frontend fetches go to `/api/*` (relative URLs) — Vite proxies these in dev via the Express middleware setup.
- Posts use cursor-based pagination (cursor = `created_at` of last item).
- `posts_view` is a Supabase SQL view that joins posts with profiles — query it directly instead of joining in code.
- Supabase auth uses the **admin API** server-side (not the client SDK) so email confirmation is bypassed on register.
