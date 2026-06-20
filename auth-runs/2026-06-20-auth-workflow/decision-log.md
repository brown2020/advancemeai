# Decision Log

| ID | Decision | Evidence | Alternatives | Result |
| --- | --- | --- | --- | --- |
| DEC-001 | Run the auth workflow on `dev` and proceed after preflight | User invoked `$sb-auth`; AGENTS.md requires agent work on `dev`; Git remote read, fetch/pull, and dry-run push passed | Stop before discovery if working tree or remote state was unsafe | Proceed to discovery |
| DEC-002 | Treat current provider as Firebase and harden in place | Package/config/code evidence shows Firebase Auth/Admin and no competing auth provider packages/routes/env | Migrate to Firebase from another provider | No migration needed |
| DEC-003 | Do not add admin UID gates in this batch | No `/admin` app route or server-only admin env exists; group/class admin is domain membership, not app-wide admin | Add unused `ADMIN_UID(S)` helpers now | Defer until an app-wide admin surface exists |
| DEC-004 | Add password visibility toggles in the shared auth input | Review found sign-in password, sign-up password, and confirm-password fields used `AuthInput` with `type="password"` but no eye/eye-off control | Add toggles separately in each page | Shared component fix covers every current auth password field independently |
