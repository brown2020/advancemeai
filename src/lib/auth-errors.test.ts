import {
  AuthFlowError,
  getAuthErrorMessage,
  toAuthError,
} from "./auth-errors";

describe("auth-errors", () => {
  it("maps known Firebase auth errors to user-facing messages", () => {
    expect(getAuthErrorMessage({ code: "auth/wrong-password" })).toBe(
      "Incorrect password. Please try again."
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

  it("preserves explicit auth flow failures", () => {
    expect(
      getAuthErrorMessage(
        new AuthFlowError("Authentication is temporarily unavailable.")
      )
    ).toBe("Authentication is temporarily unavailable.");
  });

  it("wraps non-Firebase errors without losing their message", () => {
    expect(toAuthError(new Error("Failed to establish session.")).message).toBe(
      "Failed to establish session."
    );
  });
});
