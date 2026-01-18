/**
 * Repository Interface: Game Repository
 * Defines contract for fetching and storing game data
 */

import { Game } from '../../domain/entities/Game';

export interface IGameRepository {
  /**
   * Fetches a game by its app ID
   */
  getByAppId(appId: number): Promise<Game | null>;
  
  /**
   * Fetches multiple games by their app IDs
   */
  getByAppIds(appIds: number[]): Promise<Game[]>;
  
  /**
   * Searches for games by name
   */
  searchByName(name: string): Promise<Game[]>;
  
  /**
   * Saves a game
   */
  save(game: Game): Promise<void>;
  
  /**
   * Saves multiple games
   */
  saveMany(games: Game[]): Promise<void>;
  
  /**
   * Checks if a game exists
   */
  exists(appId: number): Promise<boolean>;
  
  /**
   * Deletes a game
   */
  delete(appId: number): Promise<void>;
}
