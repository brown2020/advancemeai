# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/advancemeai`
- Branch: `dev`
- Work mode: Default dev-branch autopilot for `sb-cbi` / `codebase-improvement`
- Verifiable gates: Git remote read, fast-forward sync with `origin/dev`, dry-run push, `npm run lint`, `npm run build`, `npm test`, targeted searches/tests for changed behavior
- Human-decision blockers: Broad product decisions, risky major dependency upgrades, external Firebase/OpenAI credential gaps, any unrelated local user changes

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | `dev` is synced, docs reflect current repo evidence, lint or closest safe docs gate passes | Plan, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint, build, and tests pass or failures are classified with reproductions | Baseline report pushed with clean lint gate or documented pre-existing failure |
| Findings Backlog | Findings Queue Loop | Every finding has evidence, risk, effort, and verification method | Prioritized backlog pushed and first executable task is clear |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop | Targeted done-check plus lint/build/test as appropriate | Each selected task is done, deferred, or blocked with evidence |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Package/dead-code changes have proof and full validation passes | Safe cleanup pushed; risky updates deferred |
| Review | Judge Loop | No P0/P1 findings, no unrelated changes, clean quality gate | Review report pushed or findings converted to tasks |
| Stabilization | Stabilization Loop, Judge Loop | Completion criteria pass: clean tree, pushed `dev`, lint/build/test clean, no blocking findings | Final stabilization report and integrator report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-19-codebase-pass/*`, `AGENTS.md`, `spec.md` | Preflight/run planning and evidence-backed repo guidance updates |
| T-002 | `agent-runs/2026-06-19-codebase-pass/02-baseline-validation.md` | Baseline validation report only |
| T-003 | `agent-runs/2026-06-19-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Read-only code audit plus backlog updates |
| T-004+ | Files named by backlog findings | Each fix owns only the files named in its task row before editing |

## Startup Evidence

- Repository root is inside the writable workspace.
- Initial branch was `main` with a clean working tree.
- Switched to `dev`; `git pull --ff-only origin dev` reported already up to date.
- `git ls-remote --exit-code origin HEAD` and `git push --dry-run origin dev` passed.
- `git status --short --branch` showed clean `dev` tracking `origin/dev` before run artifacts were created.

## First Executable Task

T-001: complete preflight/docs report, refresh stale guidance/spec statements with current evidence, run lint as the docs-safe quality gate, commit, and push the phase.
