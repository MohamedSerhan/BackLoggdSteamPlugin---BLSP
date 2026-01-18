/**
 * Interface for report generation
 * Abstracts report creation to allow for different output formats
 */

import { CompareWishlistsOutput } from '../../domain/usecases/CompareWishlists';

/**
 * Options for configuring report generation
 */
export interface ReportOptions {
  /**
   * Output file path for the report
   */
  outputPath?: string;
  
  /**
   * Whether to open the report automatically after generation
   */
  autoOpen?: boolean;
  
  /**
   * Custom title for the report
   */
  title?: string;
}

/**
 * Interface for generating reports from comparison results
 */
export interface IReportGenerator {
  /**
   * Generate a report from wishlist comparison results
   * 
   * @param result - The comparison result to generate a report from
   * @param options - Optional configuration for report generation
   * @returns Path to the generated report file
   */
  generateReport(result: CompareWishlistsOutput, options?: ReportOptions): Promise<string>;
}
