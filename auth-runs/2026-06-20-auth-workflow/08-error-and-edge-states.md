# Error And Edge States

## Implemented

- Email-link send/complete errors surface in the sign-in form.
- Verification resend/refresh errors surface in sign-up and profile UI.
- Session endpoint protection failures return user-facing JSON errors.
- Added friendly messages for invalid/expired email action links and continue URL setup problems.
- Tightened account-existence auth copy for user-not-found, wrong-password, email-already-in-use, and provider-conflict Firebase errors.
- Safe return URL handling remains in `safeReturnTo()` and existing tests pass.

## Abuse Resistance

- Session mutation endpoints now reject missing app headers and cross-origin requests.
- Central auth errors now avoid direct account-existence wording for common sign-in and account-creation conflicts.
