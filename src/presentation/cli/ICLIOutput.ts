/**
 * Interface for CLI output operations
 * Abstracts console logging to allow for different implementations
 */

export interface ICLIOutput {
  /**
   * Log an informational message
   */
  info(message: string): void;
  
  /**
   * Log a success message
   */
  success(message: string): void;
  
  /**
   * Log an error message
   */
  error(message: string, error?: Error): void;
  
  /**
   * Log a warning message
   */
  warn(message: string): void;
  
  /**
   * Log debug information
   */
  debug(message: string): void;
}
