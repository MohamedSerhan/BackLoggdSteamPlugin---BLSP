// Steam Service: Handles all Steam API interactions and caching
const axios = require('axios');
const PQueue = require('p-queue').default;
const levenshtein = require('fast-levenshtein');
const { logInfo, logSuccess, logWarn, logError, logFetch } = require('./logColors');
const { getCache, setCache } = require('../utils/cacheManager');
const { getGameCache, setGameCache, getGameCacheStats } = require('../utils/gameCacheManager');
const {
    STEAM_API_DELAY_MS,
    STEAM_MAX_RETRIES,
    STEAM_BASE_DELAY_MS
} = require('../config/constants');

const STEAM_ID = process.env.STEAM_ID;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Request queue with concurrency control to prevent rate limiting
// Note: store.steampowered.com/api/appdetails doesn't support API keys
// So we need conservative rate limiting regardless
const requestQueue = new PQueue({
    concurrency: 2, // Process 2 requests simultaneously (reduced from 5)
    interval: 1000, // Time window in ms
    intervalCap: 3, // Max 3 requests per second (reduced from 10)
});

// Track progress for user feedback
let progressState = {
    total: 0,
    completed: 0,
    failed: 0
};

function resetProgress() {
    progressState = { total: 0, completed: 0, failed: 0 };
}

function updateProgress(success = true) {
    if (success) {
        progressState.completed++;
    } else {
        progressState.failed++;
    }
    
    const percentage = Math.round((progressState.completed / progressState.total) * 100);
    if (progressState.completed % 10 === 0 || progressState.completed === progressState.total) {
        logInfo(`Progress: ${progressState.completed}/${progressState.total} games (${percentage}%)`);
    }
}

async function steamApiRequest(url, retryCount = 0) {
    try {
        logFetch(`Making Steam API request: ${url}`);
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        logError(`Error making Steam API request: ${error.message}`);
        if (error.response?.status === 429 && retryCount < STEAM_MAX_RETRIES) {
            logWarn(`Rate limit exceeded. Retrying request (${retryCount + 1}/${STEAM_MAX_RETRIES})...`);
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10) * 2000
                : Math.pow(2, retryCount) * STEAM_BASE_DELAY_MS;
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return steamApiRequest(url, retryCount + 1);
        }
        throw error;
    }
}

/**
 * Fetches game details for a single app ID
 * Uses individual game cache (3 month TTL) to minimize API calls
 * @param {number} appId - Steam app ID
 * @returns {Promise<Object|null>} Game object with steamName and appId, or null if failed
 */
async function fetchGameDetails(appId) {
    // Check individual game cache first (3 month TTL)
    const cached = getGameCache(appId);
    if (cached) {
        updateProgress(true);
        return cached;
    }
    
    try {
        // Note: appdetails endpoint doesn't support API keys
        // It's rate limited regardless (~200 requests per 5 minutes)
        const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        
        const appData = await steamApiRequest(url);
        const name = appData[appId]?.data?.name;

        if (name) {
            const gameData = { steamName: name, appId };
            
            // Cache for 3 months
            setGameCache(appId, gameData);
            
            logInfo(`Fetched app ${appId}: ${name}`);
            updateProgress(true);
            return gameData;
        } else {
            logWarn(`No name found for app ${appId}`);
            updateProgress(false);
            return null;
        }
    } catch (error) {
        logError(`Error fetching app details for ${appId}: ${error.message}`);
        updateProgress(false);
        return null;
    }
}

/**
 * Fetches game details for multiple app IDs in parallel with rate limiting
 * Optimized: Cached games are loaded instantly, only non-cached games go through queue
 * @param {Array<number>} appIds - Array of Steam app IDs
 * @returns {Promise<Array<Object>>} Array of game objects
 */
async function fetchGameDetailsParallel(appIds) {
    resetProgress();
    progressState.total = appIds.length;
    
    logInfo(`Fetching details for ${appIds.length} games...`);
    
    // Separate cached from non-cached games
    const cachedGames = [];
    const uncachedAppIds = [];
    
    appIds.forEach(appId => {
        const cached = getGameCache(appId);
        if (cached) {
            cachedGames.push(cached);
            updateProgress(true);
        } else {
            uncachedAppIds.push(appId);
        }
    });
    
    if (cachedGames.length > 0) {
        logSuccess(`⚡ Loaded ${cachedGames.length} games from cache instantly!`);
    }
    
    // Only fetch non-cached games through the rate-limited queue
    if (uncachedAppIds.length > 0) {
        logInfo(`🔄 Fetching ${uncachedAppIds.length} non-cached games from Steam API...`);
        
        const tasks = uncachedAppIds.map(appId => 
            () => fetchGameDetails(appId)
        );
        
        const apiResults = await requestQueue.addAll(tasks);
        const validApiGames = apiResults.filter(game => game !== null);
        
        // Combine cached and newly fetched games
        const allGames = [...cachedGames, ...validApiGames];
        
        logSuccess(`Successfully fetched ${allGames.length}/${appIds.length} games (${cachedGames.length} cached, ${validApiGames.length} new)`);
        if (progressState.failed > 0) {
            logWarn(`Failed to fetch ${progressState.failed} games`);
        }
        
        return allGames;
    } else {
        // All games were cached!
        logSuccess(`✨ All ${cachedGames.length} games loaded from cache - No API calls needed!`);
        return cachedGames;
    }
}

/**
 * Fetches Steam wishlist data for the configured user
 * Uses caching to avoid excessive API calls
 * @returns {Promise<Array<Object>>} Array of games with steamName and appId
 * @throws {Error} If Steam ID is not configured or API call fails
 */
async function getSteamData() {
    if (!STEAM_ID) {
        const error = new Error('STEAM_ID environment variable is not set');
        logError(error.message);
        throw error;
    }

    logInfo('Checking for cached Steam data...');
    const cacheKey = `steam_${STEAM_ID}`;
    const cached = getCache(cacheKey);

    if (cached) {
        logSuccess(`Found cached Steam data for ID: ${STEAM_ID}`);
        return cached;
    }

    try {
        logFetch(`Fetching Steam data for ID: ${STEAM_ID}`);
        
        // Fetch wishlist using appropriate API
        let wishlistUrl;
        if (STEAM_API_KEY) {
            wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}`;
        } else {
            wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?input_json=${
                encodeURIComponent(JSON.stringify({ steamid: STEAM_ID }))
            }`;
        }
        
        const wishlistResponse = await axios.get(wishlistUrl);

        if (!wishlistResponse.data?.response?.items) {
            throw new Error('Invalid response format from Steam API');
        }

        const appIds = wishlistResponse.data.response.items.map(item => item.appid);
        logInfo(`Found ${appIds.length} games in Steam wishlist`);

        // Check how many games are already cached
        const cacheStats = getGameCacheStats();
        if (cacheStats.valid > 0) {
            logSuccess(`📦 Game cache: ${cacheStats.valid} games cached (3 month TTL), ${cacheStats.size}`);
            
            // Count how many of current wishlist are cached
            const cachedCount = appIds.filter(id => getGameCache(id) !== null).length;
            const apiCallsNeeded = appIds.length - cachedCount;
            
            if (cachedCount > 0) {
                logSuccess(`✨ ${cachedCount}/${appIds.length} games already cached - Only ${apiCallsNeeded} API calls needed!`);
            }
        } else {
            logInfo('📦 No games cached yet - First run will fetch all games');
        }

        if (STEAM_API_KEY) {
            logSuccess('Using Steam Web API Key for wishlist fetching.');
            logWarn('Note: Game details endpoint is still rate-limited (~200 per 5 min)');
        } else {
            logWarn('No Steam API Key detected for wishlist fetching.');
        }
        
        logInfo('Using conservative rate limiting (2 concurrent, 3/sec) to avoid 429 errors...');

        // Fetch game details in parallel with rate limiting
        const steamGames = await fetchGameDetailsParallel(appIds);

        setCache(cacheKey, steamGames);
        logSuccess(`Fetched Steam data for ${STEAM_ID}: ${steamGames.length} games`);
        return steamGames;
    } catch (error) {
        logError(`Error fetching Steam data: ${error.message}`);
        throw error;
    }
}

/**
 * Validates that games exist on Steam by searching for them
 * @param {Array<string>} games - Array of game names to validate
 * @returns {Promise<Array<Object>>} Array of validated games with appId
 */
async function validateSteamGames(games) {
    const validatedGames = [];
    logInfo(`Validating ${games.length} games on Steam...`);
    
    resetProgress();
    progressState.total = games.length;

    // Create validation tasks
    const validationTasks = games.map(game => async () => {
        try {
            const searchResults = await steamApiRequest(
                `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(game)}`
            );
            
            if (searchResults.length) {
                const appId = searchResults[0].appid;
                logInfo(`Validated: ${game} (AppID: ${appId})`);
                updateProgress(true);
                return {
                    steamName: game,
                    appId: appId
                };
            } else {
                logWarn(`No Steam results found for: ${game}`);
                updateProgress(false);
                return null;
            }
        } catch (error) {
            logError(`Failed to validate game "${game}": ${error.message}`);
            updateProgress(false);
            return null;
        }
    });

    // Process validation tasks through queue
    const results = await requestQueue.addAll(validationTasks);
    const validated = results.filter(game => game !== null);

    logSuccess(`Validated ${validated.length}/${games.length} games`);
    return validated;
}

/**
 * Gets the current queue status for monitoring
 * @returns {Object} Queue statistics
 */
function getQueueStatus() {
    return {
        size: requestQueue.size,
        pending: requestQueue.pending,
        isPaused: requestQueue.isPaused
    };
}

module.exports = {
    getSteamData,
    validateSteamGames,
    getQueueStatus
};
