/**
 * Generic cached service utility for DRY service layer caching
 * Provides deduplication, caching, and performance measurement
 */

import { Cache } from "./cache";
import { logger } from "./logger";
import { deduplicateRequest } from "./request";
import { measureAsyncPerformance } from "./performance";
import { CACHE_CONFIG } from "@/constants/appConstants";

// Allow any object type for caching
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheableData = any;

interface CachedFetchOptions<R> {
  /** Cache key for read operations. Empty string for mutation operations. */
  cacheKey: string;
  /** Function to fetch data */
  fetchData: () => Promise<R>;
  /** Keys to invalidate after successful operation */
  invalidateKeys?: string[];
  /** Log message for the operation */
  logMessage?: string;
}

/**
 * Creates a cached service with built-in caching, deduplication, and logging
 *
 * @example
 * ```ts
 * const { cachedFetch, getCache, getStats } = createCachedService<FlashcardSet | FlashcardSet[]>("flashcard");
 *
 * export async function getUserFlashcardSets(userId: string) {
 *   return cachedFetch({
 *     cacheKey: `user-sets:${userId}`,
 *     fetchData: () => fetchFromFirestore(userId),
 *     logMessage: `Fetching sets for user: ${userId}`,
 *   });
 * }
 * ```
 */
export function createCachedService<T extends CacheableData>(
  serviceName: string
) {
  // Lazy-initialized cache for SSR safety
  let cache: Cache<string, T> | null = null;

  /**
   * Get or create the cache instance
   */
  function getCache(): Cache<string, T> {
    if (!cache) {
      cache = new Cache<string, T>({
        expirationMs: CACHE_CONFIG.expirationMs,
        enableLogs: process.env.NODE_ENV === "development",
        maxSize: CACHE_CONFIG.maxSize,
      });
    }
    return cache;
  }

  /**
   * Fetch data with caching, deduplication, and optional cache invalidation
   */
  async function cachedFetch<R>(options: CachedFetchOptions<R>): Promise<R> {
    const { cacheKey, fetchData, invalidateKeys = [], logMessage } = options;
    const serviceCache = getCache();

    if (logMessage) {
      logger.info(logMessage);
    }

    // Mutation operation (no cache key) - execute and invalidate
    if (!cacheKey) {
      try {
        const result = await measureAsyncPerformance(
          fetchData,
          logMessage || `${serviceName}Operation`
        );

        // Invalidate specified cache keys
        invalidateKeys.forEach((key) => serviceCache.remove(key));

        return result;
      } catch (error) {
        logger.error(`Error in ${serviceName} operation: ${error}`);
        throw error;
      }
    }

    // Read operation with deduplication and caching
    return deduplicateRequest(cacheKey, async () => {
      const result = await serviceCache.getOrSet(
        cacheKey,
        fetchData as unknown as () => Promise<T>
      );
      return result as unknown as R;
    });
  }

  /**
   * Invalidate multiple cache keys
   */
  function invalidate(keys: string[]): void {
    const serviceCache = getCache();
    keys.forEach((key) => serviceCache.remove(key));
  }

  /**
   * Set a value directly in the cache
   */
  function set(key: string, value: T): void {
    getCache().set(key, value);
  }

  /**
   * Check if a key exists in the cache
   */
  function has(key: string): boolean {
    return getCache().has(key);
  }

  /**
   * Get cache statistics for monitoring
   */
  function getStats() {
    return getCache().getStats();
  }

  return {
    getCache,
    cachedFetch,
    invalidate,
    set,
    has,
    getStats,
  };
}
