# Auth Validation

| Check | Command Or Manual Path | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Targeted auth tests | `npm test -- --runTestsByPath src/lib/auth-errors.test.ts src/lib/route-protection.test.ts src/lib/session-request.test.ts` | Passed | 3 suites, 22 tests | Covers session guard, route protection, password-flow errors, and enumeration-resistant auth copy |
| Password visibility toggles | Code review of `src/components/auth/AuthLayout.tsx` and auth form usage | Passed | `AuthInput` renders independent eye/eye-off buttons for password inputs used by sign-in and sign-up | Browser visual QA still external |
| Lint | `npm run lint` | Passed | ESLint completed | Canonical repo gate part 1 |
| Build | `npm run build` | Passed | Next production build and TypeScript completed | Canonical repo gate part 2 |
| Full tests | `npm test` | Passed | 13 suites, 56 tests | Canonical repo gate part 3 |
| Diff hygiene | `git diff --check` | Passed | No output | Fixed one touched Markdown trailing space |
| Firebase provider QA | Real sign-in/reset/link/verify paths | Not run | Requires configured Firebase project/providers/action URLs | External setup gate |
| Protected route matrix | Existing route-protection unit tests + build | Passed locally | Existing tests pass | Browser redirects not manually exercised |
| Hard sign-out | Code inspection + build | Partially verified | Footer/navbar call shared `signOut()`; build passed | Browser multi-tab QA not run locally |
