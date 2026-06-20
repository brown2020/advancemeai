import {
  getFirebaseErrorCode,
  isFirestorePermissionDeniedError,
} from "./firebase-errors";

describe("firebase-errors", () => {
  it("reads Firebase-style error codes", () => {
    expect(getFirebaseErrorCode({ code: "permission-denied" })).toBe(
      "permission-denied"
    );
    expect(getFirebaseErrorCode(new Error("No code"))).toBeNull();
  });

  it("detects Firestore permission denials by code or message", () => {
    expect(
      isFirestorePermissionDeniedError({ code: "permission-denied" })
    ).toBe(true);
    expect(
      isFirestorePermissionDeniedError(
        new Error("Missing or insufficient permissions.")
      )
    ).toBe(true);
    expect(isFirestorePermissionDeniedError({ code: "unavailable" })).toBe(
      false
    );
  });
});
