require('dotenv').config();
const fs = require('node:fs');
const axios = require('axios');
const levenshtein = require('fast-levenshtein');

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

function generateHTMLReport(data) {
    console.log('Done with all pre-report generation steps! \n Generating report...');

    const steamAppIds = data['Add to Steam Wishlist'].map(game => game.appId).filter(Boolean);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wishlist Comparison Report</title>
        <style>
            :root { --primary-color: #2c3e50; --secondary-color: #3498db; --background-color: #f8f9fa; }
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; background-color: var(--background-color); color: var(--primary-color); }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); }
            h1 { color: var(--secondary-color); border-bottom: 3px solid var(--secondary-color); padding-bottom: 0.5rem; margin-bottom: 2rem; }
            h2 { color: var(--primary-color); margin-top: 2rem; padding-left: 0.5rem; border-left: 4px solid var(--secondary-color); }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
            .stat-box { padding: 1rem; background: var(--background-color); border-radius: 8px; text-align: center; }
            .stat-box h3 { margin: 0 0 0.5rem; color: var(--secondary-color); }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 10px rgba(0,0,0,0.05); }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e0e0e0; }
            th { background-color: var(--secondary-color); color: white; font-weight: 600; }
            tr:hover { background-color: #f5f5f5; }
            .no-items { color: #666; font-style: italic; padding: 1rem; background: #f8f9fa; border-radius: 8px; margin: 1rem 0; }
        </style>
        <script>
            const steamAppIds = ${JSON.stringify(steamAppIds)};
            let tabCounter = 0;

            function addAllToSteam() {
                if (!steamAppIds?.length) {
                    alert('No Steam games to add!');
                    return;
                }

                const confirmed = confirm(\`This will open \${steamAppIds.length} Steam store pages. Continue?\`);
                if (!confirmed) return;

                // Batch openings with increasing delays
                steamAppIds.forEach((appId, index) => {
                    console.log('opening link for: ', appId);
                    setTimeout(() => {
                        const tab = window.open(
                            \`https://store.steampowered.com/app/\${appId}\`,
                            \`steamTab-\${tabCounter++}\`
                        );
                        if (!tab || tab.closed) {
                            console.error('Popup blocked! Enable popups for this site.');
                        }
                    }, index * 300); // 300ms delay between openings
                });
            }
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Wishlist Comparison Report</h1>

            <!-- Stats Section -->
            <div class="stats">
                <div class="stat-box">
                    <h3><a href="#shared-games">Shared Games</a></h3>
                    <div class="stat-value">${data['Already on Both'].length}</div>
                </div>
                <div class="stat-box">
                    <h3><a href="#backloggd-needed">Backloggd Needed</a></h3>
                    <div class="stat-value">${data['Add to BackLoggd Wishlist'].length}</div>
                </div>
                <div class="stat-box">
                    <h3><a href="#steam-needed">Steam Needed</a></h3>
                    <div class="stat-value">${data['Add to Steam Wishlist'].length}</div>
                </div>
            </div>

            <!-- Sections -->
            
            <!-- Shared Games Section -->
            <h2 id="shared-games">🎯 Already on Both Platforms</h2>
            ${generateTable(data['Already on Both'])}

            <!-- Backloggd Needed Section -->
            <h2 id="backloggd-needed">📥 Add to Backloggd Wishlist</h2>
            ${generateTable(data['Add to BackLoggd Wishlist'])}

            <!-- Steam Needed Section -->
            <h2 id="steam-needed">📤 Add to Steam Wishlist 
                <button onclick="addAllToSteam()" style="margin-left:15px;padding:8px;background:#1b2838;color:white;border:none;border-radius:4px;">
                    ➕ Add All (${data['Add to Steam Wishlist'].length})
                </button>
            </h2>
            ${generateTable(data['Add to Steam Wishlist'])}
        </div>
    </body>
    </html>`;

    fs.writeFileSync('./wishlistReport.html', htmlContent);
    console.log('✨ Generated beautiful HTML report successfully!');
}

function generateTable(data) {
    if (data.length === 0) {
        return '<div class="no-items">No games found in this category</div>';
    }

    const tableRows = data.map(item => {
        const name = typeof item === 'object' ? item.steamName : item;
        const appId = typeof item === 'object' ? item.appId : null;
        
        return `
        <tr>
            <td>🎮 ${appId 
                ? `<a href="https://store.steampowered.com/app/${appId}" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style="color: #2c3e50; text-decoration: none;">
                     ${name}
                   </a>`
                : name}
            </td>
        </tr>`;
    }).join('');

    return `
    <table>
        <thead>
            <tr><th>Game Title</th></tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>`;
}

// Execute comparison and generate report
compareWishlists()
    .then(generateHTMLReport)
    .catch(err => console.error('Process failed:', err));
