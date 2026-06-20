# Auth Review

## Findings

- P0/P1 auth provider migration issues: none. Firebase is the only provider found.
- P0/P1 server truth issues after changes: none found in local review. Protected server/API paths still verify Admin sessions; session mutation endpoints are harder to call cross-site.
- P1 auth UI issue found on resumed review: password fields lacked required eye/eye-off visibility toggles. Fixed in shared `AuthInput`.
- P2 auth error-copy issue found on second resumed review: account existence was directly exposed by some Firebase error messages. Fixed in the central mapper.
- Remaining risk: real Firebase Console provider setup is unverified.
- Remaining risk: browser/provider QA is not complete without live Firebase credentials/providers.

## Definition Of Done Check

- Local code hardening and validation pass, including password-toggle coverage and enumeration-resistant auth error copy.
- Full workflow definition of done is partially blocked by external provider QA and real browser sign-in verification.
