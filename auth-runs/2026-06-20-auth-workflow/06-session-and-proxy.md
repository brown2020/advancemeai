# Session And Proxy

## Session Truth

- Firebase client auth remains the UI state source.
- Server pages and APIs continue to use Admin-verified `session` cookies through `getServerSession()` and `verifySessionFromRequest()`.
- Proxy remains an early cookie-presence gate only, matching existing repo guidance.

## Changes

- Added `src/lib/session-request.ts` for session mutation protection.
- `POST /api/auth/session` and `DELETE /api/auth/session` now require the app session header and same-origin origin/referer checks.
- Client session create/delete calls now send the app session mutation header.

## Validation

- `src/lib/session-request.test.ts` covers header requirement, same-origin accept, cross-origin reject, and production missing-origin reject.
- Existing route-protection tests still pass.
