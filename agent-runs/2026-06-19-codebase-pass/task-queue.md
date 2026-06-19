# Task Queue

| ID | Priority | Type | Status | Owned Files | Done-Check | Attempts | Stop Condition | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | P1 | Setup/Docs | Done | `agent-runs/2026-06-19-codebase-pass/*`, `AGENTS.md`, `spec.md` | Plan, queue, preflight report, AGENTS, and spec are evidence-backed; `npm run lint` passes | 1/1 | Phase report committed/pushed or blocked by lint/Git failure | Commit and push preflight/docs phase |
| T-002 | P1 | Baseline | Open | `agent-runs/2026-06-19-codebase-pass/02-baseline-validation.md` | `npm run lint`, `npm run build`, and `npm test` pass or failures are classified | 0/2 | Baseline clean or failures documented with next owner | Run baseline validation |
| T-003 | P1 | Findings | Open | `agent-runs/2026-06-19-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Findings have evidence, severity, effort, risk, and verification | 0/1 | Backlog prioritized and first fix task is clear | Audit code paths after baseline |
| T-004 | P2 | Fix | Open | TBD by T-003 | Targeted done-check plus lint/build/test pass | 0/3 | Done, deferred, or blocked with evidence | Select highest-priority verified finding |
| T-005 | P3 | Package/Dead code | Open | `package.json`, `package-lock.json`, TBD by evidence | Safe diagnostics complete; only proven changes kept; lint/build/test pass | 0/2 | Safe cleanup done or risky changes deferred | Run after fixes |
| T-006 | P1 | Review/Stabilize | Open | `agent-runs/2026-06-19-codebase-pass/06-review.md`, `07-stabilization-loop.md`, `08-integrator.md`, `final-report.md` | Judge loop passes and branch is clean/pushed/synced | 0/3 | Completion criteria pass or real blocker documented | Run after implementation phases |
