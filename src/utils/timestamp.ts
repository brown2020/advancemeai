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
 * @returns The timestamp as milliseconds, or current time if invalid
 */
export function timestampToNumber(value: unknown): number {
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
  if (typeof value === "number") {
    return value;
  }

  // Fallback to current time
  return Date.now();
}

/**
 * Alias for timestampToNumber for backward compatibility
 */
export const getTimestamp = timestampToNumber;
