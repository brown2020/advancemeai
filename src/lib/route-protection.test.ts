import {
  isDevelopmentOnlyPath,
  isProtectedPage,
  isProtectedApiPath,
  isLocalTestModeEnabled,
  isAuthPage,
} from "./route-protection";

describe("route-protection", () => {
  describe("isDevelopmentOnlyPath", () => {
    it("flags debug and test routes", () => {
      expect(isDevelopmentOnlyPath("/debug")).toBe(true);
      expect(isDevelopmentOnlyPath("/practice/debug")).toBe(true);
      expect(isDevelopmentOnlyPath("/test/reading")).toBe(true);
      expect(isDevelopmentOnlyPath("/practice")).toBe(false);
    });
  });

  describe("isProtectedPage", () => {
    it("protects create and group routes", () => {
      expect(isProtectedPage("/flashcards/create", new URLSearchParams())).toBe(
        true
      );
      expect(isProtectedPage("/groups/join", new URLSearchParams())).toBe(true);
    });

    it("allows practice test mode only when explicitly enabled", () => {
      const original = process.env.NEXT_PUBLIC_ALLOW_TEST_MODE;
      process.env.NEXT_PUBLIC_ALLOW_TEST_MODE = "true";
      expect(isProtectedPage("/practice", new URLSearchParams())).toBe(true);
      expect(
        isProtectedPage("/practice", new URLSearchParams("test=true"))
      ).toBe(false);
      process.env.NEXT_PUBLIC_ALLOW_TEST_MODE = original;
    });

    it("protects section practice paths", () => {
      expect(isProtectedPage("/practice/reading", new URLSearchParams())).toBe(
        true
      );
    });
  });

  describe("isProtectedApiPath", () => {
    it("requires session for AI and legacy question POST", () => {
      expect(isProtectedApiPath("/api/ai/chat", "POST")).toBe(true);
      expect(isProtectedApiPath("/api/questions", "POST")).toBe(true);
      expect(isProtectedApiPath("/api/search", "GET")).toBe(false);
      expect(isProtectedApiPath("/api/auth/session", "POST")).toBe(false);
    });
  });

  describe("isLocalTestModeEnabled", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      delete process.env.NEXT_PUBLIC_ALLOW_TEST_MODE;
    });

    it("is false in production without allow flag", () => {
      process.env.NODE_ENV = "production";
      expect(
        isLocalTestModeEnabled(new URLSearchParams("local=true"))
      ).toBe(false);
    });

    it("is true in development when local=true", () => {
      process.env.NODE_ENV = "development";
      expect(
        isLocalTestModeEnabled(new URLSearchParams("local=true"))
      ).toBe(true);
    });
  });

  describe("isAuthPage", () => {
    it("matches sign-in and sign-up", () => {
      expect(isAuthPage("/auth/signin")).toBe(true);
      expect(isAuthPage("/auth/signup")).toBe(true);
      expect(isAuthPage("/practice")).toBe(false);
    });
  });
});
