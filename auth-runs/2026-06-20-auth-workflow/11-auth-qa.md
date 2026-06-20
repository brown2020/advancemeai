# Auth QA

## Local QA Completed

- Static/type validation through Next production build.
- Unit coverage for session request protection, route-protection helpers, safe return URLs, and auth errors.
- Code review of auth state transitions, navbar unknown/signed-in/signed-out states, footer sign-out, profile verification UI, password visibility toggles, and user-facing auth error copy.

## QA Not Run

- Live Google sign-in, email/password sign-in, email-link delivery/completion, password reset email, and verification email delivery.
- Browser screenshot/keyboard QA for auth screens.
- Second-tab logout in a real browser.

## External Gate

- Real provider QA needs Firebase Console provider setup and local/deployed env values. Do not invent or request raw secrets in chat.
