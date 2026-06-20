# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/advancemeai`
- Branch: `dev`
- Work mode: `full`
- Run folder: `agent-runs/2026-06-20-codebase-pass/`
- Verifiable gates: `npm run lint`, `npm run build`, `npm test`, targeted source searches, `git diff --check`, `git push --dry-run origin dev`, post-push branch sync.
- Human-decision blockers: product roadmap changes, broad architecture redesigns without a local verification path, missing external credentials that block validation, unsafe local/unrelated user changes.
- Resume policy: resume from `run-state.md`, current Git state, and the latest phase report; push validated local phase commits before new edits.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop, Quality Gate Selection Loop | Lint/build/test results recorded and failures classified | Baseline clean or all failures have reproducible ownership |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Targeted checks plus lint/build/test as appropriate | Highest-priority executable items done, deferred, or blocked |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Dependency/dead-code changes are evidence-backed and verified | Safe cleanup pushed or risky updates deferred |
| Review | Judge Loop | Diff, reports, and gates reviewed with findings first | PASS or bounded follow-up tasks created |
| Stabilization Loop | Stabilization Loop, Judge Loop, Reflect-or-Kill Loop if needed | Completion criteria pass or blocker is recorded | No P0/P1, confirmed races, introduced regressions, or unresolved high-confidence architecture fails remain |
| Integrator | Final Completion Gate | Remote read/dry-run push, clean tree, branch sync, final checks | Final report pushed or exact blocker recorded |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | 00-orchestration-plan.md, run-state.md, task-queue.md | Startup planning and resume state |
| T-002 | 01-preflight-and-repo-docs.md, AGENTS.md, spec.md, README.md | Repo docs and preflight report |
| T-003 | 02-baseline-validation.md | Baseline command evidence |
| T-004 | 03-findings-backlog.md, task-queue.md | Findings, scorecard, prioritized task queue |
| T-005 | Source files named by findings, 04-execute-fixes-and-improvements.md, task-queue.md | Focused fixes only after backlog evidence |
| T-006 | package.json, package-lock.json, dead-code targets, 05-package-and-dead-code-cleanup.md | Safe package/dead-code cleanup only |
| T-007 | 06-review.md, 07-stabilization-loop.md, 08-integrator.md, final-report.md | Review, stabilization, final state |
