const DEFAULT_AUTH_ERROR_MESSAGE =
  "An unexpected error occurred while signing in.";

const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No user found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Invalid email format.",
  "auth/invalid-credential":
    "We couldn't verify those sign-in details. Check your email and password, or try another sign-in method.",
  "auth/too-many-requests":
    "Too many sign-in attempts. Please try again later.",
  "auth/email-already-in-use":
    "This email is already in use by another account.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in popup. Please allow popups or try again.",
  "auth/popup-closed-by-user": "Google sign-in was canceled before it finished.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/network-request-failed":
    "Unable to reach the sign-in service. Check your connection and try again.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Please contact support.",
  "auth/user-disabled": "This account has been disabled.",
};

export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthFlowError";
  }
}

function getAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = DEFAULT_AUTH_ERROR_MESSAGE
): string {
  const code = getAuthErrorCode(error);
  if (code) {
    return FIREBASE_AUTH_ERROR_MESSAGES[code] ?? fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function toAuthError(
  error: unknown,
  fallback = DEFAULT_AUTH_ERROR_MESSAGE
): Error {
  return new Error(getAuthErrorMessage(error, fallback));
}
