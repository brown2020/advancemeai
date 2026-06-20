# Auth Validation

| Check | Command Or Manual Path | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Targeted auth tests | `npm test -- --runTestsByPath src/lib/auth-errors.test.ts src/lib/route-protection.test.ts src/lib/session-request.test.ts` | Passed | 3 suites, 21 tests | Covers new session guard and auth errors |
| Full lint/build/test | `npm run lint && npm run build && npm test` | Passed | 12 suites, 53 tests; Next build passed | Canonical repo gate |
| Diff hygiene | `git diff --check` | Passed | No output | Fixed one touched Markdown trailing space |
| Firebase provider QA | Real sign-in/reset/link/verify paths | Not run | Requires configured Firebase project/providers/action URLs | External setup gate |
| Protected route matrix | Existing route-protection unit tests + build | Passed locally | Existing tests pass | Browser redirects not manually exercised |
| Hard sign-out | Code inspection + build | Partially verified | Footer/navbar call shared `signOut()`; build passed | Browser multi-tab QA not run locally |
