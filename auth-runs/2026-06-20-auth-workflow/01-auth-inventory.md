# Auth Inventory

## Sources Read

- `AGENTS.md`, `spec.md`, `README.md`, `docs/ENV_EXAMPLE.md`
- `package.json`, `src/config/env.ts`, `src/config/firebase.ts`, `src/config/firebase-admin.ts`
- `src/lib/auth.tsx`, `src/lib/auth-errors.ts`, `src/app/api/auth/session/route.ts`
- `src/lib/server-session.ts`, `src/lib/server-auth.ts`, `src/lib/route-protection.ts`, `src/proxy.ts`
- Auth UI: `src/app/auth/signin/SignInClient.tsx`, `src/app/auth/signup/SignUpClient.tsx`, `src/components/auth/*`
- Navigation/account: `src/components/Navbar.tsx`, `src/components/Auth.tsx`, `src/app/profile/ProfileClient.tsx`
- Protected pages and APIs under `src/app`, Firestore rules, Storage rules, auth-related tests

## Framework And Firebase

- Framework: Next.js 16 App Router (`src/app`) with `src/proxy.ts`, no `src/middleware.ts`.
- Firebase packages: `firebase` and `firebase-admin` in `package.json`.
- Firebase client: modular SDK in `src/config/firebase.ts`; exports `auth`, Firestore, Storage, and `GoogleAuthProvider`.
- Firebase Admin: optional server initialization from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `src/config/firebase-admin.ts`.
- Session cookie: `session` HttpOnly cookie created by `POST /api/auth/session` after Admin verifies a Firebase ID token.

## Current Auth Provider

| Provider | Evidence | Verdict | Replacement Needed |
| --- | --- | --- | --- |
| Firebase | `firebase`, `firebase-admin`; `src/lib/auth.tsx` uses Firebase Auth; `/api/auth/session` creates Firebase Admin session cookies | Current provider | No replacement |
| Clerk | No `@clerk/*`, `ClerkProvider`, or Clerk env evidence found by provider search | Not present | No |
| NextAuth/Auth.js | No `next-auth`, `NextAuth`, `auth()` provider, or `/api/auth/[...]` evidence found | Not present | No |
| Auth0 | No `@auth0/*`, Auth0 callback/logout routes, or `AUTH0_*` evidence found | Not present | No |
| Supabase Auth | No `@supabase/*` or `supabase.auth` evidence found | Not present | No |
| WorkOS/AuthKit | No WorkOS package or AuthKit route evidence found | Not present | No |
| Cognito/Amplify | No Amplify/Cognito package or env evidence found | Not present | No |
| Custom auth | No custom password table/JWT route found; custom logic is limited to Firebase session-cookie exchange and profile records | Firebase-adjacent app logic | No |

## Firebase Setup Gate

- Client env names are documented in `docs/ENV_EXAMPLE.md`.
- Admin env names are documented in `docs/ENV_EXAMPLE.md`, but `ADMIN_UID`/`ADMIN_UIDS` is not documented and no product admin route exists today.
- Console status cannot be proven from repo evidence: Firebase project, Google provider, Email/Password provider, Email link provider, authorized domains, and email action URLs require Firebase Console verification.
- Code support found: Google sign-in, email/password sign-in/up, password reset.
- Code support missing at discovery: email-link sign-in and email verification/resend UI.

## Route Classes

| Route | Class | Evidence | Required Guard |
| --- | --- | --- | --- |
| `/`, `/search`, public set/user pages where rules permit | Public | `src/app/page.tsx`, `src/app/search/page.tsx`, Firestore public visibility rules | Public data only |
| `/auth/signin`, `/auth/signup` | Auth-only | `src/lib/route-protection.ts` `AUTH_PAGE_PREFIXES`; `src/proxy.ts` redirects when a session cookie exists | Safe return URL |
| `/practice`, `/practice/[sectionId]`, practice result/full-test routes | Protected, with local test-mode exception for `/practice?test=true` | `src/lib/route-protection.ts`; server pages use `getServerSession`; APIs use `verifySessionFromRequest` | Proxy cookie presence plus server/API verification |
| `/flashcards/create`, `/flashcards/[setId]/edit` | Protected | `src/lib/route-protection.ts`; pages use `getServerSession`; Firestore owner rules | Proxy plus owner checks |
| `/progress`, `/profile`, `/groups/*`, `/quizzes/*`, `/study-guides/create`, `/live/host` | Protected | `src/lib/route-protection.ts`; mix of server gates and client gates; APIs/rules verify sensitive reads/writes | Proxy plus server/API/rules |
| Admin app routes | Not present | No `/admin`, `ADMIN_UID(S)`, or app-wide admin role evidence found | If added later, must use server-only UID/custom-claim checks |

## Auth State Sources

- Client source: Firebase `onAuthStateChanged` in `src/lib/auth.tsx`, plus Firestore profile loaded through `userProfileService`.
- Server source: Admin-verified `session` cookie through `getServerSession()` and `verifySessionFromRequest()`.
- Proxy source: session cookie presence only, documented in `src/proxy.ts`.
- Profile/avatar source: user profile `photoUrl` exists in types/repository; Google `photoURL` is captured during sign-in/up; profile UI currently renders initials only.

## Auth State Model And Drift Risks

| State Or Drift Case | Evidence | Expected Behavior | Verification |
| --- | --- | --- | --- |
| Unknown/bootstrap | `AuthProvider` starts `isLoading=true`; navbar shows skeletons | Hide protected/admin links | Existing navbar skeleton; add QA |
| Signed out | Firebase listener sets `user=null`; server cookie absent redirects/gates | Public UI only, sign-in available | Existing route-protection tests |
| Signed in unverified | No `emailVerified` modeling at discovery | Show verification state; do not silently treat as fully verified | Needs implementation |
| Signed in verified | Firebase user plus server session cookie | Protected pages/APIs allowed after server verification | Existing page/API checks |
| Admin | No app-wide admin surface or server-only UID env | No admin links/routes exposed | Document as not present |
| Stale/invalid session | `verifySessionCookie(..., true)` returns null on failures; client logs sync failure | Conservative signed-out UI and session refresh/sign-out | Needs stronger cleanup reporting/QA |
| Signing out | `signOut()` clears React state, session cookie, Firebase state, selected persisted Zustand stores, and sessionStorage | Also refresh route cache and notify other tabs | Needs implementation |
| Client/server mismatch | Client syncs ID token to session on auth change; server may be unavailable locally | Protected server data remains behind session verification; local degraded mode uses client gates | Existing mixed strategy; record QA |
| Cross-tab logout | No `BroadcastChannel`/storage event found | Other tabs clear protected UI after sign-out | Needs implementation |

## Navbar Account Avatar Footer

- Navbar hides protected links while auth is loading and shows protected links after `user` exists.
- Navbar currently uses a single `Auth` button, not an account/avatar dropdown with account link and sign-out.
- Profile page has a sign-out button and initials avatar; it does not render profile `photoUrl` or Firebase `photoURL`.
- No app/home footer component or visible footer hard sign-out was found.

## Gaps And Risks

- Email-link sign-in is missing from code.
- Email verification send/resend/refresh UI is missing for password users.
- Session POST/DELETE endpoints have no explicit CSRF/origin/custom-header guard.
- Logout cleanup is good but incomplete: no cross-tab notification and no route refresh inside the shared auth action.
- Navbar account/avatar behavior does not meet the workflow benchmark.
- Firebase Console provider status and action URL/domain setup cannot be verified from repo evidence.
- `ADMIN_UID(S)` is not documented, but there is no app-wide admin route today.

## Baseline Commands

- Preflight: `git ls-remote --heads origin dev`, `git fetch origin`, `git pull --ff-only origin dev`, `git push --dry-run origin dev`.
- Required final validation: `npm run lint && npm run build && npm test`.
