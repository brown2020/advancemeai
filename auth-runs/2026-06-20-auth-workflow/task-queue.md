# Task Queue

| ID | Priority | Status | Phase | Owned Files | Done-Check | Verification | Attempts | Stop Condition | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | P1 | Done | Discovery | 01-auth-inventory.md | Auth surfaces inventoried | Evidence matrix | 1/2 | Inventory complete or blocker recorded | Complete |
| AUTH-002 | P1 | Done | Provider migration | 02-auth-provider-migration.md | Existing provider replacement path documented | Migration matrix | 1/2 | Firebase path executable or setup blocker recorded | Complete |
| AUTH-003 | P1 | Done | Implementation | `src/lib/auth.tsx`, auth UI, session route, nav/footer | Firebase-native gaps hardened | Targeted tests + lint/build/test | 1/3 | Hardening complete or external Firebase setup blocker recorded | Commit and push |
