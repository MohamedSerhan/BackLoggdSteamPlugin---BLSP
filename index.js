require('dotenv').config();
const levenshtein = require('fast-levenshtein');
const { generateHTMLReport } = require('./reportPage');
const { getSteamData, validateSteamGames } = require('./services/steamService');
const { getBackLoggdData } = require('./services/backloggdService');

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
    // Fetch Steam and Backloggd data
    console.log('Fetching data from Steam and Backloggd...');
    const [steamWishlist, backLoggdData] = await Promise.all([
        getSteamData(),
        getBackLoggdData()
    ]);

   // Combine and normalize Backloggd wishlist and backlog
    console.log('Combining and normalizing Backloggd data...');
    const normalizedBackloggdCombined = [
        ...backLoggdData.wishlist,
        ...backLoggdData.backlog
    ].map(normalizeGameName);

    // Create a comparison object
    const comparison = { both: [], steamOnly: [], backLoggdOnly: [] };

    // Compare Steam games against Backloggd
    console.log('Comparing Steam wishlist against Backloggd data...');
    steamWishlist.forEach(steamGame => {
        const matched = normalizedBackloggdCombined.some(backloggdGame => 
            areNamesSimilar(steamGame.steamName, backloggdGame)
        );
        
        matched ? comparison.both.push(steamGame) : comparison.steamOnly.push(steamGame.steamName);
    });
    console.log(`Steam wishlist comparison complete: ${comparison.both.length} matches, ${comparison.steamOnly.length} only on Steam`);

    // Compare Backloggd wishlist against Steam
    console.log('Comparing Backloggd wishlist against Steam data...');
    backLoggdData.wishlist.forEach(backloggdGame => {
        const normalized = normalizeGameName(backloggdGame);
        const exists = steamWishlist.some(steamGame => 
            areNamesSimilar(normalized, normalizeGameName(steamGame.steamName))
        );
        
        if (!exists) comparison.backLoggdOnly.push(backloggdGame);
    });
    console.log(`Backloggd wishlist comparison complete: ${comparison.backLoggdOnly.length} only on Backloggd`);

    // Validate Steam games
    console.log('Validating Backloggd Games exist on Steam...');
    comparison.backLoggdOnly = await validateSteamGames(comparison.backLoggdOnly);
    console.log(`Validated Backloggd games: ${comparison.backLoggdOnly.length} valid games`);

    // Remove duplicates from the comparison
    console.log('Removing duplicates from wishlist comparison...');
    const finalizedList = removeDupesFromWishlist(comparison);
    console.log('Removal of duplicates complete');
    console.log('Generating wishlist HTML report...');
    return finalizedList
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

// Start the comparison process
compareWishlists()
    .then(data => {
        // Generate the HTML report
        generateHTMLReport(data);
    })
    .catch(error => console.error('Error with report: ', error.message));
