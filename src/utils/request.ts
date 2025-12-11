/**
 * Shared request utilities for deduplication and management
 */

// Central registry of in-flight promises for request deduplication
const pendingPromises: Record<string, Promise<unknown>> = {};

/**
 * Deduplicate in-flight requests to prevent redundant API calls.
 * If a request with the same key is already in progress, returns that promise
 * instead of creating a new one.
 *
 * @param key - Unique identifier for the request
 * @param factory - Function that creates the promise
 * @returns The deduplicated promise
 *
 * @example
 * ```ts
 * const data = await deduplicateRequest('user-123', () => fetchUser(123));
 * ```
 */
export async function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  // If there's already a pending request for this key, return that promise
  if (key in pendingPromises) {
    return pendingPromises[key] as Promise<T>;
  }

  // Otherwise, create a new promise and store it
  const promise = factory().finally(() => {
    // Clean up after the promise resolves or rejects
    delete pendingPromises[key];
  });

  pendingPromises[key] = promise;
  return promise;
}

/**
 * Check if a request with the given key is currently in progress
 */
export function isRequestPending(key: string): boolean {
  return key in pendingPromises;
}

/**
 * Get the number of currently pending requests
 */
export function getPendingRequestCount(): number {
  return Object.keys(pendingPromises).length;
}
