// Backloggd Service: Handles all Backloggd API interactions and caching
const fs = require('node:fs');
const path = require('path');
const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_DIR = path.join(__dirname, '..', 'cache');

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

async function getBackLoggdData() {
    const cacheKey = `backloggd_${BACKLOGGD_USERNAME}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    const wishlistUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/wishlist`;
    const backlogUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/backlog`;
    try {
        const [wishlistResponse, backlogResponse] = await Promise.all([
            fetch(wishlistUrl),
            fetch(backlogUrl)
        ]);
        if (!wishlistResponse.ok) throw new Error(`Wishlist HTTP ${wishlistResponse.status}`);
        if (!backlogResponse.ok) throw new Error(`Backlog HTTP ${backlogResponse.status}`);
        const wishlistJson = await wishlistResponse.json();
        const backlogJson = await backlogResponse.json();
        const result = {
            wishlist: wishlistJson.content || [],
            backlog: backlogJson.content || []
        };
        setCache(cacheKey, result);
        return result;
    } catch (error) {
        // Optionally log error
        return { wishlist: [], backlog: [] };
    }
}

module.exports = {
    getBackLoggdData
};
