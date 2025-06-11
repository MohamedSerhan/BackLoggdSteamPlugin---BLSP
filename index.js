require('dotenv').config();
const fs = require('node:fs');
const axios = require('axios');
const levenshtein = require('fast-levenshtein');
const { generateHTMLReport } = require('./reportPage');

// Configuration from environment variables
const STEAM_ID = process.env.STEAM_ID;
const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;

// Constants for Steam API rate limiting and retries
const STEAM_API_DELAY = 100;
const MAX_RETRIES = 25;
const BASE_DELAY = 150;

console.log('Starting BackLoggdSteamPlugin - BLSP...');

function normalizeGameName(name) {
    return name
        .toLowerCase()
        .normalize("NFC")
        .replace(/^number\b/, '#')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\band\b/g, '&')
        .replace(/\bvi\b/g, '6')
        .replace(/\bonline\b/g, '')
        .replace(/\bedition\b/g, '')
        .replace(/\bremastered\b/g, '')
        .replace(/\bdefinitive\b/g, '')
        .replace(/\bgame of the year\b/g, '')
        .trim();
}

function areNamesSimilar(name1, name2) {
    const normalized1 = normalizeGameName(name1);
    const normalized2 = normalizeGameName(name2);
    const distance = levenshtein.get(normalized1, normalized2);
    const threshold = Math.max(normalized1.length, normalized2.length) * 0.2;
    return distance <= threshold;
}

async function steamApiRequest(url, retryCount = 0) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
            const retryAfter = error.response.headers['retry-after']
                ? parseInt(error.response.headers['retry-after'], 10) * 2000
                : Math.pow(2, retryCount) * BASE_DELAY;

            console.log(`🔄 Rate limit hit. Retrying in ${retryAfter / 1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return steamApiRequest(url, retryCount + 1);
        }
        throw error;
    }
}

async function getBackLoggdData() {
    console.log('Getting wishlist and backlog data from BackLoggd...');
    
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
        console.log('Found wishlist and backlog data from BackLoggd!');
        
        return {
            wishlist: wishlistJson.content || [],
            backlog: backlogJson.content || []
        };
    } catch (error) {
        console.error('Backloggd Error:', error.message);
        return { wishlist: [], backlog: [] };
    }
}

async function getSteamData() {
    const wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?input_json=${
        encodeURIComponent(JSON.stringify({ steamid: STEAM_ID }))
    }`;

    try {
        const wishlistResponse = await axios.get(wishlistUrl);
        const appIds = wishlistResponse.data.response.items.map(item => item.appid);

        const steamGames = [];
        
        for (const appId of appIds) {
            try {
                await new Promise(resolve => setTimeout(resolve, STEAM_API_DELAY));
                
                const appData = await steamApiRequest(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
                const name = appData[appId]?.data?.name;

                if (name) {
                    console.log("✅ Found Game on Steam:", name);
                    steamGames.push({ steamName: name, appId });
                }
            } catch (error) {
                console.error(`❌ Failed to fetch app ${appId}:`, error.message);
            }
        }

        return steamGames;
    } catch (error) {
        console.error('Steam Error:', error.message);
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
            console.error(`Validation error for ${game}:`, error.message);
        }
    }
    return validatedGames;
}

async function compareWishlists() {
    const [steamWishlist, backLoggdData] = await Promise.all([
        getSteamData(),
        getBackLoggdData()
    ]);

    const normalizedBackloggdCombined = [
        ...backLoggdData.wishlist,
        ...backLoggdData.backlog
    ].map(normalizeGameName);

    const comparison = { both: [], steamOnly: [], backLoggdOnly: [] };

    // Compare Steam games against Backloggd
    steamWishlist.forEach(steamGame => {
        const matched = normalizedBackloggdCombined.some(backloggdGame => 
            areNamesSimilar(steamGame.steamName, backloggdGame)
        );
        
        matched ? comparison.both.push(steamGame) : comparison.steamOnly.push(steamGame.steamName);
    });

    // Compare Backloggd wishlist against Steam
    backLoggdData.wishlist.forEach(backloggdGame => {
        const normalized = normalizeGameName(backloggdGame);
        const exists = steamWishlist.some(steamGame => 
            areNamesSimilar(normalized, normalizeGameName(steamGame.steamName))
        );
        
        if (!exists) comparison.backLoggdOnly.push(backloggdGame);
    });

    comparison.backLoggdOnly = await validateSteamGames(comparison.backLoggdOnly);

    return removeDupesFromWishlist(comparison);
}

function removeDupesFromWishlist(wishlistComparison) {
    let { both, steamOnly, backLoggdOnly } = wishlistComparison;
    
    return {
        'Add to BackLoggd Wishlist': [...new Set(steamOnly)],
        'Add to Steam Wishlist': [...new Set(backLoggdOnly)],
        'Already on Both': [...new Set(both.map(game => 
            typeof game === 'object' ? game : { steamName: game, appId: null }
        ))],
    };
}

compareWishlists()
    .then(data => {
        const { generateHTMLReport } = require('./reportPage');
        generateHTMLReport(data);
    })
    .catch(error => console.error('Error:', error.message));
