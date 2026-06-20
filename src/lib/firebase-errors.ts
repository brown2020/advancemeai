export function getFirebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isFirestorePermissionDeniedError(error: unknown): boolean {
  if (getFirebaseErrorCode(error) === "permission-denied") {
    return true;
  }

  if (error instanceof Error) {
    return error.message
      .toLowerCase()
      .includes("missing or insufficient permissions");
  }

  return false;
}
