export type SessionEligibility =
  | { ok: true }
  | { ok: false; error: string };

type TokenClaims = {
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
};

/**
 * Password accounts must verify email before a session cookie is issued.
 * Google and email-link sign-in are already verified by the time a token exists.
 */
export function sessionEligibilityForToken(token: TokenClaims): SessionEligibility {
  const provider = token.firebase?.sign_in_provider;
  if (provider === "password" && token.email_verified !== true) {
    return {
      ok: false,
      error: "Verify your email before continuing.",
    };
  }
  return { ok: true };
}
