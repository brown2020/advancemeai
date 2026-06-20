# Auth Architecture Plan

## Route Policy

- Public: `/`, `/search`, public/unlisted flashcard set pages where Firestore/server visibility allows, public user profiles, auth assets.
- Auth-only: `/auth/signin`, `/auth/signup`; proxy redirects authenticated cookie holders through safe relative return URLs.
- Protected: practice, progress, profile, flashcard creation/editing, quizzes, groups/classes, study guides, and live host pages.
- Admin: no app-wide admin routes found in this run. Add server-only `ADMIN_UID(S)` or custom-claim checks before introducing one.

## Session Truth Model

- Firebase client auth personalizes UI and supplies fresh ID tokens.
- `POST /api/auth/session` exchanges a Firebase ID token for an HttpOnly `session` cookie.
- Server components and route handlers verify `session` with Firebase Admin. Proxy checks cookie presence only as an early route gate.
- Session mutation endpoints will require a same-origin/custom-header guard.
- Sign-out must clear server cookie, Firebase state, persisted app stores, session storage, route cache, and other tabs.

## Admin UID Source

- Not applicable to current app surface. No `/admin` route, `ADMIN_UID`, `ADMIN_UIDS`, or custom-claim admin policy exists.
- If a future admin surface is added, source admin authorization only from server-only env or verified custom claims.

## Owned Files

- `src/lib/auth.tsx`: Firebase provider flows, verification helpers, hard logout, cross-tab cleanup, auth state fields.
- `src/lib/auth-errors.ts`: add missing Firebase auth action-code/link error messages.
- `src/app/api/auth/session/route.ts`: session mutation CSRF/origin/custom-header guard.
- New `src/lib/session-request.ts` and tests: pure request guard.
- `src/app/auth/signin/SignInClient.tsx`, `src/app/auth/signup/SignUpClient.tsx`: email-link and verification UI states.
- `src/components/Navbar.tsx`: account/avatar dropdown and sign-out.
- New footer component wired from `src/app/layout.tsx`: visible hard sign-out recovery.
- Run reports under `auth-runs/2026-06-20-auth-workflow/`.

## Validation Plan

- Targeted unit tests: `npm test -- --runTestsByPath src/lib/auth-errors.test.ts src/lib/route-protection.test.ts src/lib/session-request.test.ts`
- Full gate after implementation: `npm run lint && npm run build && npm test`
- Browser/provider QA may be limited by Firebase Console credentials/provider setup; record any external setup blocker rather than inventing credentials.
