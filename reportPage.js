const { renderGameList } = require('./reportList');
const { sortGamesAZ } = require('./reportUtils');
const fs = require('node:fs');

function renderCollapsibleSection(title, id, listHtml, defaultOpen = false, showAddAll = false, isBackloggd = false) {
    let addAllBtn = '';
    if (showAddAll && isBackloggd) {
        addAllBtn = `<button class="add-all-btn backloggd-add-all-btn" onclick="addAllToBackloggd()">Add All to Backloggd</button>`;
    } else if (showAddAll && !isBackloggd) {
        addAllBtn = `<button class="add-all-btn steam-add-all-btn" onclick="addAllToSteam()">Add All to Steam</button>`;
    }
    return `
    <div class="collapsible-section" id="${id}">
        <div class="section-header sticky-header">
            <div class="section-header-row">
                <span class="section-title">${title}</span>
                <div class="section-controls">
                    <input type="text" class="filter-input" placeholder="Filter games..." oninput="filterList('${id}', this.value)">
                    <select class="sort-select" onchange="sortList('${id}', this.value)">
                        <option value="az">Sort A-Z</option>
                        <option value="za">Sort Z-A</option>
                        ${showAddAll ? '<option value="appid">Sort by AppID</option>' : ''}
                    </select>
                    ${addAllBtn}
                </div>
                <button class="collapsible" aria-expanded="${defaultOpen ? 'true' : 'false'}" aria-controls="${id}-list" onclick="toggleSection('${id}')">
                    <span class="arrow">${defaultOpen ? '▼' : '▶'}</span> Show/Hide List
                </button>
            </div>
        </div>
        <ul id="${id}-list" class="game-list" style="display:${defaultOpen ? 'block' : 'none'};">${listHtml}</ul>
    </div>`;
}

function generateHTMLReport(data) {
    const steamAppIds = data['Add to Steam Wishlist'].map(game => game.appId).filter(Boolean);
    const sectionIds = {
        'Already on Both Platforms': 'already-on-both',
        'Add to Backloggd Wishlist': 'add-to-backloggd',
        'Add to Steam Wishlist': 'add-to-steam',
    };
    // Prepare sorted lists
    const alreadyBoth = sortGamesAZ(data['Already on Both']);
    const backloggdOnly = sortGamesAZ(data['Add to BackLoggd Wishlist']);
    const steamOnly = sortGamesAZ(data['Add to Steam Wishlist']);
    // Render sections
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wishlist Comparison Report</title>
    <link rel="stylesheet" href="reportStyles.css">
    <script src="reportScript.js"></script>
</head>
<body>
    <div class="container">
        <button id="dark-toggle-btn" class="dark-toggle">Toggle Dark/Light Mode</button>
        <h1>🎮 Wishlist Comparison Report</h1>
        <div class="stats">
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('already-on-both')">Shared Games</span></h3>
                <div class="stat-value">${alreadyBoth.length}</div>
            </div>
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('add-to-backloggd')">Backloggd Only</span></h3>
                <div class="stat-value">${backloggdOnly.length}</div>
            </div>
            <div class="stat-box">
                <h3><span class="anchor-link" onclick="scrollToSection('add-to-steam')">Steam Only</span></h3>
                <div class="stat-value">${steamOnly.length}</div>
            </div>
        </div>
        ${renderCollapsibleSection('🎯 Already on Both Platforms', sectionIds['Already on Both Platforms'], renderGameList(sectionIds['Already on Both Platforms'], alreadyBoth, false))}
        ${renderCollapsibleSection('📥 Add to Backloggd Wishlist', sectionIds['Add to Backloggd Wishlist'], renderGameList(sectionIds['Add to Backloggd Wishlist'], backloggdOnly, false), true, true, true)}
        ${renderCollapsibleSection('📤 Add to Steam Wishlist', sectionIds['Add to Steam Wishlist'], renderGameList(sectionIds['Add to Steam Wishlist'], steamOnly, true), true, true, false)}
    </div>
</body>
</html>`;
    fs.writeFileSync('./wishlistReport.html', htmlContent);
    console.log('✨ Generated beautiful HTML report successfully!');
}

module.exports = { generateHTMLReport };
