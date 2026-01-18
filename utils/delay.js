/**
 * Simple delay utility script
 * Waits for specified milliseconds before exiting
 * Usage: node utils/delay.js [milliseconds]
 */
const delay = parseInt(process.argv[2]) || 2000;
setTimeout(() => process.exit(0), delay);
