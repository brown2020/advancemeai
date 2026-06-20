import {
  AuthFlowError,
  getAuthErrorMessage,
  isHandledAuthError,
  toAuthError,
} from "./auth-errors";

describe("auth-errors", () => {
  it("uses enumeration-resistant sign-in copy for credential failures", () => {
    expect(getAuthErrorMessage({ code: "auth/wrong-password" })).toBe(
      "We couldn't verify those sign-in details. Check your email and password, or try another sign-in method."
    );
    expect(getAuthErrorMessage({ code: "auth/user-not-found" })).toBe(
      "We couldn't verify those sign-in details. Check your email and password, or try another sign-in method."
    );
  });

  it("uses sign-in-appropriate copy for invalid credentials", () => {
    expect(getAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
      "We couldn't verify those sign-in details. Check your email and password, or try another sign-in method."
    );
  });

  it("uses the fallback for unknown Firebase auth codes", () => {
    expect(
      getAuthErrorMessage(
        { code: "auth/new-provider-error", message: "Firebase raw details" },
        "Could not sign in."
      )
    ).toBe("Could not sign in.");
  });

  it("avoids direct account-existence copy for account creation conflicts", () => {
    expect(getAuthErrorMessage({ code: "auth/email-already-in-use" })).toBe(
      "We couldn't create that account. Try signing in or use another email."
    );
    expect(
      getAuthErrorMessage({
        code: "auth/account-exists-with-different-credential",
      })
    ).toBe(
      "We couldn't complete sign-in with that provider. Try another sign-in method or use a different email."
    );
  });

  it("maps email action link failures to recovery copy", () => {
    expect(getAuthErrorMessage({ code: "auth/expired-action-code" })).toBe(
      "This sign-in or verification link has expired. Please request a new one."
    );
    expect(getAuthErrorMessage({ code: "auth/invalid-action-code" })).toBe(
      "This sign-in or verification link is invalid. Please request a new one."
    );
  });

  it("preserves explicit auth flow failures", () => {
    expect(
      getAuthErrorMessage(
        new AuthFlowError("Authentication is temporarily unavailable.")
      )
    ).toBe("Authentication is temporarily unavailable.");
  });

  it("classifies known Firebase and auth flow errors as handled", () => {
    expect(isHandledAuthError({ code: "auth/invalid-credential" })).toBe(true);
    expect(isHandledAuthError(new AuthFlowError("Session failed."))).toBe(true);
    expect(isHandledAuthError(new Error("Unexpected failure."))).toBe(false);
  });

  it("wraps non-Firebase errors without losing their message", () => {
    expect(toAuthError(new Error("Failed to establish session.")).message).toBe(
      "Failed to establish session."
    );
  });
});
