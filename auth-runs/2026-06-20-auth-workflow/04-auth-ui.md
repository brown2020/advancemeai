# Auth UI

## Implemented

- Sign-in now supports password, Google, password reset, and email-link sign-in.
- Email-link return URLs complete automatically when the same browser has the stored email hint; otherwise the screen asks for the email and exposes a completion button.
- Sign-up now stops password users on a verification state with resend, refresh, and continue actions.
- Profile security now shows password-account verification state with resend and refresh actions.
- Navbar now uses an account/avatar menu with account link, verification status, and sign-out.
- A visible app footer sign-out recovery control is available even when already signed out.

## Accessibility And Responsive Notes

- Existing shared `AuthLayout`, `AuthAlert`, `AuthInput`, and `Button` primitives remain in use.
- New account-menu trigger has an accessible label.
- Loading states disable actions and use existing button loading affordance.

## Deferred

- Real provider-flow visual QA requires a Firebase project with Google, Email/Password, and Email link enabled.
