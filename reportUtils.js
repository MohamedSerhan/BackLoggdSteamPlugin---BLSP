// Utility functions for HTML escaping, sorting, and other helpers
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}

function sortGamesAZ(games) {
    return [...games].sort((a, b) => {
        const nameA = typeof a === 'object' ? a.steamName : a;
        const nameB = typeof b === 'object' ? b.steamName : b;
        return nameA.localeCompare(nameB);
    });
}

module.exports = { escapeHtml, sortGamesAZ };
