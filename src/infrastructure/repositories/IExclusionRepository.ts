/**
 * Repository Interface for Game Exclusions
 * Defines contract for persisting and retrieving excluded games
 */

import { ExcludedGameCollection } from '../../domain/entities/ExcludedGame';

/**
 * Result of an exclusion operation
 */
export interface ExclusionOperationResult {
  success: boolean;
  message: string;
}

/**
 * Repository interface for managing game exclusions
 */
export interface IExclusionRepository {
  /**
   * Load all excluded games
   */
  loadExcludedGames(): Promise<ExcludedGameCollection>;
  
  /**
   * Save excluded games collection
   */
  saveExcludedGames(collection: ExcludedGameCollection): Promise<boolean>;
  
  /**
   * Add a game to the exclusion list
   */
  excludeGame(
    gameName: string,
    appId: number | null,
    reason?: string
  ): Promise<ExclusionOperationResult>;
  
  /**
   * Remove a game from the exclusion list
   */
  unexcludeGame(
    gameName: string,
    appId: number | null
  ): Promise<ExclusionOperationResult>;
  
  /**
   * Check if a game is excluded
   */
  isGameExcluded(gameName: string, appId?: number | null): Promise<boolean>;
}
