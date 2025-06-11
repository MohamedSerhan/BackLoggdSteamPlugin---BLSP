const { escapeHtml } = require('./reportUtils');

function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const BACKLOGGD_PLACEHOLDER = `<svg class='game-icon backloggd-svg' width='60' height='22' viewBox='0 0 60 22' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='22' rx='4' fill='#3b3b3b'/><text x='50%' y='55%' text-anchor='middle' fill='#fff' font-size='11' font-family='Segoe UI,Arial,sans-serif' dy='.3em'>BKLGD</text></svg>`;
const STEAM_PLACEHOLDER = `<svg class='game-icon steam-svg' width='60' height='22' viewBox='0 0 60 22' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='60' height='22' rx='4' fill='#222'/><text x='50%' y='55%' text-anchor='middle' fill='#fff' font-size='11' font-family='Segoe UI,Arial,sans-serif' dy='.3em'>STEAM</text></svg>`;

function dedupeGames(data) {
    const seen = new Set();
    return data.filter(item => {
        const name = typeof item === 'object' ? item.steamName : item;
        const appId = typeof item === 'object' ? item.appId : '';
        const key = (name + '|' + appId).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Stub for future: try to find a better image for a game (e.g. via Bing, Google, IGDB, etc.)
function getBestGameImage(name, appId) {
    if (appId) {
        // Use Steam capsule, mark for fallback
        return `<img class='game-icon' data-fallback='steam' src='https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_184x69.jpg' alt='${escapeHtml(name)}' loading='lazy' title='Steam Capsule' />`;
    }
    // For Backloggd or unknown, mark for backloggd fallback
    return `<img class='game-icon' data-fallback='backloggd' src='data:image/svg+xml;utf8,${encodeURIComponent(BACKLOGGD_PLACEHOLDER)}' alt='${escapeHtml(name)}' loading='lazy' title='No Capsule Available' />`;
}

function renderGameList(sectionId, data, isSteamWishlist) {
    const deduped = dedupeGames(data);
    if (!deduped.length) return '<li class="no-items">No games found in this category</li>';
    return deduped.map(item => {
        const name = typeof item === 'object' ? item.steamName : item;
        const appId = typeof item === 'object' ? item.appId : null;
        const slug = slugify(name);
        let iconHtml = getBestGameImage(name, appId);
        let li = `<li data-name="${escapeHtml(name.toLowerCase())}"${appId ? ` data-appid="${appId}"` : ''}>`;
        li += `<span class='checkmark'>✔</span>`;
        li += iconHtml;
        if (isSteamWishlist && appId) {
            li += `<a class='game-link' href="https://store.steampowered.com/app/${appId}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a><button class='add-btn' onclick='addToSteamSingle(this.parentNode, "${appId}")'>Add</button>`;
        } else if (sectionId === 'add-to-backloggd') {
            // Backloggd-only: add Backloggd link and Add button (button acts as link)
            li += `<a class='game-link' href="https://www.backloggd.com/games/${slug}/" target="_blank" rel="noopener noreferrer" title="View on Backloggd">${escapeHtml(name)}</a>`;
            li += `<a class='add-btn backloggd-add-btn' href="https://www.backloggd.com/games/${slug}/" target="_blank" rel="noopener noreferrer">Add</a>`;
        } else if (appId) {
            li += `<a class='game-link' href="https://store.steampowered.com/app/${appId}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
        } else {
            li += `<span class='game-link'>${escapeHtml(name)}</span>`;
        }
        li += `</li>`;
        return li;
    }).join('');
}

module.exports = { renderGameList };
