/**
 * Cache Manager - Centralized file-based caching utility
 * Provides consistent caching functionality across the application
 */

const fs = require('node:fs');
const path = require('path');
const { logCache, logWarn } = require('../services/logColors');

// Default cache configuration
const DEFAULT_CACHE_DIR = path.join(__dirname, '..', 'cache');
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Ensures the cache directory exists, creates it if not
 * @param {string} cacheDir - Path to the cache directory
 */
function ensureCacheDir(cacheDir = DEFAULT_CACHE_DIR) {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
        logCache(`Created cache directory: ${cacheDir}`);
    }
}

/**
 * Gets the full path for a cache file
 * @param {string} key - Cache key
 * @param {string} cacheDir - Path to the cache directory
 * @returns {string} Full path to the cache file
 */
function getCacheFile(key, cacheDir = DEFAULT_CACHE_DIR) {
    return path.join(cacheDir, `${key}.json`);
}

/**
 * Stores data in cache with optional TTL
 * @param {string} key - Cache key
 * @param {*} value - Data to cache (must be JSON-serializable)
 * @param {string} cacheDir - Path to the cache directory
 * @param {number} ttl - Time to live in milliseconds
 */
function setCache(key, value, cacheDir = DEFAULT_CACHE_DIR, ttl = DEFAULT_TTL) {
    ensureCacheDir(cacheDir);
    const file = getCacheFile(key, cacheDir);
    const data = {
        value,
        expires: Date.now() + ttl,
        created: Date.now()
    };

    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        logCache(`Cached data for key: ${key}`);
    } catch (error) {
        logWarn(`Failed to write cache for key "${key}": ${error.message}`);
    }
}

/**
 * Retrieves data from cache if it exists and hasn't expired
 * @param {string} key - Cache key
 * @param {string} cacheDir - Path to the cache directory
 * @param {number} maxAge - Maximum age in milliseconds (overrides stored TTL)
 * @returns {*} Cached data or null if not found/expired
 */
function getCache(key, cacheDir = DEFAULT_CACHE_DIR, maxAge = null) {
    const file = getCacheFile(key, cacheDir);

    if (!fs.existsSync(file)) {
        return null;
    }

    try {
        const fileContent = fs.readFileSync(file, 'utf8');
        const { value, expires, created } = JSON.parse(fileContent);

        // Check expiration
        const isExpired = maxAge
            ? (Date.now() - created) > maxAge
            : Date.now() > expires;

        if (isExpired) {
            logCache(`Cache expired for key: ${key}`);
            fs.unlinkSync(file);
            return null;
        }

        logCache(`Cache hit for key: ${key}`);
        return value;
    } catch (error) {
        logWarn(`Failed to read cache for key "${key}": ${error.message}`);
        // If cache file is corrupted, delete it
        try {
            fs.unlinkSync(file);
        } catch { /* ignore */ }
        return null;
    }
}

/**
 * Clears a specific cache entry
 * @param {string} key - Cache key to clear
 * @param {string} cacheDir - Path to the cache directory
 * @returns {boolean} True if cache was cleared, false otherwise
 */
function clearCache(key, cacheDir = DEFAULT_CACHE_DIR) {
    const file = getCacheFile(key, cacheDir);

    if (fs.existsSync(file)) {
        try {
            fs.unlinkSync(file);
            logCache(`Cleared cache for key: ${key}`);
            return true;
        } catch (error) {
            logWarn(`Failed to clear cache for key "${key}": ${error.message}`);
            return false;
        }
    }

    return false;
}

/**
 * Clears all cache files in the directory
 * @param {string} cacheDir - Path to the cache directory
 * @returns {number} Number of cache files cleared
 */
function clearAllCache(cacheDir = DEFAULT_CACHE_DIR) {
    if (!fs.existsSync(cacheDir)) {
        return 0;
    }

    try {
        const files = fs.readdirSync(cacheDir);
        let cleared = 0;

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(cacheDir, file);
                fs.unlinkSync(filePath);
                cleared++;
            }
        }

        logCache(`Cleared ${cleared} cache file(s)`);
        return cleared;
    } catch (error) {
        logWarn(`Failed to clear all cache: ${error.message}`);
        return 0;
    }
}

/**
 * Gets cache statistics
 * @param {string} cacheDir - Path to the cache directory
 * @returns {Object} Cache statistics
 */
function getCacheStats(cacheDir = DEFAULT_CACHE_DIR) {
    if (!fs.existsSync(cacheDir)) {
        return { total: 0, expired: 0, valid: 0 };
    }

    const files = fs.readdirSync(cacheDir);
    const stats = { total: 0, expired: 0, valid: 0 };

    for (const file of files) {
        if (file.endsWith('.json')) {
            stats.total++;
            const filePath = path.join(cacheDir, file);

            try {
                const { expires } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (Date.now() > expires) {
                    stats.expired++;
                } else {
                    stats.valid++;
                }
            } catch {
                stats.expired++;
            }
        }
    }

    return stats;
}

module.exports = {
    ensureCacheDir,
    getCacheFile,
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    getCacheStats,
    DEFAULT_CACHE_DIR,
    DEFAULT_TTL
};
