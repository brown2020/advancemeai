# Navigation Account Sign-Out

## Implemented

- Navbar keeps protected links hidden while auth state is loading.
- Signed-in users see an avatar/initials account menu with profile link, verification status, and sign-out.
- Avatar resolution prefers profile `photoUrl`, then Firebase `photoURL`, then initials.
- Shared sign-out now clears server session, Firebase state, persisted Zustand stores, email-link hint, Firebase auth local storage, session storage, route cache, and other tabs.
- Footer sign-out recovery control is visible from the app shell and is safe while signed out.

## Notes

- No app-wide admin link exists, so no admin navigation was added.
- Profile upload UI is not implemented today; the account menu still honors stored `photoUrl` if present.
