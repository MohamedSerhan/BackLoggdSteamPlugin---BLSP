/**
 * Game Cache Manager
 * Handles individual game caching with long TTL (3 months)
 * Game names rarely change, so we can cache them for a long time
 */

const fs = require('fs');
const path = require('path');
const { logInfo, logCache } = require('../services/logColors');

// Cache configuration
const GAME_CACHE_DIR = path.join(__dirname, '../cache/games');
const GAME_CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days (3 months) in milliseconds

/**
 * Ensures the game cache directory exists
 */
function ensureGameCacheDir() {
    if (!fs.existsSync(GAME_CACHE_DIR)) {
        fs.mkdirSync(GAME_CACHE_DIR, { recursive: true });
        logInfo('Created game cache directory');
    }
}

/**
 * Gets the cache file path for a game
 * @param {number} appId - Steam app ID
 * @returns {string} Full path to cache file
 */
function getGameCachePath(appId) {
    return path.join(GAME_CACHE_DIR, `${appId}.json`);
}

/**
 * Retrieves a game from cache if it exists and is not expired
 * @param {number} appId - Steam app ID
 * @returns {Object|null} Cached game data or null if not found/expired
 */
function getGameCache(appId) {
    const cachePath = getGameCachePath(appId);
    
    try {
        if (!fs.existsSync(cachePath)) {
            return null;
        }

        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        const now = Date.now();

        // Check if cache has expired (3 months old)
        if (now - cacheData.timestamp > GAME_CACHE_TTL) {
            logCache(`Cache expired for game ${appId}`);
            return null;
        }

        logCache(`Cache hit for game ${appId}: ${cacheData.data.steamName}`);
        return cacheData.data;
    } catch (error) {
        // If there's any error reading cache, treat as cache miss
        return null;
    }
}

/**
 * Stores a game in cache
 * @param {number} appId - Steam app ID
 * @param {Object} gameData - Game data to cache (must have steamName and appId)
 */
function setGameCache(appId, gameData) {
    ensureGameCacheDir();
    
    const cachePath = getGameCachePath(appId);
    const cacheData = {
        timestamp: Date.now(),
        data: gameData
    };

    try {
        fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
        logCache(`Cached game ${appId}: ${gameData.steamName}`);
    } catch (error) {
        // Silent fail - caching is not critical
        console.error(`Failed to cache game ${appId}:`, error.message);
    }
}

/**
 * Clears all game caches
 * @returns {number} Number of cache files deleted
 */
function clearGameCache() {
    if (!fs.existsSync(GAME_CACHE_DIR)) {
        return 0;
    }

    const files = fs.readdirSync(GAME_CACHE_DIR);
    let deletedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(GAME_CACHE_DIR, file));
            deletedCount++;
        }
    });

    logInfo(`Cleared ${deletedCount} game cache files`);
    return deletedCount;
}

/**
 * Gets statistics about the game cache
 * @returns {Object} Cache statistics
 */
function getGameCacheStats() {
    if (!fs.existsSync(GAME_CACHE_DIR)) {
        return {
            total: 0,
            expired: 0,
            valid: 0,
            size: 0
        };
    }

    const files = fs.readdirSync(GAME_CACHE_DIR);
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    let totalSize = 0;

    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(GAME_CACHE_DIR, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;

            try {
                const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (now - cacheData.timestamp > GAME_CACHE_TTL) {
                    expired++;
                } else {
                    valid++;
                }
            } catch (error) {
                expired++;
            }
        }
    });

    return {
        total: expired + valid,
        expired,
        valid,
        size: `${(totalSize / 1024).toFixed(2)} KB`
    };
}

/**
 * Clears only expired game caches
 * @returns {number} Number of expired caches deleted
 */
function clearExpiredGameCache() {
    if (!fs.existsSync(GAME_CACHE_DIR)) {
        return 0;
    }

    const files = fs.readdirSync(GAME_CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(GAME_CACHE_DIR, file);
            
            try {
                const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (now - cacheData.timestamp > GAME_CACHE_TTL) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch (error) {
                // If we can't read it, delete it
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
    });

    if (deletedCount > 0) {
        logInfo(`Cleared ${deletedCount} expired game cache files`);
    }
    return deletedCount;
}

module.exports = {
    getGameCache,
    setGameCache,
    clearGameCache,
    getGameCacheStats,
    clearExpiredGameCache,
    GAME_CACHE_TTL
};
