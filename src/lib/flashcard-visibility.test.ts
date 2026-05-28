import {
  canCopyFlashcardSet,
  canReadFlashcardSet,
  isSearchableVisibility,
  normalizeVisibility,
  visibilityToStorageFields,
} from "./flashcard-visibility";

describe("flashcard-visibility", () => {
  it("normalizes explicit visibility", () => {
    expect(normalizeVisibility({ visibility: "unlisted", isPublic: false })).toBe(
      "unlisted"
    );
  });

  it("maps legacy missing isPublic to public", () => {
    expect(normalizeVisibility({ userId: "u1" })).toBe("public");
  });

  it("maps isPublic shim when visibility is absent", () => {
    expect(normalizeVisibility({ isPublic: true })).toBe("public");
    expect(normalizeVisibility({ isPublic: false })).toBe("private");
  });

  it("storage fields keep isPublic aligned with visibility", () => {
    expect(visibilityToStorageFields("unlisted")).toEqual({
      visibility: "unlisted",
      isPublic: false,
    });
    expect(visibilityToStorageFields("public")).toEqual({
      visibility: "public",
      isPublic: true,
    });
  });

  it("search includes only public sets", () => {
    expect(isSearchableVisibility({ visibility: "public", isPublic: true })).toBe(
      true
    );
    expect(
      isSearchableVisibility({ visibility: "unlisted", isPublic: false })
    ).toBe(false);
  });

  it("read allows public, unlisted, and owners for private", () => {
    expect(canReadFlashcardSet({ visibility: "public" })).toBe(true);
    expect(canReadFlashcardSet({ visibility: "unlisted" })).toBe(true);
    expect(canReadFlashcardSet({ visibility: "private" }, "other")).toBe(false);
    expect(
      canReadFlashcardSet(
        { visibility: "private", userId: "owner" },
        "owner"
      )
    ).toBe(true);
  });

  it("copy allows public/unlisted for non-owners", () => {
    expect(
      canCopyFlashcardSet(
        { visibility: "unlisted", userId: "a" },
        "b"
      )
    ).toBe(true);
    expect(
      canCopyFlashcardSet(
        { visibility: "private", userId: "a" },
        "b"
      )
    ).toBe(false);
  });
});
