import { consumeRateLimit, resetRateLimits } from "./rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests inside the window and blocks the next one", () => {
    const now = 1_000_000;
    expect(consumeRateLimit("ip", 2, 60_000, now).ok).toBe(true);
    expect(consumeRateLimit("ip", 2, 60_000, now + 1).ok).toBe(true);
    const blocked = consumeRateLimit("ip", 2, 60_000, now + 2);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("resets after the window", () => {
    const now = 1_000_000;
    expect(consumeRateLimit("ip", 1, 1_000, now).ok).toBe(true);
    expect(consumeRateLimit("ip", 1, 1_000, now + 1_001).ok).toBe(true);
  });
});
