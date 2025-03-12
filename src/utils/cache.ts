/**
 * Generic cache utility for storing and retrieving data with expiration
 */

// Default cache expiration time (5 minutes)
const DEFAULT_CACHE_EXPIRATION_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  expirationMs?: number;
  enableLogs?: boolean;
}

export class Cache<K extends string | number, T> {
  private cache: Record<K, CacheEntry<T>> = {} as Record<K, CacheEntry<T>>;
  private expirationMs: number;
  private enableLogs: boolean;

  constructor(options?: CacheOptions) {
    this.expirationMs = options?.expirationMs || DEFAULT_CACHE_EXPIRATION_MS;
    this.enableLogs = options?.enableLogs ?? false;
  }

  /**
   * Set a value in the cache
   */
  set(key: K, value: T): void {
    this.cache[key] = {
      data: value,
      timestamp: Date.now(),
    };
  }

  /**
   * Set multiple values in the cache at once
   */
  setMany(entries: Record<K, T>): void {
    const now = Date.now();
    Object.entries(entries).forEach(([key, value]) => {
      this.cache[key as K] = {
        data: value as T,
        timestamp: now,
      };
    });
  }

  /**
   * Get a value from the cache
   * @returns The cached value if it exists and hasn't expired, otherwise null
   */
  get(key: K): T | null {
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.expirationMs) {
      // Cache expired
      if (this.enableLogs) {
        console.log(`[Cache] Cache expired for key: ${String(key)}`);
      }
      this.remove(key);
      return null;
    }

    if (this.enableLogs) {
      console.log(`[Cache] Cache hit for key: ${String(key)}`);
    }
    return entry.data;
  }

  /**
   * Get the remaining time until a cache entry expires (in milliseconds)
   * @returns The remaining time in milliseconds, or 0 if expired or not found
   */
  getTimeToExpiration(key: K): number {
    const entry = this.cache[key];

    if (!entry) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - entry.timestamp;
    const remaining = this.expirationMs - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: K): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a key from the cache
   */
  remove(key: K): void {
    delete this.cache[key];
  }

  /**
   * Remove multiple keys from the cache
   */
  removeMany(keys: K[]): void {
    keys.forEach((key) => {
      delete this.cache[key];
    });
  }

  /**
   * Remove all keys that match a pattern function
   */
  removeWhere(predicate: (key: K) => boolean): void {
    Object.keys(this.cache).forEach((key) => {
      if (predicate(key as K)) {
        delete this.cache[key as K];
      }
    });
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache = {} as Record<K, CacheEntry<T>>;
  }

  /**
   * Get or set a value in the cache
   * If the key exists and hasn't expired, returns the cached value
   * Otherwise, calls the factory function, caches the result, and returns it
   */
  async getOrSet(key: K, factory: () => Promise<T>): Promise<T> {
    const cachedValue = this.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    if (this.enableLogs) {
      console.log(`[Cache] Cache miss for key: ${String(key)}, fetching data`);
    }
    const value = await factory();
    this.set(key, value);
    return value;
  }
}

// Export a singleton instance for global use
export const globalCache = new Cache({ enableLogs: false });
