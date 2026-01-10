const fs = require('fs');
const path = require('path');
const { logInfo, logSuccess, logWarn, logError } = require('./services/logColors');

const EXCLUDED_GAMES_FILE = path.join(__dirname, 'excludedGames.json');

function loadExcludedGames() {
    try {
        if (fs.existsSync(EXCLUDED_GAMES_FILE)) {
            const data = fs.readFileSync(EXCLUDED_GAMES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        logWarn(`Failed to load excluded games: ${error.message}`);
    }
    return { excludedGames: [], lastUpdated: new Date().toISOString() };
}

function saveExcludedGames(data) {
    try {
        fs.writeFileSync(EXCLUDED_GAMES_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        logError(`Failed to save excluded games: ${error.message}`);
        return false;
    }
}

function excludeGame(gameName, appId, reason = '') {
    const data = loadExcludedGames();
    
    // Check if game is already excluded
    const exists = data.excludedGames.some(game => 
        game.gameName.toLowerCase() === gameName.toLowerCase() && game.appId === appId
    );
    
    if (exists) {
        logWarn(`Game "${gameName}" is already excluded`);
        return { success: false, message: 'Game is already excluded' };
    }
    
    data.excludedGames.push({
        gameName,
        appId,
        reason: reason || '',
        excludedAt: new Date().toISOString()
    });
    
    data.lastUpdated = new Date().toISOString();
    
    if (saveExcludedGames(data)) {
        logSuccess(`Excluded game: "${gameName}"`);
        return { success: true, message: `Game "${gameName}" has been excluded` };
    }
    
    return { success: false, message: 'Failed to save exclusion' };
}

function unexcludeGame(gameName, appId) {
    const data = loadExcludedGames();
    
    const index = data.excludedGames.findIndex(game =>
        game.gameName.toLowerCase() === gameName.toLowerCase() && game.appId === appId
    );
    
    if (index === -1) {
        logWarn(`Game "${gameName}" is not in the exclusion list`);
        return { success: false, message: 'Game not found in exclusion list' };
    }
    
    data.excludedGames.splice(index, 1);
    data.lastUpdated = new Date().toISOString();
    
    if (saveExcludedGames(data)) {
        logSuccess(`Included game: "${gameName}"`);
        return { success: true, message: `Game "${gameName}" has been included` };
    }
    
    return { success: false, message: 'Failed to save inclusion' };
}

function isGameExcluded(gameName, appId) {
    const data = loadExcludedGames();
    return data.excludedGames.some(game =>
        (game.gameName.toLowerCase() === gameName.toLowerCase() || game.appId === appId)
    );
}

function getExcludedGames() {
    return loadExcludedGames();
}

function filterOutExcludedGames(games) {
    const data = loadExcludedGames();
    const excludedSet = new Set();
    
    // Create a set of excluded game identifiers (by name and appId)
    data.excludedGames.forEach(game => {
        excludedSet.add(game.gameName.toLowerCase());
        if (game.appId) excludedSet.add(game.appId.toString());
    });
    
    // Filter games based on exclusion list
    return games.filter(game => {
        const gameName = typeof game === 'string' ? game : game.steamName || '';
        const appId = game.appId ? game.appId.toString() : '';
        
        return !excludedSet.has(gameName.toLowerCase()) && !excludedSet.has(appId);
    });
}

module.exports = {
    excludeGame,
    unexcludeGame,
    isGameExcluded,
    getExcludedGames,
    filterOutExcludedGames,
    loadExcludedGames,
    saveExcludedGames
};
