// Simple in-memory cache with TTL (Time To Live)
// Usage: setCache(key, value, ttlMs); getCache(key);

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const cache: Record<string, CacheEntry<any>> = {};

export function setCache<T>(key: string, value: T, ttlMs: number) {
  cache[key] = {
    value,
    expires: Date.now() + ttlMs,
  };
}

export function getCache<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete cache[key];
    return null;
  }
  return entry.value;
}

export function clearCache(key?: string) {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}
