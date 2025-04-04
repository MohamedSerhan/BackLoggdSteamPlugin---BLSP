require('dotenv').config();
const fs = require('node:fs');
const axios = require('axios');

// Configuration from environment variables
const STEAM_ID = process.env.STEAM_ID;
const BACKLOGGD_DOMAIN = process.env.BACKLOGGD_DOMAIN;
const BACKLOGGD_USERNAME = process.env.BACKLOGGD_USERNAME;

console.log('Starting BackLoggdSteamPlugin - BLSP...');

// Helper function to normalize game names
function normalizeGameName(name) {
    return name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').trim();
}

// Get Backloggd wishlist data
async function getBackLoggdData() {
    console.log('Getting wishlist data from BackLoggd...');
    const url = `${BACKLOGGD_DOMAIN}/user/${BACKLOGGD_USERNAME}/wishlist`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        console.log('Found wishlist data from BackLoggd!')
        return json.content || [];
    } catch (error) {
        console.error('Backloggd Error:', error.message);
        return [];
    }
}

// Get Steam wishlist data using official API
async function getSteamData() {
    const wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?input_json=${
        encodeURIComponent(JSON.stringify({ steamid: STEAM_ID }))
    }`;

    try {
        // Fetch wishlist app IDs
        const wishlistResponse = await axios.get(wishlistUrl);

        // Extract app IDs from the response
        const appIds = wishlistResponse.data.response.items.map(item => item.appid);

        // Fetch game details with rate limiting and 429 retries
const steamGames = [];
console.log('Translating wishlist data to Steam game names... This may take some time due to Steam rate limits.');

// Helper function for retry logic
async function fetchWithRetry(appId, retryCount = 0) {
    const maxRetries = 25; // Maximum number of retry attempts
    const baseDelay = 100; // Base delay in ms (1 second)
    
    try {
        const appUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        const appResponse = await axios.get(appUrl);
        return appResponse.data;
    } catch (error) {
        if (error.response && error.response.status === 429 && retryCount < maxRetries) {
            const retryAfter = error.response.headers['retry-after'] 
                ? parseInt(error.response.headers['retry-after'], 10) * 2000 // Convert seconds to ms
                : Math.pow(2, retryCount) * baseDelay; // Exponential backoff
            
            console.log(`🔄 Rate limit hit for app ${appId}. Retrying in ${retryAfter/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return fetchWithRetry(appId, retryCount + 1);
        }
        throw error; // Re-throw other errors or if max retries exceeded
    }
}

    // Main processing loop
    for (const appId of appIds) {
        try {
            // Base rate limiting between requests
            await new Promise(resolve => setTimeout(resolve, 250));
            
            const appData = await fetchWithRetry(appId);
            const name = appData[appId]?.data?.name;
            
            if (name) {
                console.log("✅ Found Game on Steam:", name);
                steamGames.push(name);
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

// Rest of your existing code remains the same
function removeDupesFromWishlist(wishlistComparison) {
    let { both, steamOnly, backLoggdOnly } = wishlistComparison;
    return {
        'Add to BackLoggd Wishlist': [...new Set(steamOnly.map(normalizeGameName))],
        'Add to Steam Wishlist': [...new Set(backLoggdOnly.map(normalizeGameName))],
        'Already on Both': [...new Set(both.map(normalizeGameName))],
    };
}

async function compareWishlists() {
    const [steamWishlist, backLoggdWishlist] = await Promise.all([
        getSteamData(),
        getBackLoggdData()
    ]);

    console.log('Normalizing names of games to compare them...');
    const normalized = {
        steam: steamWishlist.map(normalizeGameName),
        backloggd: backLoggdWishlist.map(normalizeGameName)
    };
    console.log('Completed normalizing game names!');

    const comparison = {
        both: [],
        steamOnly: [],
        backLoggdOnly: []
    };

    console.log('Starting comparison logic to filter games to proper status...');
    // Comparison logic
    normalized.steam.forEach(game => {
        normalized.backloggd.includes(game) 
            ? comparison.both.push(game)
            : comparison.steamOnly.push(game);
    });

    normalized.backloggd.forEach(game => {
        if (!normalized.steam.includes(game)) {
            comparison.backLoggdOnly.push(game);
        }
    });
    console.log('Done with comparison logic to filter games to proper status!');

    console.log('Removing dupes from wishlist if they exist...');
    return removeDupesFromWishlist(comparison);
}

// Function to generate an HTML report with better styling
function generateHTMLReport(data) {
    console.log('Done with all pre-report generation steps! \n Generating report...');
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wishlist Comparison Report</title>
        <style>
            :root {
                --primary-color: #2c3e50;
                --secondary-color: #3498db;
                --background-color: #f8f9fa;
            }

            body {
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 2rem;
                background-color: var(--background-color);
                color: var(--primary-color);
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            }

            h1 {
                color: var(--secondary-color);
                border-bottom: 3px solid var(--secondary-color);
                padding-bottom: 0.5rem;
                margin-bottom: 2rem;
            }

            h2 {
                color: var(--primary-color);
                margin-top: 2rem;
                padding-left: 0.5rem;
                border-left: 4px solid var(--secondary-color);
            }

            .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .stat-box {
                padding: 1rem;
                background: var(--background-color);
                border-radius: 8px;
                text-align: center;
            }

            .stat-box h3 {
                margin: 0 0 0.5rem;
                color: var(--secondary-color);
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 10px rgba(0,0,0,0.05);
            }

            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
            }

            th {
                background-color: var(--secondary-color);
                color: white;
                font-weight: 600;
            }

            tr:hover {
                background-color: #f5f5f5;
            }

            .no-items {
                color: #666;
                font-style: italic;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 1rem 0;
            }

            .toc {
              margin-bottom: 2rem; 
              padding-left: 1rem; 
              border-left: 4px solid var(--secondary-color); 
              background-color:#eef7fe; 
              padding-top:.5em; 
              padding-bottom:.5em
          }
          a.toc-link{
          text-decoration:none;color:black;}
          </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Wishlist Comparison Report</h1>

            <!-- Stats Section -->
            <div class="stats">
                <div class="stat-box">
                    <h3><a class="toc-link" href="#shared-games">Shared Games</a></h3>
                    <div class="stat-value">${data['Already on Both'].length}</div>
                </div>
                <div class="stat-box">
                    <h3><a class="toc-link" href="#backloggd-needed">Backloggd Needed</a></h3>
                    <div class="stat-value">${data['Add to BackLoggd Wishlist'].length}</div>
                </div>
                <div class="stat-box">
                    <h3><a class="toc-link" href="#steam-needed">Steam Needed</a></h3>
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
            <h2 id="steam-needed">📤 Add to Steam Wishlist</h2>
            ${generateTable(data['Add to Steam Wishlist'])}
        </div>
    </body>
    </html>`;

    fs.writeFileSync('./wishlistReport.html', htmlContent);
    console.log('✨ Generated beautiful HTML report successfully!');
}


// Enhanced table generator with icons and better empty state
function generateTable(data) {
    if (data.length === 0) {
        return '<div class="no-items">No games found in this category</div>';
    }

    const tableRows = data.map(item => `
        <tr>
            <td>🎮 ${item}</td>
        </tr>
    `).join('');

    return `
    <table>
        <thead>
            <tr>
                <th>Game Title</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>`;
}


// Execute comparison and generate report
compareWishlists()
    .then(generateHTMLReport)
    .catch(err => console.error('Process failed:', err));
