# Auth Add-Ons

## Implemented In Scope

- Session mutation request protection.
- Email-link sign-in.
- Email verification resend/refresh states.
- Cross-tab hard sign-out cleanup.
- Avatar/account menu fallback order.

## Deferred

- MFA/passkeys: deferred; no product requirement.
- Reauthentication for sensitive account changes: deferred until email/password/profile mutation UI expands.
- Custom email action handler: deferred; current flow uses Firebase email action URLs and returns to `/auth/signin`.
- Auth emulator seeded users: deferred; no existing emulator setup in repo.
- App Check/audit logging/account deletion/data export: deferred as separate product/security work.
