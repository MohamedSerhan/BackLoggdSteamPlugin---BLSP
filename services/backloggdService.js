// Backloggd Service: Handles all Backloggd API interactions and caching
const { logInfo, logSuccess, logWarn, logError, logFetch } = require('./logColors');
const { getCache, setCache } = require('../utils/cacheManager');
const { BACKLOGGD_MAX_RETRIES, BACKLOGGD_RETRY_DELAY_MS } = require('../config/constants');

const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;

/**
 * Helper function to retry fetch with configurable retries
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options = {}, retries = BACKLOGGD_MAX_RETRIES, delay = BACKLOGGD_RETRY_DELAY_MS) {
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

/**
 * Fetches Backloggd wishlist and backlog data for the configured user
 * Uses caching to avoid excessive API calls
 * @returns {Promise<Object>} Object with wishlist and backlog arrays
 * @throws {Error} If configuration is missing or API call fails
 */
async function getBackLoggdData() {
    if (!BACKLOGGD_USERNAME) {
        const error = new Error('BACKLOGGD_USERNAME environment variable is not set');
        logError(error.message);
        throw error;
    }

    if (!BACKLOGGD_DOMAIN) {
        const error = new Error('BACKLOGGD_DOMAIN environment variable is not set');
        logError(error.message);
        throw error;
    }

    logInfo('Checking for cached Backloggd data...');
    const cacheKey = `backloggd_${BACKLOGGD_USERNAME}`;
    const cached = getCache(cacheKey);

    if (cached) {
        logSuccess(`Found cached Backloggd data for ${BACKLOGGD_USERNAME}`);
        return cached;
    }

    const wishlistUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/wishlist`;
    const backlogUrl = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/backlog`;

    try {
        logFetch(`Fetching Backloggd data for ${BACKLOGGD_USERNAME}...`);
        const [wishlistResponse, backlogResponse] = await Promise.all([
            fetchWithRetry(wishlistUrl),
            fetchWithRetry(backlogUrl)
        ]);

        if (!wishlistResponse.ok) {
            throw new Error(`Wishlist HTTP ${wishlistResponse.status}`);
        }
        if (!backlogResponse.ok) {
            throw new Error(`Backlog HTTP ${backlogResponse.status}`);
        }

        const wishlistJson = await wishlistResponse.json();
        const backlogJson = await backlogResponse.json();

        const result = {
            wishlist: wishlistJson.content || [],
            backlog: backlogJson.content || []
        };

        logSuccess(`Fetched Backloggd data for ${BACKLOGGD_USERNAME}: ${result.wishlist.length} wishlist items, ${result.backlog.length} backlog items`);
        setCache(cacheKey, result);

        return result;
    } catch (error) {
        logError('Error fetching Backloggd data: ' + error.message);
        throw error;
    }
}

module.exports = {
    getBackLoggdData
};
