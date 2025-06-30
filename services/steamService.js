// Steam Service: Handles all Steam API interactions and caching
const fs = require('node:fs');
const path = require('path');
const axios = require('axios');
const levenshtein = require('fast-levenshtein');

const STEAM_ID = process.env.STEAM_ID;
const STEAM_API_DELAY = 100;
const MAX_RETRIES = 25;
const BASE_DELAY = 150;
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

async function steamApiRequest(url, retryCount = 0) {
    try {
        console.log(`Making Steam API request: ${url}`);
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error making Steam API request: ${error.message}`);
        if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
            console.warn(`Rate limit exceeded. Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10) * 2000
                : Math.pow(2, retryCount) * BASE_DELAY;
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return steamApiRequest(url, retryCount + 1);
        }
        throw error;
    }
}

async function getSteamData() {
    console.log('Checking for cached Steam data...');
    const cacheKey = `steam_${STEAM_ID}`;
    const cached = getCache(cacheKey);
    if (cached) {
        console.log('Found cached Steam data for ID:', STEAM_ID);
        return cached;
    }
    try {
        console.log('Fetching Steam data for ID:', STEAM_ID);
        const wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?input_json=${
            encodeURIComponent(JSON.stringify({ steamid: STEAM_ID }))
        }`;
        const wishlistResponse = await axios.get(wishlistUrl);
        const appIds = wishlistResponse.data.response.items.map(item => item.appid);
        const steamGames = [];
        for (const appId of appIds) {
            try {
                await new Promise(resolve => setTimeout(resolve, STEAM_API_DELAY));
                const appData = await steamApiRequest(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
                const name = appData[appId]?.data?.name;
                console.log(`Fetched app ${appId}: ${name}`);
                if (name) {
                    steamGames.push({ steamName: name, appId });
                }
            } catch (error) {
                console.error(`Error fetching app details for ${appId}:`, error.message);
            }
        }
        setCache(cacheKey, steamGames);
        console.log(`Fetched Steam data for ${STEAM_ID}: ${steamGames.length} games`);
        return steamGames;
    } catch (error) {
        console.error('Error fetching Steam data:', error.message);
        return [];
    }
}

async function validateSteamGames(games) {
    const validatedGames = [];
    for (const game of games) {
        try {
            const searchResults = await steamApiRequest(
                `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(game)}`
            );
            if (searchResults.length) {
                const appId = searchResults[0].appid;
                validatedGames.push({
                    steamName: game,
                    appId: appId
                });
            }
        } catch (error) {
            // Optionally log error
        }
    }
    return validatedGames;
}

module.exports = {
    getSteamData,
    validateSteamGames
};
