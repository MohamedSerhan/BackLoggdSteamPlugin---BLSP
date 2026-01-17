/**
 * Type definitions for logColors module
 */

/**
 * Logs an informational message in cyan
 * @param message - The message to log
 */
export function logInfo(message: string): void;

/**
 * Logs a success message in green
 * @param message - The message to log
 */
export function logSuccess(message: string): void;

/**
 * Logs a warning message in yellow
 * @param message - The message to log
 */
export function logWarn(message: string): void;

/**
 * Logs an error message in red
 * @param message - The message to log
 */
export function logError(message: string): void;

/**
 * Logs a fetch operation message in blue
 * @param message - The message to log
 */
export function logFetch(message: string): void;

/**
 * Logs a cache operation message in magenta
 * @param message - The message to log
 */
export function logCache(message: string): void;
