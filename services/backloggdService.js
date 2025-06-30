// Backloggd Service: Handles all Backloggd API interactions and caching
const fs = require('node:fs');
const path = require('path');
const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const { logInfo, logSuccess, logWarn, logError, logFetch } = require('./logColors');

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
}
function getCacheFile(key) {
    return path.join(CACHE_DIR, key + '.json');
}
function setCache(key, value, ttl = CACHE_TTL) {
    ensureCacheDir();
    const file = getCacheFile(key);
    const data = { value, expires: Date.now() + ttl };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function getCache(key) {
    const file = getCacheFile(key);
    if (!fs.existsSync(file)) return null;
    try {
        const { value, expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Date.now() > expires) {
            fs.unlinkSync(file);
            return null;
        }
        return value;
    } catch {
        return null;
    }
}

// Helper function to retry fetch
async function fetchWithRetry(url, options = {}, retries = 2, delay = 1000) {
    let attempt = 0;
    while (attempt <= retries) {
        logFetch(`[fetchWithRetry] Attempt ${attempt + 1} for ${url}`);
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            logSuccess(`[fetchWithRetry] Success on attempt ${attempt + 1} for ${url}`);
            return response;
        } catch (err) {
            logError(`[fetchWithRetry] Fetch attempt ${attempt + 1} for ${url} failed: ${err.message}`);
            if (attempt === retries) {
                logError(`[fetchWithRetry] All ${retries + 1} attempts failed for ${url}`);
                throw err;
            }
            logWarn(`[fetchWithRetry] Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
        }
        attempt++;
    }
}

async function getBackLoggdData() {
    logInfo('Checking for cached Backloggd data...');
    const cacheKey = `backloggd_${BACKLOGGD_USERNAME}`;
    const cached = getCache(cacheKey);
    if (cached) {
        logSuccess(`Found cached Backloggd data for ${BACKLOGGD_USERNAME}`);
        return cached
    };
    const wishlistUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/wishlist`;
    const backlogUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/backlog`;
    try {
        logFetch(`Fetching Backloggd data for ${BACKLOGGD_USERNAME}...`);
        const [wishlistResponse, backlogResponse] = await Promise.all([
            fetchWithRetry(wishlistUrl),
            fetchWithRetry(backlogUrl)
        ]);
        if (!wishlistResponse.ok) throw new Error(`Wishlist HTTP ${wishlistResponse.status}`);
        if (!backlogResponse.ok) throw new Error(`Backlog HTTP ${backlogResponse.status}`);

        const wishlistJson = await wishlistResponse.json();
        // List out name of wishlist items
        wishlistJson.content.forEach(item => {
            logInfo(`Wishlist Item: ${item}`);
        });
        
        const backlogJson = await backlogResponse.json();
        // List out name of backlog items
        backlogJson.content.forEach(item => {
            logInfo(`Backlog Item: ${item}`);
        });

        const result = {
            wishlist: wishlistJson.content || [],
            backlog: backlogJson.content || []
        };

        setCache(cacheKey, result);
        logSuccess(`Fetched Backloggd data for ${BACKLOGGD_USERNAME}: ${result.wishlist.length} wishlist items, ${result.backlog.length} backlog items`);
        return result;
    } catch (error) {
        logError('Error fetching Backloggd data: ' + error.message);
        return { wishlist: [], backlog: [] };
    }
}

module.exports = {
    getBackLoggdData
};
