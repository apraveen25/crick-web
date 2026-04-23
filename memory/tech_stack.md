---
name: Tech stack and Next.js 16 gotchas
description: Dependencies and critical Next.js 16 API differences from training data
type: feedback
---

**Stack:** Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind v4, Zustand v5, TanStack Query v5, Axios, react-hot-toast, lucide-react.

**Critical Next.js 16 differences:**
- `middleware.ts` is DEPRECATED — use `proxy.ts` with exported `proxy()` function (not `middleware()`)
- If both `middleware.ts` and `proxy.ts` exist, build fails
- When both root `app/` and `src/app/` exist, Next.js uses root `app/`
- `refetchInterval` in useQuery accepts a function `(query) => query.state.data?.field ? ms : false` (not direct reference to query data variable)

**Why:** Next.js 16 is a breaking-change release; middleware-to-proxy rename, file precedence changed.

**How to apply:** Always check node_modules/next/dist/docs/ before writing Next.js-specific code.
