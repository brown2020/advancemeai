# Auth Provider Migration

## Provider Verdict

- Verdict: Firebase
- Evidence: `firebase` and `firebase-admin` dependencies; Firebase client/admin config; `src/lib/auth.tsx`; `/api/auth/session`; server session helpers.
- Replacement needed: No competing auth provider was found.

## Old Auth Surfaces

| Surface | Evidence | Firebase Replacement | Remove/Keep/Defer | Notes |
| --- | --- | --- | --- | --- |
| Packages | No Clerk/NextAuth/Auth0/Supabase/WorkOS/Cognito packages found | Firebase packages already installed | Keep Firebase | No old package removal |
| Routes/callbacks | Only `/api/auth/session` found for auth session exchange | Add Firebase-native email-link/verification as needed | Keep | No old callback routes |
| Middleware/proxy | `src/proxy.ts`; no `src/middleware.ts` | Continue using proxy plus server checks | Keep | Matches Next.js 16 repo guidance |
| Cookies/storage | `session` cookie; Firebase client persistence; app Zustand keys | Harden cleanup and cross-tab sign-out | Keep/harden | No old-provider remnants found |
| Env vars | Firebase public/admin env documented; no old provider env names found | Add admin UID docs only if an admin route is added | Keep/harden docs if needed | No secret values |
| UI components | App-native auth pages and `AuthProvider` | Extend Firebase-native flows | Keep/harden | No third-party auth components |
| Tests/mocks | Pure tests for auth errors, safe return URLs, route protection | Add focused auth helper tests | Keep/add | No old-provider mocks |

## Firebase Setup Checklist

| Item | Status | Evidence Or User Action |
| --- | --- | --- |
| Firebase project selected/created | Unknown from repo | Confirm in Firebase Console |
| Web app registered | Env names documented | `NEXT_PUBLIC_FIREBASE_*` in `docs/ENV_EXAMPLE.md` |
| Client env names documented | Present | `docs/ENV_EXAMPLE.md` |
| Authentication enabled | Unknown from repo | Confirm in Firebase Console |
| Google provider enabled | Unknown from repo | Existing Google code requires provider enabled |
| Email/password enabled | Unknown from repo | Existing password code requires provider enabled |
| Email link enabled if needed | Unknown from repo | New email-link code will require provider enabled |
| Authorized domains set | Unknown from repo | Confirm local and production domains in Firebase Console |
| Email action URLs set | Unknown from repo | Confirm verify/reset/email-link continue URL domains |
| Admin SDK server env ready | Env names documented | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| ADMIN_UID/ADMIN_UIDS server env ready | Not applicable today | No app-wide admin route found; document before adding admin surface |

## Migration Plan

- No provider migration is needed.
- Harden the existing Firebase implementation:
  - Add email-link sign-in and email verification/resend support.
  - Add session mutation request protection.
  - Strengthen sign-out cleanup and cross-tab drift prevention.
  - Replace the navbar's single auth button with account/avatar menu behavior.
  - Add visible footer sign-out recovery control.

## User Setup Handoff

- If real-provider QA is requested locally or in deployment, confirm in Firebase Console that Google, Email/Password, and Email link sign-in are enabled and that authorized domains/action URLs include local and production domains.
- Do not paste Firebase Admin private keys or admin UIDs into chat; configure them locally or in hosting secrets.

## Result

- Firebase is already the sole auth provider. Proceeding with Firebase-native hardening.
