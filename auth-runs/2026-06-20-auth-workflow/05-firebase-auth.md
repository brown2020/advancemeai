# Firebase Auth

## Implemented

- Added Firebase email-link sign-in via `sendSignInLinkToEmail`, `isSignInWithEmailLink`, and `signInWithEmailLink`.
- Added password-user verification email send/resend through `sendEmailVerification`.
- Added account status refresh through Firebase `reload`.
- Session creation now uses fresh Firebase ID tokens after sign-in/sign-up/email-link completion.
- Central auth error mapping now covers expired/invalid action-code and continue-URL errors.

## Provider Setup Gate

- Repo code is ready for Google, Email/Password, and Email link sign-in.
- Firebase Console provider status, authorized domains, and action URL domains are external setup items and were not verified in this local run.

## Email Verification Policy

- Password accounts receive and can resend verification email.
- The app shows unverified status but does not block study routes today; no product decision exists requiring verified email before using protected study tools.
