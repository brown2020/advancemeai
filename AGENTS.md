# AGENTS.md — AdvanceMe AI

Single source of truth for autonomous agents (Codex, Cursor, Claude Code) working in this repository.

## Project overview

**AdvanceMe AI** (branded **Advance.me** in the UI) is a Next.js study platform that combines:

- **SAT-style adaptive practice** (section practice, full tests, AI-generated questions, mistake explanations)
- **Quizlet-style flashcard workflows** (sets, folders, five study modes, public discovery, copy/share)
- **Quizzes**, **study groups/classes**, **gamification** (XP, streaks, achievements), and **AI study guides / tutor chat**

The codebase is mid-transition: SAT prep remains a first-class surface (`/practice`), while flashcards, search, groups, live games, and study guides reflect a broader general-study direction (see `spec.md` roadmap).

## Product purpose

Help students prepare for standardized tests and retain knowledge through adaptive practice, self-serve flashcard creation, spaced study modes, and lightweight classroom-style sharing—not a paid subscription product today.

## Current tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 6, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS 4, Radix UI primitives, CVA |
| State | Zustand 5 (persisted client stores) |
| Backend | Firebase Auth, Firestore, Storage |
| Server SDK | `firebase-admin` (session cookies, API routes, search) |
| AI | OpenAI (`gpt-4.1` default in `question-generation.ts`; override via `OPENAI_QUESTION_MODEL`), Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Validation | Zod 4 |
| Deploy | Vercel (`vercel.json` — 300s max duration on `src/app/**/*`) |
| Package manager | **npm** (`package-lock.json`) — do not switch to yarn/pnpm |

## Repository structure

```
advancemeai/
├── src/
│   ├── app/                 # Routes (pages + Route Handlers under app/api/)
│   ├── components/          # UI by feature (flashcards, practice, groups, …)
│   ├── services/            # Business logic + in-memory cache
│   ├── api/firebase/        # Firestore CRUD repositories
│   ├── stores/              # Zustand (gamification, flashcard study, …)
│   ├── hooks/               # Client hooks (flashcards, gamification, preferences)
│   ├── lib/                 # Auth context, server session, AI helpers
│   ├── types/               # Domain types
│   ├── constants/           # Routes, cache keys, section titles
│   ├── config/              # Firebase client/admin, env (Zod)
│   └── utils/               # cachedService, apiValidation, logger, …
├── firestore.rules          # Security rules (must stay aligned with client writes)
├── storage.rules
├── docs/ENV_EXAMPLE.md      # Env variable reference
├── agent-runs/              # Dated autonomous improvement reports and run ledgers
├── spec.md                  # Product spec + roadmap (authoritative)
├── AGENTS.md                # This file
└── README.md                # Human onboarding (install/run)
```

There is **no** `src/middleware.ts`. Routing uses `src/proxy.ts` (Next.js 16 proxy) for lightweight path rules only.

## Core architecture overview

```
Presentation (RSC pages + "use client" islands)
        ↓
Services (src/services/*) — caching, dedup, orchestration
        ↓
Repositories (src/api/firebase/*) — Firestore access
        ↓
Firebase (+ OpenAI via Route Handlers)
```

- **No Server Actions** (`"use server"` not used). Mutations go through client services (Firestore SDK) or `src/app/api/*` Route Handlers.
- **No background jobs, queues, or cron** in-repo.
- **Caching**: `createCachedService` in `src/utils/cachedService.ts` (~10 min TTL, request deduplication).

## Key features that exist today

| Area | Routes / entry | Notes |
|------|----------------|-------|
| Home / dashboard | `/` | Signed-out marketing page; signed-in `HomeDashboard` with recent sets, streak/XP, and continue-studying fallback |
| Auth | `/auth/signin`, `/auth/signup` | Google + email/password; HttpOnly `session` cookie via `POST /api/auth/session` |
| SAT practice | `/practice`, `/practice/[sectionId]`, `/practice/full-test` | Adaptive sections; AI questions API; test mode flag |
| Practice results | `/practice/results/[attemptId]` | Section attempt outcomes |
| Flashcards library | `/flashcards`, `/flashcards/create`, `/flashcards/[setId]` | CRUD, import modal, visibility/share/copy |
| Study modes | On set page | Cards, Learn, Write, Match, Test (`StudyMode` in types) |
| Quizzes | `/quizzes`, `/quizzes/new`, `/quizzes/[quizId]` | User-owned + public quizzes |
| Search | `/search` + navbar `SearchBar` | `GET /api/search` — filters public sets (not true full-text search) |
| Groups / classes | `/groups`, `/groups/create`, `/groups/join`, `/groups/[groupId]` | UI label "Groups"; `classService` gates teacher create |
| Live games | `/live`, `/live/[code]`, `/live/host` | **UI/demo flow only** — no Realtime DB sync (see `GameRoomPage` comment) |
| Study guides | `/study-guides/create` | `POST /api/ai/study-guide`; can save generated cards to a set |
| AI tutor | Set context | `POST /api/ai/chat` |
| Progress / gamification | `/progress`, `/profile` | XP/streaks in Zustand + Firestore; progress analytics aggregate practice attempts and flashcard study records |
| Public profiles | `/users/[username]` | Public profile + sets |
| Debug | `/debug`, `/practice/debug` | Dev-only via proxy |

## Important commands

```bash
npm install          # Install deps (use lockfile)
npm run dev          # Dev server http://localhost:3000
npm run build        # Production build (includes TS check via Next)
npm run start        # Run production build
npm run lint         # ESLint (typescript-eslint + @next/next)
npm test             # Jest (passWithNoTests — few/no tests today)
```

**Do not use** `npm run test:watch` in autonomous runs.

## Canonical validation / check command

Run after every focused change set (non-interactive):

```bash
npm run lint && npm run build && npm test
```

There is **no** separate `typecheck` script; `next build` is the TypeScript gate.

## Non-interactive testing rules

- Never use watch mode (`test:watch`, `next dev` as a “check”).
- Never use a headed browser or manual login for CI-style verification.
- Do not prompt for stdin; all commands must exit on their own.
- Prefer API/unit checks; E2E is not configured.
- `NEXT_PUBLIC_ALLOW_TEST_MODE=true` enables anonymous practice paths—use only in controlled local env, not production commits.

## Development conventions

- **Paths**: `@/*` → `src/*`
- **Naming**: `*Service.ts`, `*Repository.ts`, `*-store.ts`, hooks `use*`, constants `UPPER_SNAKE_CASE`
- **New API routes**: Zod validate in `src/utils/apiValidation.ts` or colocated schema; use `verifySessionFromRequest` when auth required
- **Errors**: `AppError` / `errorResponse` patterns in `src/utils/errorUtils.ts` and `apiValidation.ts`
- **Logging**: `src/utils/logger.ts` (avoid raw `console.log` in new code)
- **Minimal diffs**: one product intent per commit sequence; match surrounding style
- **Generated files**: do not edit `.next/` or hand-edit generated types unless a source change requires it
- **Autonomous run reports**: `$sb-cbi` writes dated ledgers under `agent-runs/YYYY-MM-DD-codebase-pass/`; update those reports as evidence, not as product roadmap.

## TypeScript and lint expectations

- `tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- ESLint: `eslint.config.mjs` — `@typescript-eslint/no-unused-vars` (warn), `no-console` (warn), Next core-web-vitals
- Fix new lint/type issues you introduce; do not drive repo-wide cleanup unless required for your change

## Server / client boundary guidance

- Default to **Server Components** for static structure and metadata.
- Add `"use client"` only for interactivity (auth, forms, study UI, Zustand).
- Server-only: `src/lib/server-*.ts`, `src/config/firebase-admin.ts`, Route Handlers under `src/app/api/`
- Client Firebase: `src/config/firebase.ts` — used by services from client components
- Never import `firebase-admin` into client bundles

## Route-protection guidance

**Auth is not enforced in `proxy.ts`.** Protection is layered:

1. **Server pages**: `getServerSession()` from `src/lib/server-session.ts` — redirect or gate when `user` is null
2. **Client pages**: `useAuth()` + `SignInGate` / redirects (e.g. `/progress`)
3. **API routes**: `verifySessionFromRequest(request)` in `src/lib/server-auth.ts` — return 401 when missing
4. **Firestore rules**: `firestore.rules` — client writes must match `userId` / membership rules

When adding a protected feature, update **both** API/session checks (if server API exists) **and** Firestore rules for client writes.

Open redirects: use `safeReturnTo()` for post-login redirects.

## State-management guidance

| Store | File | Purpose |
|-------|------|---------|
| Flashcard study | `flashcard-study-store.ts` | Mastery, session prefs (persisted) |
| Flashcard library | `flashcard-library-store.ts` | Library UI state |
| Gamification | `gamification-store.ts` | XP, streaks, achievements (synced to Firestore when authed) |
| Spaced repetition | `spaced-repetition-store.ts` | Bookmarked cards |

Sign-out clears persisted Zustand keys listed in `src/lib/auth.tsx`.

Prefer services for Firestore reads/writes; stores for UI session and optimistic/local state.

## Testing expectations

- Jest + jsdom configured in `package.json`; focused suites currently live under `src/lib` (`passWithNoTests: true` remains enabled)
- Add `*.test.ts` / `*.spec.ts` next to code only when behavior is non-trivial and test adds real coverage
- Do not add trivial “renders without crashing” tests unless requested

## Files and systems requiring extra caution

| Path | Why |
|------|-----|
| `firestore.rules`, `storage.rules` | Security boundary — test rule changes against all client write paths |
| `src/lib/auth.tsx` | Session cookie + sign-out + Zustand reset |
| `src/app/api/auth/session/route.ts` | HttpOnly cookie creation/deletion |
| `src/config/env.ts` | Startup validation; production degrades gracefully if misconfigured |
| `src/lib/ai/*`, `src/app/api/ai/*` | Cost, rate limits, API keys |
| `src/proxy.ts` | Runs on every matched request — keep fast, no auth |
| `package-lock.json` | Only npm — lock intentional dependency versions |

## Git workflow (main + dev)

| Branch | Role |
|--------|------|
| `main` | Stable production — **never push directly from agents** |
| `dev` | Autonomous integration branch — **all agent commits go here** |

Rules:

- Do **not** create feature branches unless a human explicitly asks.
- Do **not** open PRs unless asked.
- Before work: `git fetch origin && git checkout dev && git pull origin dev`
- If uncommitted changes exist: **stop and report**; do not overwrite.
- Commit focused changes to `dev`, push `origin/dev` when asked or per task instructions.
- Never force-push `main`.

## Definition of done

A change is done when:

1. It matches the requested product or doc scope with minimal unrelated edits
2. `npm run lint && npm run build && npm test` pass (or documented why a check is skipped)
3. Auth and Firestore rules remain consistent for new data paths
4. `spec.md` / `AGENTS.md` updated if behavior or agent workflow changed
5. Changes are committed to `dev` (and pushed when the task requires it)

## Rules for autonomous Codex runs

1. Read **AGENTS.md** and **spec.md** before coding.
2. One **PR-sized** product change per run (single feature, fix, or doc pass)—even when committing directly to `dev`.
3. Inspect real code paths; do not trust stale docs (old `SPEC.md` was a Quizlet clone spec).
4. Prefer extending existing services/repositories over new parallel patterns.
5. Do not implement roadmap items outside the current task scope.
6. Do not rotate keys, change CI, or bump deps unless the task requires it.

## Stop conditions

Stop and report (do not guess) when:

- Working tree has unrelated uncommitted changes
- `git pull` on `dev` conflicts
- Required secrets/env are missing and block validation (`OPENAI_API_KEY`, Firebase admin, etc.)
- Firestore rule change needs manual console deploy outside repo
- Task would require pushing to `main` or opening a PR but instructions forbid it
- Four failed attempts on the same verification step without new evidence

---

*Last updated: 2026-06-20 — refreshed during `$sb-cbi` repository improvement pass on `dev`.*
