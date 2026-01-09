/**
 * Generic cache utility with LRU (Least Recently Used) strategy and expiration
 */

// Default cache expiration time (5 minutes)
const DEFAULT_CACHE_EXPIRATION_MS = 5 * 60 * 1000;
// Default max size for LRU cache
const DEFAULT_MAX_SIZE = 100;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
}

interface CacheOptions {
  expirationMs?: number;
  enableLogs?: boolean;
  maxSize?: number;
}

export class Cache<K extends string | number, T> {
  private cache: Map<K, CacheEntry<T>> = new Map();
  private expirationMs: number;
  private enableLogs: boolean;
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(options?: CacheOptions) {
    this.expirationMs = options?.expirationMs || DEFAULT_CACHE_EXPIRATION_MS;
    this.enableLogs = options?.enableLogs ?? false;
    this.maxSize = options?.maxSize || DEFAULT_MAX_SIZE;
  }

  /**
   * Internal logging method
   */
  private log(message: string): void {
    if (this.enableLogs && process.env.NODE_ENV === "development") {
      // Using console.debug for cache logs as they're very verbose
      console.debug(`[Cache] ${message}`);
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: K, value: T): void {
    // If cache is at max size, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.removeLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      data: value,
      timestamp: now,
      lastAccessed: now,
    });
  }

  /**
   * Set multiple values in the cache at once
   */
  setMany(entries: Record<K, T>): void {
    const now = Date.now();
    Object.entries(entries).forEach(([key, value]) => {
      // If cache is at max size, remove least recently used item
      if (this.cache.size >= this.maxSize && !this.cache.has(key as K)) {
        this.removeLRU();
      }

      this.cache.set(key as K, {
        data: value as T,
        timestamp: now,
        lastAccessed: now,
      });
    });
  }

  /**
   * Get a value from the cache
   * @returns The cached value if it exists and hasn't expired, otherwise null
   */
  get(key: K): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.expirationMs) {
      // Cache expired
      if (this.enableLogs) {
        this.log(`Cache expired for key: ${String(key)}`);
      }
      this.remove(key);
      this.missCount++;
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = now;
    this.cache.set(key, entry);

    this.hitCount++;
    if (this.enableLogs) {
      this.log(`Cache hit for key: ${String(key)}`);
    }
    return entry.data;
  }

  /**
   * Get the remaining time until a cache entry expires (in milliseconds)
   * @returns The remaining time in milliseconds, or 0 if expired or not found
   */
  getTimeToExpiration(key: K): number {
    const entry = this.cache.get(key);

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
    this.cache.delete(key);
  }

  /**
   * Remove multiple keys from the cache
   */
  removeMany(keys: K[]): void {
    keys.forEach((key) => {
      this.cache.delete(key);
    });
  }

  /**
   * Remove all keys that match a pattern function
   */
  removeWhere(predicate: (key: K) => boolean): void {
    for (const key of this.cache.keys()) {
      if (predicate(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Remove the least recently used item from the cache
   */
  private removeLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey: K | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      if (this.enableLogs) {
        this.log(`Removing LRU item: ${String(oldestKey)}`);
      }
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
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
      this.log(`Cache miss for key: ${String(key)}, fetching data`);
    }
    const value = await factory();
    this.set(key, value);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: hitRate,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.hitCount = 0;
    this.missCount = 0;
  }
}
