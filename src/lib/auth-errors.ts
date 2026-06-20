const DEFAULT_AUTH_ERROR_MESSAGE =
  "An unexpected error occurred while signing in.";

const INVALID_CREDENTIAL_MESSAGE =
  "We couldn't verify those sign-in details. Check your email and password, or try another sign-in method.";

const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": INVALID_CREDENTIAL_MESSAGE,
  "auth/wrong-password": INVALID_CREDENTIAL_MESSAGE,
  "auth/invalid-email": "Invalid email format.",
  "auth/invalid-credential": INVALID_CREDENTIAL_MESSAGE,
  "auth/too-many-requests":
    "Too many sign-in attempts. Please try again later.",
  "auth/email-already-in-use":
    "We couldn't create that account. Try signing in or use another email.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in popup. Please allow popups or try again.",
  "auth/popup-closed-by-user": "Google sign-in was canceled before it finished.",
  "auth/account-exists-with-different-credential":
    "We couldn't complete sign-in with that provider. Try another sign-in method or use a different email.",
  "auth/network-request-failed":
    "Unable to reach the sign-in service. Check your connection and try again.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Please contact support.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/invalid-action-code":
    "This sign-in or verification link is invalid. Please request a new one.",
  "auth/expired-action-code":
    "This sign-in or verification link has expired. Please request a new one.",
  "auth/missing-email": "Enter the email address connected to this link.",
  "auth/invalid-continue-uri":
    "This email action link is not configured correctly. Please contact support.",
  "auth/unauthorized-continue-uri":
    "This email action domain is not authorized. Please contact support.",
};

export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthFlowError";
  }
}

export function getAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isHandledAuthError(error: unknown): boolean {
  if (error instanceof AuthFlowError) {
    return true;
  }

  const code = getAuthErrorCode(error);
  return code ? code in FIREBASE_AUTH_ERROR_MESSAGES : false;
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
