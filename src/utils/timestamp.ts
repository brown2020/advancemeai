import { Timestamp } from "firebase/firestore";

/**
 * Interface for Firestore timestamp-like objects
 */
interface TimestampLike {
  toMillis: () => number;
}

/**
 * Safely converts various timestamp formats to a number (milliseconds)
 * Handles Firestore Timestamps, timestamp-like objects, and raw numbers
 *
 * @param value - The timestamp value to convert
 * @returns The timestamp as milliseconds, or null if invalid
 */
export function timestampToNumber(value: unknown): number | null {
  // Handle Firestore Timestamp instances
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  // Handle objects with toMillis method (Firestore-like timestamps)
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as TimestampLike).toMillis === "function"
  ) {
    return (value as TimestampLike).toMillis();
  }

  // Handle raw numbers
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  // Invalid input
  return null;
}

/**
 * Converts a timestamp to a number, falling back to Date.now() if invalid.
 * Use this when a fallback is acceptable (e.g. display-only contexts).
 */
export function timestampToNumberOrNow(value: unknown): number {
  return timestampToNumber(value) ?? Date.now();
}
