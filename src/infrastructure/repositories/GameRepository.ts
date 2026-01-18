/**
 * Composite Repository: Game Repository
 * Combines cache and API clients with cache-first strategy
 * Implements IGameRepository interface
 */

import { Game } from '../../domain/entities/Game';
import { IGameRepository } from './IGameRepository';
import { ICacheRepository } from './ICacheRepository';
import { SteamAPIClient } from '../apis/SteamAPIClient';

/**
 * Game repository with cache-first strategy
 * Checks cache before making API calls
 */
export class GameRepository implements IGameRepository {
  constructor(
    private readonly cache: ICacheRepository<Game>,
    private readonly api: SteamAPIClient
  ) {}
  
  /**
   * Fetches a game by app ID (cache-first)
   * @param appId - Steam app ID
   */
  async getByAppId(appId: number): Promise<Game | null> {
    try {
      // Check cache first
      const cacheKey = `game_${appId}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Cache miss - fetch from API
      const game = await this.api.getByAppId(appId);
      
      if (game) {
        // Store in cache for future use
        await this.cache.set(cacheKey, game);
      }
      
      return game;
    } catch (error) {
      console.error(`Error getting game ${appId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetches multiple games by app IDs (cache-first)
   * @param appIds - Array of Steam app IDs
   */
  async getByAppIds(appIds: number[]): Promise<Game[]> {
    try {
      const games: Game[] = [];
      const uncachedAppIds: number[] = [];
      
      // Check cache for each game
      for (const appId of appIds) {
        const cacheKey = `game_${appId}`;
        const cached = await this.cache.get(cacheKey);
        
        if (cached) {
          games.push(cached);
        } else {
          uncachedAppIds.push(appId);
        }
      }
      
      // Fetch uncached games from API
      if (uncachedAppIds.length > 0) {
        const fetchedGames = await this.api.getByAppIds(uncachedAppIds);
        
        // Cache the fetched games
        for (const game of fetchedGames) {
          const cacheKey = `game_${game.appId}`;
          await this.cache.set(cacheKey, game);
          games.push(game);
        }
      }
      
      return games;
    } catch (error) {
      console.error(`Error getting games by app IDs:`, error);
      return [];
    }
  }
  
  /**
   * Searches for games by name
   * @param name - Game name to search for
   */
  async searchByName(name: string): Promise<Game[]> {
    try {
      return await this.api.searchByName(name);
    } catch (error) {
      console.error(`Error searching for game "${name}":`, error);
      return [];
    }
  }
  
  /**
   * Saves a game to cache
   * @param game - Game to save
   */
  async save(game: Game): Promise<void> {
    try {
      const cacheKey = `game_${game.appId}`;
      await this.cache.set(cacheKey, game);
    } catch (error) {
      console.error(`Error saving game ${game.appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Saves multiple games to cache
   * @param games - Games to save
   */
  async saveMany(games: Game[]): Promise<void> {
    try {
      for (const game of games) {
        await this.save(game);
      }
    } catch (error) {
      console.error(`Error saving games:`, error);
      throw error;
    }
  }
  
  /**
   * Checks if a game exists (checks cache first, then API)
   * @param appId - Steam app ID
   */
  async exists(appId: number): Promise<boolean> {
    try {
      const cacheKey = `game_${appId}`;
      const hasInCache = await this.cache.has(cacheKey);
      
      if (hasInCache) {
        return true;
      }
      
      // Not in cache, check API
      return await this.api.exists(appId);
    } catch (error) {
      console.error(`Error checking if game ${appId} exists:`, error);
      return false;
    }
  }
  
  /**
   * Deletes a game from cache
   * @param appId - Steam app ID
   */
  async delete(appId: number): Promise<void> {
    try {
      const cacheKey = `game_${appId}`;
      await this.cache.delete(cacheKey);
    } catch (error) {
      console.error(`Error deleting game ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Clears all cached games
   */
  async clearCache(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (error) {
      console.error(`Error clearing game cache:`, error);
      throw error;
    }
  }
  
  /**
   * Gets cache statistics
   */
  async getCacheStats(): Promise<{
    total: number;
    expired: number;
    valid: number;
    size?: string;
  }> {
    if (this.cache.getStats) {
      return await this.cache.getStats();
    }
    return { total: 0, expired: 0, valid: 0 };
  }
}
