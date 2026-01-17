/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// Cache Configuration
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_CACHE_TTL = CACHE_MAX_AGE_MS;

// Steam API Configuration
const STEAM_API_DELAY_MS = 100; // Delay between Steam API requests in milliseconds
const STEAM_MAX_RETRIES = 25; // Maximum retry attempts for Steam API calls
const STEAM_BASE_DELAY_MS = 150; // Base delay for exponential backoff in milliseconds

// Backloggd API Configuration
const BACKLOGGD_MAX_RETRIES = 2; // Maximum retry attempts for Backloggd API calls
const BACKLOGGD_RETRY_DELAY_MS = 1000; // Delay between retry attempts in milliseconds

// Fuzzy Matching Configuration
const FUZZY_MATCH_THRESHOLD = 0.2; // 20% threshold for Levenshtein distance matching
const SIMILARITY_THRESHOLD_PERCENT = 20; // Alternative representation as percentage

// UI Configuration
const UI_REFRESH_DELAY_MS = 7000; // Time to display UI messages before hiding
const UI_FADE_DELAY_MS = 500; // Delay before fading excluded items

// API Server Configuration
const API_PORT = 8080; // Default API server port
const API_BASE_URL = `http://127.0.0.1:${API_PORT}`; // Local API URL

// Timeout Configuration
const FETCH_TIMEOUT_MS = 60000; // 60 seconds timeout for data fetching operations
const API_REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout for API requests

// HTTP Configuration
const MAX_PAYLOAD_SIZE = '50mb'; // Maximum request payload size

// Dark Mode Configuration
const DARK_MODE_STORAGE_KEY = 'darkMode'; // localStorage key for dark mode preference

module.exports = {
    // Cache
    CACHE_MAX_AGE_MS,
    DEFAULT_CACHE_TTL,

    // Steam
    STEAM_API_DELAY_MS,
    STEAM_MAX_RETRIES,
    STEAM_BASE_DELAY_MS,

    // Backloggd
    BACKLOGGD_MAX_RETRIES,
    BACKLOGGD_RETRY_DELAY_MS,

    // Fuzzy Matching
    FUZZY_MATCH_THRESHOLD,
    SIMILARITY_THRESHOLD_PERCENT,

    // UI
    UI_REFRESH_DELAY_MS,
    UI_FADE_DELAY_MS,

    // API
    API_PORT,
    API_BASE_URL,

    // Timeouts
    FETCH_TIMEOUT_MS,
    API_REQUEST_TIMEOUT_MS,

    // HTTP
    MAX_PAYLOAD_SIZE,

    // Dark Mode
    DARK_MODE_STORAGE_KEY
};
