# Error And Edge States

## Implemented

- Email-link send/complete errors surface in the sign-in form.
- Verification resend/refresh errors surface in sign-up and profile UI.
- Session endpoint protection failures return user-facing JSON errors.
- Added friendly messages for invalid/expired email action links and continue URL setup problems.
- Safe return URL handling remains in `safeReturnTo()` and existing tests pass.

## Abuse Resistance

- Session mutation endpoints now reject missing app headers and cross-origin requests.
- Existing auth copy still exposes some account-specific Firebase messages such as user-not-found/email-already-in-use; tightening enumeration copy is a future product/security decision.
