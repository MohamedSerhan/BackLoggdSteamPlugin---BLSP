// All interactive JS for the wishlist report page
function toggleSection(id) {
    var list = document.getElementById(id + '-list');
    var btn = document.querySelector('#' + id + ' .collapsible');
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    btn.querySelector('.arrow').textContent = expanded ? '▶' : '▼';
    list.style.display = expanded ? 'none' : 'block';
}
function filterList(sectionId, value) {
    var list = document.getElementById(sectionId + '-list');
    if (!list) return;
    var filter = value.toLowerCase();
    Array.from(list.children).forEach(function(li) {
        var text = li.textContent.toLowerCase();
        li.style.display = text.includes(filter) ? '' : 'none';
    });
}
function sortList(sectionId, sortType) {
    var list = document.getElementById(sectionId + '-list');
    if (!list) return;
    var items = Array.from(list.children);
    items.sort(function(a, b) {
        var nameA = a.getAttribute('data-name') || '';
        var nameB = b.getAttribute('data-name') || '';
        if (sortType === 'az') return nameA.localeCompare(nameB);
        if (sortType === 'za') return nameB.localeCompare(nameA);
        if (sortType === 'appid') {
            var appA = parseInt(a.getAttribute('data-appid') || '0', 10);
            var appB = parseInt(b.getAttribute('data-appid') || '0', 10);
            return appA - appB;
        }
        return 0;
    });
    items.forEach(function(item) { list.appendChild(item); });
}
function collapseAll(expand) {
    ['already-on-both', 'add-to-backloggd', 'add-to-steam'].forEach(function(id) {
        var list = document.getElementById(id + '-list');
        var btn = document.querySelector('#' + id + ' .collapsible');
        btn.setAttribute('aria-expanded', expand);
        btn.querySelector('.arrow').textContent = expand ? '▼' : '▶';
        list.style.display = expand ? 'block' : 'none';
    });
}
function addAllToSteam() {
    var rows = document.querySelectorAll('#add-to-steam-list li');
    if (!rows.length) {
        showError('No Steam games to add!');
        return;
    }
    var added = 0;
    rows.forEach(function(li) {
        if (!li.classList.contains('added')) {
            var appId = li.getAttribute('data-appid');
            if (appId) { addToSteamSingle(li, appId); added++; }
        }
    });
    if (added === 0) {
        showError('All Steam games in this list have already been added.');
    } else {
        alert('Pretend to add all Steam games to Steam wishlist!');
    }
}
function addToSteamSingle(li, appId) {
    var tab = window.open('https://store.steampowered.com/app/' + appId, '_blank');
    if (!tab || tab.closed) {
        console.error('Popup blocked! Enable popups for this site.');
    }
    li.classList.add('added');
}
function addToBackloggdSingle(li, name) {
    // TODO: Implement actual Backloggd add logic (API or instructions)
    li.classList.add('added');
    alert(`Pretend to add '${name}' to Backloggd wishlist!`);
}
function addAllToBackloggd() {
    var rows = document.querySelectorAll('#add-to-backloggd-list li');
    if (!rows.length) {
        showError('No Backloggd games to add!');
        return;
    }
    var added = 0;
    rows.forEach(function(li) {
        if (!li.classList.contains('added')) {
            var name = li.getAttribute('data-name');
            var link = li.querySelector('a.game-link');
            if (link && link.href) {
                window.open(link.href, '_blank');
                added++;
            }
        }
    });
    if (added === 0) {
        showError('All Backloggd games in this list have already been added.');
    }
}
function scrollToSection(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
/**
 * Refreshes the cache by calling the API endpoint
 */
window.refreshCache = function refreshCache() {
    const button = event?.target;
    if (button) {
        button.disabled = true;
        button.textContent = 'Refreshing...';
    }

    fetch('http://localhost:8080/refresh/refresh-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.code === 2) {
            alert('Cache refreshed successfully! Please run the app again to see updated results.');
        } else {
            showError('Failed to refresh cache: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => {
        showError('Failed to refresh cache: ' + err.message + '. Is the API server running?');
    })
    .finally(() => {
        if (button) {
            button.disabled = false;
            button.textContent = 'Refresh Cache';
        }
    });
}
function setDarkMode(on) {
    if (on) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', '1');
        document.querySelector('.theme-slider').style.left = '38px';
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', '0');
        document.querySelector('.theme-slider').style.left = '8px';
    }
}
function toggleDarkMode() {
    setDarkMode(!document.documentElement.classList.contains('dark'));
}
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') !== '0') setDarkMode(true);
    // Move slider to correct position on load
    setTimeout(() => {
        if (document.documentElement.classList.contains('dark')) {
            document.querySelector('.theme-slider').style.left = '38px';
        } else {
            document.querySelector('.theme-slider').style.left = '8px';
        }
    }, 10);
    var btn = document.getElementById('dark-toggle-btn');
    if (btn) btn.onclick = toggleDarkMode;
});
// Utility: Show a user-facing error message at the top of the page
function showError(message) {
    let errorDiv = document.getElementById('report-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'report-error';
        errorDiv.className = 'report-error';
        document.body.prepend(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 7000);
}

// Modular image fallback handler
function handleImageFallback(img, type) {
    img.onerror = null;
    if (type === 'steam') {
        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg class="game-icon steam-svg" width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="22" rx="4" fill="#222"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="11" font-family="Segoe UI,Arial,sans-serif" dy=".3em">STEAM</text></svg>');
    } else {
        img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg class="game-icon backloggd-svg" width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="22" rx="4" fill="#3b3b3b"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="11" font-family="Segoe UI,Arial,sans-serif" dy=".3em">BKLGD</text></svg>');
    }
}

// Capsule fallback: swap broken images for SVG fallback (modularized)
function fixBrokenCapsules() {
    document.querySelectorAll('img.game-icon').forEach(function(img) {
        if (img.src.includes('steamstatic.com')) {
            img.onerror = function() { handleImageFallback(this, 'steam'); };
        } else {
            img.onerror = function() { handleImageFallback(this, 'backloggd'); };
        }
    });
}
window.addEventListener('DOMContentLoaded', fixBrokenCapsules);

/**
 * Toggles game exclusion status
 * @param {HTMLElement} button - The exclude button element
 * @param {string} gameName - Name of the game
 * @param {string|number} appId - Steam app ID
 */
function toggleExcludeGame(button, gameName, appId) {
    const li = button.closest('li');
    const isExcluded = li.classList.contains('excluded');

    const action = isExcluded ? 'unexclude' : 'exclude';
    const endpoint = isExcluded ? '/exclude/unexclude-game' : '/exclude/exclude-game';

    const payload = {
        gameName: gameName,
        appId: appId,
        reason: isExcluded ? '' : 'Misidentified or incorrect'
    };

    // Disable button during request
    button.disabled = true;
    const originalHTML = button.innerHTML;

    fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (isExcluded) {
                li.classList.remove('excluded');
                button.classList.remove('excluded');
                button.innerHTML = '🚫';
                button.title = 'Exclude this game';
                showError(`"${gameName}" has been re-included`);
                li.style.opacity = '1';
            } else {
                li.classList.add('excluded');
                button.classList.add('excluded');
                button.innerHTML = '✓';
                button.title = 'Include this game';
                showError(`"${gameName}" has been excluded`);
                // Fade out excluded item
                setTimeout(() => {
                    li.style.opacity = '0.5';
                }, 500);
            }
        } else {
            showError(`Failed to ${action} game: ${data.message || 'Unknown error'}`);
            button.innerHTML = originalHTML;
        }
    })
    .catch(err => {
        showError(`Error ${action}ing game: ${err.message}. Is the API server running?`);
        button.innerHTML = originalHTML;
    })
    .finally(() => {
        button.disabled = false;
    });
}

/**
 * Fetches and logs the list of excluded games
 */
function getExcludedGamesList() {
    fetch('http://localhost:8080/exclude/get-excluded', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Excluded games:', data.excludedGames);
        } else {
            console.error('Failed to get excluded games:', data.message);
        }
    })
    .catch(err => {
        console.error('Error fetching excluded games:', err.message);
        showError('Could not fetch excluded games. Is the API server running?');
    });
}
