# Agent Report

## Agent

Name: Codex

## Scope

Inspected source layout, route/auth boundaries, large modules, timer/async lifecycles, unused exports, tests, and dependency diagnostics to build an evidence-backed backlog.

## Inputs

Baseline report, `package.json`, `src/constants/appConstants.ts`, `src/app/flashcards/FlashcardsClient.tsx`, auth routes under `src/app/auth/`, `src/lib/route-protection.ts`, service/cache utilities, route handlers, source searches, `npm audit --json`, `npm outdated --json`, and `npm ls postcss uuid firebase-admin jest`.

## Branch and Push

- Branch: `dev`
- Upstream: `origin/dev`
- Commit: `15abf4d05a60542381c69f8bd749d1d7a78978a7` at phase start
- Pushed to: pending for this phase
- Sync status: clean and synced before report edits

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: convert credible bugs, architecture risks, package risk, and lean-code opportunities into a prioritized, locally verifiable backlog.
- Verify gate: each finding has evidence, severity, owned files, proposed fix, and verification method.
- Stop condition: backlog is prioritized and the highest-priority executable task is clear.
- Attempt: 1/1
- Result: backlog complete; highest-priority executable task is F-001

## Run State

- Current phase: Findings Backlog
- Current task: T-004
- Last pushed commit: `15abf4d05a60542381c69f8bd749d1d7a78978a7`
- Next action: commit/push findings report, then fix F-001.
- Blockers: none

## Commands Run

```text
rg -n "TODO|FIXME|HACK|console\\." src firestore.rules storage.rules package.json
rg -n "firebase-admin|verifySessionFromRequest|getServerSession|from \"@/config/firebase-admin\"|use server|middleware" src
rg -n "setInterval|setTimeout|onSnapshot|AbortController|useEffect\\(" src
rg -n "as any|: any|@ts-ignore|eslint-disable" src
rg --files src | xargs wc -l | sort -nr | head -40
find src/app/api -name route.ts -print | sort
npm audit --json
npm outdated --json
npm ls postcss uuid firebase-admin jest
rg -n "AUTH\\.(LOGIN|REGISTER|FORGOT_PASSWORD)|/auth/login|/auth/register|/auth/signin|/auth/signup" src AGENTS.md README.md spec.md
rg -n "TIMING|PAGINATION|API_ENDPOINTS|FLASHCARD_LIMITS" src
find src -name '*.test.ts' -o -name '*.test.tsx' | sort
npm run lint
git diff --check
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P2 | Bug | Open | Auth navigation | Shared auth route constants point to missing `/auth/login` and `/auth/register` pages while the actual app routes are `/auth/signin` and `/auth/signup`. | `src/constants/appConstants.ts:128`; `src/app/flashcards/FlashcardsClient.tsx:332`, `:472`, `:519`, `:789`; `find src/app/auth` lists only `signin` and `signup`. | Guest flashcard CTAs can send users to 404 pages instead of auth. | Small | Update constants and add a constants regression test; run `npm test`, lint/build. | Fix first. |
| F-002 | P3 | Lean code | Open | Constants surface | `FLASHCARD_LIMITS`, `API_ENDPOINTS`, `PAGINATION`, and `TIMING` are exported from `appConstants.ts` but have no call sites. `API_ENDPOINTS` also lists stale `/api/auth/login`-style paths. | `rg -n "TIMING|PAGINATION|API_ENDPOINTS|FLASHCARD_LIMITS" src` returns only definitions. | Stale public surface invites wrong imports and keeps obsolete route names alive. | Small | Remove unused exports after F-001; run lint/build/tests. | Cleanup after route fix. |
| F-003 | P2 | Package update | Deferred | Dependencies | `npm audit --json` reports 25 moderate transitive issues; `npm outdated --json` returns `{}`. `npm ls` shows current installed packages: Next 16.2.9, firebase-admin 14.0.0, Jest 30.4.2, postcss 8.5.15 direct. Audit suggested fixes are not safe patch/minor updates. | Audit output: Next -> nested postcss 8.4.31; firebase-admin -> @google-cloud/storage/uuid path; Jest -> js-yaml path. | Security advisory noise remains, but no compatible update is available from npm diagnostics in this run. | Medium/risky | Re-run audit when upstream releases safe versions; avoid major/downgrade audit fix in this pass. | Defer. |
| F-004 | P3 | Architecture | Deferred | Module cohesion | Largest client modules are broad: `StudyFlashcardSetClient.tsx` 801 lines, `FlashcardsClient.tsx` 798 lines, `FullTestClient.tsx` 563 lines. | `rg --files src | xargs wc -l | sort -nr | head -40`. | Harder local reasoning and future edits, but no failing behavior by itself. | Large | Split only with product/UX regression coverage or when editing those features. | Defer. |
| F-005 | P3 | Test gap | Deferred | UI workflows | Jest has 10 focused suites under `src/lib`; no E2E/browser workflow tests are configured. | `find src -name '*.test.ts'`; baseline `npm test` passed 10 suites/45 tests. | UI regressions are mostly caught by build/lint/manual checks. | Medium | Add focused tests when changing shared pure logic; defer E2E setup decision. | Defer. |
| F-006 | P3 | Race condition | Watch | Timers | Most intervals/timeouts have cleanup; `SearchBar` uses short submit/focus timeouts without cleanup. | Timer search and `src/components/search/SearchBar.tsx:53`, `:70`. | Low practical risk; state update after navigation is transient. | Small | Consider clearing timeout refs if touching search UI. | Watch/defer. |

## Changes Made

- Updated findings report, task queue, and run-state only.

## Verification

Findings are backed by source searches and baseline checks. No source code was changed in this phase.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | `firebase-admin` imports are confined to server libs, RSC pages, and route handlers; no client import evidence found. | None |
| Module cohesion | Watch | Largest client modules exceed 500-800 lines, especially flashcards and full-test flows. | Defer broad splits without workflow coverage |
| Public surface area | Fail | Unused exported constants include stale API/auth endpoint maps. | Remove unused constants after route fix |
| Data and side-effect flow | Watch | Auth/session layering matches AGENTS/proxy guidance; stale route constants create navigation drift. | Fix F-001 |
| Async/cache/resource lifecycle | Watch | Cache/dedup utilities are used; timer scan found mostly cleaned lifecycles plus minor SearchBar timeout watch item. | Defer minor timer cleanup |
| Duplication and dead code | Fail | `FLASHCARD_LIMITS`, `API_ENDPOINTS`, `PAGINATION`, and `TIMING` have no call sites. | Remove in cleanup |
| Dependency lean-ness | Watch | `npm outdated` empty; `npm audit` has moderate transitive issues without safe compatible updates. | Defer risky updates |
| Testability | Watch | 10 pure-library Jest suites pass; UI flows lack browser/E2E coverage. | Add focused tests with fixes |

## Quality Gate

- Command: `npm run lint`
- Result: passed
- Notes: Baseline lint/build/test passed before findings.

## Commit-Push Checkpoint

- Status inspected: `git status --short` showed only run-report updates.
- Diff checked: `git diff --check` passed.
- Files staged: pending
- Dry-run push:
- Push:
- Post-push sync:

## Stabilization

- Cycle: 0
- Completion criteria status: not started
- Remaining blockers: none

## Risks

Dependency audit issues remain deferred because npm diagnostics did not identify safe patch/minor updates.

## Open Questions

- None.

## Recommended Next Step

Commit/push the findings report, then execute F-001 and F-002 in separate focused batches.
