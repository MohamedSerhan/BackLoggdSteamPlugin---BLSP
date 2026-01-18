/**
 * Console Output Implementation
 * Wraps the existing logColors service to provide typed CLI output
 */

import { ICLIOutput } from './ICLIOutput';

// Import legacy log colors
const { logInfo, logSuccess, logError, logWarning } = require('../../../services/logColors');

/**
 * Console-based implementation of CLI output
 * Uses the existing logColors service for colored terminal output
 */
export class ConsoleOutput implements ICLIOutput {
  /**
   * Log an informational message
   */
  info(message: string): void {
    logInfo(message);
  }
  
  /**
   * Log a success message
   */
  success(message: string): void {
    logSuccess(message);
  }
  
  /**
   * Log an error message with optional error object
   */
  error(message: string, error?: Error): void {
    logError(message);
    if (error) {
      if (error.message) {
        logError(`  Message: ${error.message}`);
      }
      if (error.stack) {
        logError(`  Stack: ${error.stack}`);
      }
    }
  }
  
  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (logWarning) {
      logWarning(message);
    } else {
      // Fallback if logWarning doesn't exist
      console.warn(message);
    }
  }
  
  /**
   * Log debug information (only in development)
   */
  debug(message: string): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${message}`);
    }
  }
}
