// logColors.js - Common color logging utility for Backloggd services

const colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m',      // Cyan
    success: '\x1b[32m',   // Green
    warn: '\x1b[33m',      // Yellow
    error: '\x1b[31m',     // Red
    fetch: '\x1b[35m',     // Magenta
    cache: '\x1b[34m',     // Blue
};

function logInfo(msg) { console.log(logWithColor(`ℹ️  ${msg}`, 'info')); }
function logSuccess(msg) { console.log(logWithColor(`✅ ${msg}`, 'success')); }
function logWarn(msg) { console.warn(logWithColor(`⚠️  ${msg}`, 'warn')); }
function logError(msg) { console.error(logWithColor(`❌ ${msg}`, 'error')); }
function logFetch(msg) { console.log(logWithColor(`🔄 ${msg}`, 'fetch')); }
function logCache(msg) { console.log(logWithColor(`📦 ${msg}`, 'cache')); }

function logWithColor(message, color = 'reset') {
    return `${colors[color] || colors.reset}${message}${colors.reset}`;
}

module.exports = {
    logInfo,
    logSuccess,
    logWarn,
    logError,
    logFetch,
    logCache
};
