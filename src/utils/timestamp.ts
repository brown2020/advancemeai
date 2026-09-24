/**
 * Convert a Firestore timestamp (client or admin SDK), a serialized
 * `{ seconds, nanoseconds }` / `{ _seconds, _nanoseconds }` shape, or a raw
 * millisecond number to epoch milliseconds. Falls back to `Date.now()` for
 * anything else.
 */
export function toMillis(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;

  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.toMillis === "function") {
      // Must call as a method to preserve `this` binding.
      return (value as { toMillis: () => number }).toMillis();
    }

    const seconds =
      typeof v.seconds === "number"
        ? v.seconds
        : typeof v._seconds === "number"
          ? v._seconds
          : null;
    const nanos =
      typeof v.nanoseconds === "number"
        ? v.nanoseconds
        : typeof v._nanoseconds === "number"
          ? v._nanoseconds
          : 0;
    if (seconds !== null) {
      return seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  return Date.now();
}
