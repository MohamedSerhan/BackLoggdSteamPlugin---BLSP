/**
 * Type definitions for exclusionManager module
 */

export interface ExcludedGame {
    gameName: string;
    appId: string | number;
    reason?: string;
    excludedAt?: number;
}

export interface ExclusionResult {
    success: boolean;
    message: string;
}

export interface ExcludedGamesData {
    excludedGames: ExcludedGame[];
    lastUpdated: number | null;
}

/**
 * Excludes a game from appearing in reports
 * @param gameName - Name of the game to exclude
 * @param appId - Steam app ID
 * @param reason - Optional reason for exclusion
 * @returns Result object with success and message
 */
export function excludeGame(gameName: string, appId: string | number, reason?: string): ExclusionResult;

/**
 * Removes a game from the exclusion list
 * @param gameName - Name of the game to unexclude
 * @param appId - Steam app ID (optional)
 * @returns Result object with success and message
 */
export function unexcludeGame(gameName: string, appId?: string | number): ExclusionResult;

/**
 * Gets all excluded games
 * @returns Object containing array of excluded games and last updated timestamp
 */
export function getExcludedGames(): ExcludedGamesData;

/**
 * Filters out excluded games from an array
 * @param games - Array of games to filter
 * @returns Filtered array with excluded games removed
 */
export function filterOutExcludedGames(games: any[]): any[];

/**
 * Checks if a game is excluded
 * @param gameName - Name of the game to check
 * @returns True if the game is excluded
 */
export function isGameExcluded(gameName: string): boolean;
