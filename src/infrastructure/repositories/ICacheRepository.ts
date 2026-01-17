/**
 * Repository Interface: Cache Repository
 * Generic interface for caching data with TTL support
 */

export interface ICacheRepository<T> {
  /**
   * Retrieves a value from cache
   * @param key - Cache key
   * @returns The cached value or null if not found/expired
   */
  get(key: string): Promise<T | null>;
  
  /**
   * Stores a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Checks if a key exists in cache
   * @param key - Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Deletes a value from cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void>;
  
  /**
   * Clears all cache entries
   */
  clear(): Promise<void>;
  
  /**
   * Gets cache statistics
   * @returns Statistics about cache usage
   */
  getStats?(): Promise<{
    total: number;
    expired: number;
    valid: number;
    size?: string;
  }>;
  
  /**
   * Clears only expired cache entries
   * @returns Number of entries deleted
   */
  clearExpired?(): Promise<number>;
}
