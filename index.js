require('dotenv').config();
const fs = require('node:fs');
const axios = require('axios');
const levenshtein = require('fast-levenshtein');
const { generateHTMLReport } = require('./reportPage');
const path = require('path');
const { getSteamData, validateSteamGames } = require('./services/steamService');
const { getBackLoggdData } = require('./services/backloggdService');

// Configuration from environment variables
const STEAM_ID = process.env.STEAM_ID;
const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;

// Constants for Steam API rate limiting and retries
const STEAM_API_DELAY = 100;
const MAX_RETRIES = 25;
const BASE_DELAY = 150;

// --- Cache Module ---
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_DIR = path.join(__dirname, 'cache');
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
// --- End Cache Module ---

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
