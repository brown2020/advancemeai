import { safeFlashcardImageUrl } from "./safe-image-url";

describe("safeFlashcardImageUrl", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("allows Firebase Storage download URLs", () => {
    const url =
      "https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/user_uploads%2Fa%2Fcard.png?alt=media&token=abc";
    expect(safeFlashcardImageUrl(url)).toBe(url);
    expect(
      safeFlashcardImageUrl("https://storage.googleapis.com/bucket/user_uploads/a/card.png")
    ).toContain("storage.googleapis.com");
  });

  it("rejects arbitrary hosts and non-https URLs", () => {
    expect(safeFlashcardImageUrl("https://evil.example/card.png")).toBeUndefined();
    expect(safeFlashcardImageUrl("http://firebasestorage.googleapis.com/card.png")).toBeUndefined();
    expect(safeFlashcardImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeFlashcardImageUrl("https://evil.com\\@firebasestorage.googleapis.com/a.png")).toBeUndefined();
  });

  it("allows the storage emulator only outside production", () => {
    process.env.NODE_ENV = "development";
    expect(safeFlashcardImageUrl("http://127.0.0.1:9199/v0/b/app/o/card.png")).toContain("127.0.0.1");

    process.env.NODE_ENV = "production";
    expect(safeFlashcardImageUrl("http://127.0.0.1:9199/v0/b/app/o/card.png")).toBeUndefined();
  });
});
