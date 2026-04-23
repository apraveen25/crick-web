---
name: CrickScore project overview
description: Cricket scoring web app — structure, API base, and key design decisions
type: project
---

Cricket scoring web app (CricHeroes-inspired) with ball-by-ball live scoring.

**Why:** User's backend is ASP.NET Core Web API at https://localhost:51931/api — frontend is Next.js deployed to Azure Static Web Apps.

**Structure:**
- `app/` — Next.js App Router pages (root level, NOT src/app)
- `src/` — All other code: components, services, stores, types, utils, hooks, lib
- `tsconfig.json` paths: `@/*` → `./src/*`
- `proxy.ts` at root (Next.js 16 renamed middleware → proxy)

**Key files:**
- `app/(auth)/login` and `register` — auth pages (set `crick_token` cookie for proxy)
- `app/(main)/scoring/[id]` — live scoring console (critical feature)
- `src/services/api.ts` — Axios instance with JWT interceptor
- `src/stores/auth.store.ts` — Zustand + persist for auth state

**How to apply:** Route files go in root `app/`, shared code in `src/`.
