# Agent Report

## Agent

Name: Codex

## Scope

Repository Scout phase for AdvanceMe AI. Inspected project metadata, app structure, tests, service/repository boundaries, route handlers, and concurrency-sensitive areas. No application code changes were made.

## Inputs

AGENTS.md, spec.md, package.json, next.config.ts, tsconfig.json, eslint.config.mjs, route/test file inventory, selected auth/cache utilities, and the codebase-improvement skill references.

## Branch and Push

- Branch: dev
- Commit: pending phase commit
- Pushed to: pending phase push

## Commands Run

```text
pwd && git status --short --branch
sed -n '1,240p' /Users/stephenbrown/.agents/skills/codebase-improvement/SKILL.md
sed -n '1,260p' AGENTS.md
sed -n '1,620p' spec.md
sed -n '1,260p' /Users/stephenbrown/.agents/skills/codebase-improvement/references/github-preflight.md
sed -n '1,360p' /Users/stephenbrown/.agents/skills/codebase-improvement/references/phase-prompts.md
sed -n '1,360p' /Users/stephenbrown/.agents/skills/codebase-improvement/references/report-templates.md
sed -n '1,240p' /Users/stephenbrown/.agents/skills/codebase-improvement/scripts/start_run.py
git rev-parse --show-toplevel
git remote -v
git remote get-url origin
gh auth status
git ls-remote --exit-code origin HEAD
git fetch origin
git checkout dev
git pull --ff-only origin dev
git push --dry-run origin dev
python3 /Users/stephenbrown/.agents/skills/codebase-improvement/scripts/start_run.py --root /Users/stephenbrown/Code/OPENSOURCE/advancemeai
sed -n '1,240p' package.json
sed -n '1,220p' next.config.ts
sed -n '1,220p' tsconfig.json
sed -n '1,260p' eslint.config.mjs
rg --files -g '!node_modules' -g '!.next' | sed -n '1,260p'
find src/app/api -maxdepth 5 -type f -name 'route.ts' | sort
find src -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) | sort
rg -n "createCachedService|setTimeout|setInterval|onSnapshot|Promise\.all|Promise\.allSettled|localStorage|sessionStorage|recentSessions|increment\(|runTransaction|writeBatch|batch\(" src
rg -n "verifySessionFromRequest|getServerSession|safeReturnTo|OPENAI|firebase-admin|adminDb|errorResponse|validate|z\." src/app src/lib src/config src/utils
sed -n '1,240p' src/utils/cachedService.ts
sed -n '1,260p' src/lib/server-auth.ts
```

## Findings

- Stack: Next.js 16 App Router, React 19, TypeScript 6 strict mode with noUncheckedIndexedAccess, Tailwind CSS 4, Firebase client/admin SDKs, OpenAI/Vercel AI SDK, Zustand, Zod, Jest via ts-jest.
- Package manager: npm with package-lock.json. Available scripts are dev, build, start, lint, test, test:watch, and test:coverage.
- Canonical verification from AGENTS.md is `npm run lint && npm run build && npm test`; `next build` is the TypeScript gate.
- App entry points live in `src/app`; route handlers live under `src/app/api`; services are in `src/services`; Firebase repositories are in `src/api/firebase`; shared server utilities are in `src/lib`.
- Current tests are focused library/unit tests under `src/lib`: class progress aggregation, dashboard continuation, Firestore index definitions, flashcard visibility, progress analytics, route protection, and safe return URLs.
- Auth/session risk areas: `src/lib/server-auth.ts`, `src/lib/server-session.ts`, `src/lib/auth.tsx`, `src/app/api/auth/session/route.ts`, and protected server/client page boundaries.
- Data-write risk areas: Firebase repositories under `src/api/firebase`, practice test session route handlers, flashcard copy route, quiz route, group progress route, gamification and study progress services, and `firestore.rules`.
- Async/concurrency-sensitive areas: shared `createCachedService` cache/dedup layer, in-memory request deduplication, client save debounce in flashcard study, timers in practice/full-test/live game screens, local test-attempt storage, and server aggregation using Promise.all.
- External-service risk areas: OpenAI-backed AI routes, Firebase Admin availability fallbacks, Firebase Storage image uploads, and basic Firestore-backed search.
- Generated or external output to avoid editing: `.next/`, `node_modules/`, generated Next types, and lockfile churn unless dependency changes are intentional.
- GitHub preflight passed: origin is `https://github.com/brown2020/advancemeai.git`, GitHub CLI auth is present, remote read works, `dev` is up to date, and `git push --dry-run origin dev` succeeds.

## Changes Made

- Created the codebase-improvement run folder under `agent-runs/2026-06-13-codebase-pass/`.
- Updated this repository scout report.

## Verification

- `git status --short --branch` before phase work showed clean `dev` tracking `origin/dev`.
- GitHub preflight and fast-forward sync completed successfully.
- No app validation was run in this phase; the next phase should run lint, build, and tests.

## Risks

- Environment-sensitive checks may fail later if required Firebase/OpenAI env vars are missing for production build or API initialization.
- Test coverage is concentrated in pure utilities; many user-facing workflows rely on build/lint and manual/API verification rather than robust tests.
- Search is intentionally basic and Firestore-scan based; this is a known product limitation, not an immediate bug by itself.
- Live games are documented as prototype/demo flow only and should not be treated as production-ready realtime behavior in this pass.

## Open Questions

- None.

## Recommended Next Step

Run the Test and Repro phase with `npm run lint`, `npm run build`, and `npm test`, then document baseline failures or validation gaps.
