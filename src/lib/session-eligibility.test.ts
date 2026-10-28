import { sessionEligibilityForToken } from "./session-eligibility";

describe("sessionEligibilityForToken", () => {
  it("blocks unverified password accounts", () => {
    expect(
      sessionEligibilityForToken({
        email_verified: false,
        firebase: { sign_in_provider: "password" },
      }).ok
    ).toBe(false);
  });

  it("allows verified password accounts and other providers", () => {
    expect(
      sessionEligibilityForToken({
        email_verified: true,
        firebase: { sign_in_provider: "password" },
      }).ok
    ).toBe(true);
    expect(
      sessionEligibilityForToken({
        email_verified: false,
        firebase: { sign_in_provider: "google.com" },
      }).ok
    ).toBe(true);
  });
});
