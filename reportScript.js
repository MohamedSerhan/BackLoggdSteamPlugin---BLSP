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
        alert('No Steam games to add!');
        return;
    }
    rows.forEach(function(li) {
        if (!li.classList.contains('added')) {
            var appId = li.getAttribute('data-appid');
            if (appId) addToSteamSingle(li, appId);
        }
    });
    alert('Pretend to add all Steam games to Steam wishlist!');
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
        alert('No Backloggd games to add!');
        return;
    }
    rows.forEach(function(li) {
        if (!li.classList.contains('added')) {
            var name = li.getAttribute('data-name');
            // Find the Backloggd link in this li
            var link = li.querySelector('a.game-link');
            if (link && link.href) {
                window.open(link.href, '_blank');
            }
        }
    });
}
function scrollToSection(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function setDarkMode(on) {
    if (on) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', '1');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', '0');
    }
}
function toggleDarkMode() {
    setDarkMode(!document.documentElement.classList.contains('dark'));
}
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') !== '0') setDarkMode(true);
    var btn = document.getElementById('dark-toggle-btn');
    if (btn) btn.onclick = toggleDarkMode;
});
// Capsule fallback: swap broken images for SVG fallback
function fixBrokenCapsules() {
    document.querySelectorAll('img.game-icon').forEach(function(img) {
        img.onerror = function() {
            this.onerror = null;
            this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg class="game-icon steam-svg" width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="22" rx="4" fill="#222"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="11" font-family="Segoe UI,Arial,sans-serif" dy=".3em">STEAM</text></svg>');
        };
    });
}
window.addEventListener('DOMContentLoaded', fixBrokenCapsules);
