import { safeReturnTo } from "./safe-return-to";

describe("safeReturnTo", () => {
  it("allows safe internal paths", () => {
    expect(safeReturnTo("/practice", "/")).toBe("/practice");
    expect(safeReturnTo("/flashcards/abc", "/")).toBe("/flashcards/abc");
  });

  it("rejects open redirects", () => {
    expect(safeReturnTo("//evil.com", "/")).toBe("/");
    expect(safeReturnTo("https://evil.com", "/")).toBe("/");
    expect(safeReturnTo("http://evil.com/path", "/")).toBe("/");
  });

  it("uses fallback for missing or invalid values", () => {
    expect(safeReturnTo(undefined, "/flashcards")).toBe("/flashcards");
    expect(safeReturnTo(["/profile"], "/")).toBe("/profile");
  });
});
