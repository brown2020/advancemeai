# Agent Report

## Agent

Name: Codex

## Scope

Findings Backlog phase for AdvanceMe AI. Audited baseline failures, dependency diagnostics, route/auth boundaries, async/timer paths, flashcard visibility/search compatibility, stale documentation, and practice scoring logic. No application code was changed in this phase.

## Inputs

Baseline report, `npm audit --omit=dev`, `npm outdated`, source searches across `src`, `README.md`, `AGENTS.md`, `spec.md`, route-protection utilities/tests, practice section client, search API, flashcard repository, and dependency lockfile evidence.

## Branch and Push

- Branch: `dev`
- Commit: pending phase commit
- Pushed to: pending phase push

## Loop

- Name: Findings Queue Loop
- Goal: create an evidence-backed, prioritized backlog and identify the first small verifiable fix.
- Verify gate: every finding has severity, evidence, owner/area, proposed fix, and verification method.
- Stop condition: backlog is prioritized and the highest-priority executable task is clear.
- Attempt: 1/1
- Result: Backlog created; first executable task is the section practice scoring fix.

## Commands Run

```text
rg -n "TODO|FIXME|HACK|mock|Mock|demo|prototype|not implemented|console\\.log|any\\b|@ts-ignore|@ts-expect-error" src README.md spec.md AGENTS.md
rg -n "setTimeout|setInterval|clearTimeout|clearInterval|addEventListener|removeEventListener|onSnapshot|Promise\\.all|Promise\\.allSettled|runTransaction|writeBatch|batch\\(|increment\\(" src
rg -n "verifySessionFromRequest|NextResponse\\.json\\(|errorResponse|validate|safeReturnTo|getServerSession|redirect\\(" src/app src/lib src/utils
npm outdated
sed -n '1,220p' src/hooks/useFlashcards.ts
sed -n '1,220p' 'src/app/api/questions/[sectionId]/route.ts'
sed -n '1,220p' src/app/api/search/route.ts
rg -n '"next"|"firebase-admin"|"postcss"|"uuid"|"@ai-sdk/openai"|"ai"|"openai"|"lucide-react"|"@types/node"' package-lock.json
rg -n "visibility|isPublic" src/api/firebase/flashcardRepository.ts src/services/flashcardService.ts src/components/flashcards src/app/flashcards -g '*.ts' -g '*.tsx'
sed -n '1,260p' src/lib/flashcard-visibility.ts
sed -n '1,420p' src/api/firebase/flashcardRepository.ts
sed -n '1,200p' src/proxy.ts
sed -n '1,240p' 'src/app/practice/[sectionId]/PracticeSectionClient.tsx'
sed -n '240,760p' 'src/app/practice/[sectionId]/PracticeSectionClient.tsx'
sed -n '1,240p' src/lib/route-protection.ts
sed -n '1,240p' src/lib/route-protection.test.ts
npm run lint
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P2 | Bug | Open | Section practice scoring | After the first checked question, newly selected later questions are treated as already answered because `hasAnsweredBefore` checks `Object.keys(selectedAnswers).includes(currentQuestion.id)` after the current answer has been selected. | `src/app/practice/[sectionId]/PracticeSectionClient.tsx` `checkAnswer` uses selected-answer presence and `results.totalAnswered > 0` to infer prior checks. | Scores and total answered counts can be wrong for multi-question practice attempts. | Small | Add pure scoring helper tests; run `npm test`, `npm run lint`, `npm run build`. | Execute first. |
| F-002 | P2 | Package update/security | Open | Dependencies | Production audit reports 8 moderate transitive findings in `next`/`postcss` and `firebase-admin`/`uuid` paths. npm's forced fixes are unsafe downgrades. | `npm audit --omit=dev` exit 1; previous push reported GitHub Dependabot alerts on default branch. | Known dependency advisories remain; blind forced fix could break app. | Medium | Inspect upstream versions and run full quality gates for any kept updates. | Package cleanup phase. |
| F-003 | P3 | Documentation | Open | README | README still suggests `npm or yarn` and GPT-4.1-mini question generation, while repo policy is npm-only and code/default docs identify `gpt-4.1` for primary question generation. | `README.md`; `AGENTS.md`; `src/lib/ai/question-generation.ts`; `package-lock.json`. | Human onboarding confusion and package-manager drift. | Small | Docs diff only; `npm run lint`. | Fix after code bug or in stabilization if scope remains. |
| F-004 | P3 | Compatibility risk | Deferred | Public set discovery | Public-set discovery still queries `isPublic == true` before applying `visibility`, so records missing the shim cannot be discovered via search/library even though normalization treats missing `isPublic` as legacy public. | `src/app/api/search/route.ts`, `src/api/firebase/flashcardRepository.ts`, `src/lib/flashcard-visibility.ts`. | Legacy data may be under-discovered; fixing fully may require migration/index strategy. | Medium | Dedicated visibility migration/search test plan. | Defer to visibility/search milestone. |
| F-005 | P3 | Product constraint | Deferred | Practice question API | `GET /api/questions/:sectionId` is intentionally public in `route-protection.ts` even though section practice pages are protected. | `src/lib/route-protection.ts`; `src/lib/route-protection.test.ts`; `PracticeSectionClient` fetches this route from protected UI. | Direct API callers can retrieve fallback/mock questions; changing behavior is product/auth policy, not a small bug. | Medium | Product decision and route-protection/API tests. | Defer unless product wants API lock-down. |

## Changes Made

- Updated this findings report.
- Updated `task-queue.md` so F-001 becomes the next executable fix task.

## Verification

- Findings are backed by source lines, command output, or documented route-protection behavior.
- F-001 has a local pure-test path and does not require Firebase/OpenAI credentials.
- F-002 requires package cleanup discipline because npm suggested forced fixes are unsafe.

## Lint Gate

- Command: `npm run lint`
- Result: Passed
- Notes: Clean lint gate before committing/pushing this report-only phase.

## Stabilization

- Cycle: Not started.
- Completion criteria status: Findings phase only.
- Remaining blockers: None for backlog creation.

## Risks

- F-004 may require data migration or additional Firestore indexes rather than a simple query edit.
- F-005 is a product/security policy choice because the route-protection helper explicitly marks the route public.

## Open Questions

- Should direct unauthenticated access to fallback SAT questions remain public long-term, or should it be limited to explicit test mode?

## Recommended Next Step

Fix F-001 with a small tested scoring helper, then run targeted tests plus lint/build before committing and pushing the execution phase.
