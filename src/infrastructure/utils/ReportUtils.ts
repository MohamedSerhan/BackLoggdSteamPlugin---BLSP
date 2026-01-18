/**
 * Report Utility Functions
 * Helpers for HTML escaping and data transformation
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const replacements: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, (char) => replacements[char] || char);
}

/**
 * Sort games alphabetically by name
 */
export function sortGamesAZ<T extends { steamName: string } | string>(games: T[]): T[] {
  return [...games].sort((a, b) => {
    const nameA = typeof a === 'string' ? a : a.steamName;
    const nameB = typeof b === 'string' ? b : b.steamName;
    return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  });
}

/**
 * Sort games in reverse alphabetical order
 */
export function sortGamesZA<T extends { steamName: string } | string>(games: T[]): T[] {
  return sortGamesAZ(games).reverse();
}

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deduplicate games by name and appId
 */
export function deduplicateGames<T extends { steamName: string; appId?: number | null }>(
  games: T[]
): T[] {
  const seen = new Set<string>();
  
  return games.filter(game => {
    const key = `${game.steamName.toLowerCase()}|${game.appId || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Format a date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date to human-readable string
 */
export function formatDateHuman(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return ((value / total) * 100).toFixed(1) + '%';
}
