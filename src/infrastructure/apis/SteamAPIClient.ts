/**
 * API Client: Steam
 * Wraps existing steamService.js functionality with TypeScript interface
 * Handles Steam API interactions with rate limiting and retry logic
 */

import { Game, GameFactory } from '../../domain/entities/Game';
import { IGameRepository } from '../repositories/IGameRepository';

// Import existing JavaScript service
const steamService = require('../../../services/steamService');

/**
 * Client for Steam API operations
 * Wraps existing steamService.js with domain entities
 */
export class SteamAPIClient implements IGameRepository {
  private steamId: string;
  
  constructor(steamId?: string) {
    this.steamId = steamId || process.env.STEAM_ID || '';
    
    if (!this.steamId) {
      console.warn('STEAM_ID not configured - Steam operations will fail');
    }
  }
  
  /**
   * Fetches a game by its Steam app ID
   * @param appId - Steam app ID
   */
  async getByAppId(appId: number): Promise<Game | null> {
    try {
      // Use the internal fetch function (not exposed by steamService)
      // We'll need to call the parallel fetch with a single ID
      const games = await this.getByAppIds([appId]);
      return games.length > 0 ? games[0] : null;
    } catch (error) {
      console.error(`Error fetching game ${appId} from Steam: ${error}`);
      return null;
    }
  }
  
  /**
   * Fetches multiple games by their app IDs
   * Uses rate-limited parallel fetching
   * @param appIds - Array of Steam app IDs
   */
  async getByAppIds(appIds: number[]): Promise<Game[]> {
    try {
      // Import p-queue to match the service's behavior
      const PQueue = require('p-queue').default;
      const queue = new PQueue({
        concurrency: 2,
        interval: 1000,
        intervalCap: 3,
      });
      
      const tasks = appIds.map(appId => async () => {
        try {
          // Unfortunately, fetchGameDetails is not exported
          // We need to make the API call directly here
          const axios = require('axios');
          const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
          const response = await axios.get(url);
          const appData = response.data;
          const name = appData[appId]?.data?.name;
          
          if (name) {
            return GameFactory.createFromSteam(appId, name);
          }
          return null;
        } catch (error) {
          console.error(`Failed to fetch game ${appId}: ${error}`);
          return null;
        }
      });
      
      const results = await queue.addAll(tasks);
      return results.filter((game: Game | null): game is Game => game !== null);
    } catch (error) {
      console.error(`Error fetching games from Steam: ${error}`);
      return [];
    }
  }
  
  /**
   * Searches for games by name on Steam
   * @param name - Game name to search for
   */
  async searchByName(name: string): Promise<Game[]> {
    try {
      const axios = require('axios');
      const url = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(name)}`;
      const response = await axios.get(url);
      const results = response.data || [];
      
      return results.map((result: any) => 
        GameFactory.createFromSteam(result.appid, result.name)
      );
    } catch (error) {
      console.error(`Error searching Steam for "${name}": ${error}`);
      return [];
    }
  }
  
  /**
   * Saves a game (not supported by Steam API)
   */
  async save(_game: Game): Promise<void> {
    throw new Error('Save operation not supported by Steam API');
  }
  
  /**
   * Saves multiple games (not supported by Steam API)
   */
  async saveMany(_games: Game[]): Promise<void> {
    throw new Error('Save operation not supported by Steam API');
  }
  
  /**
   * Checks if a game exists on Steam
   * @param appId - Steam app ID
   */
  async exists(appId: number): Promise<boolean> {
    const game = await this.getByAppId(appId);
    return game !== null;
  }
  
  /**
   * Deletes a game (not supported by Steam API)
   */
  async delete(_appId: number): Promise<void> {
    throw new Error('Delete operation not supported by Steam API');
  }
  
  /**
   * Fetches the user's Steam wishlist
   * Returns all games with their details
   */
  async getUserWishlist(): Promise<Game[]> {
    try {
      const steamData = await steamService.getSteamData();
      
      // Convert to domain entities
      return steamData.map((game: any) => 
        GameFactory.createFromSteam(game.appId, game.steamName)
      );
    } catch (error) {
      console.error(`Error fetching Steam wishlist: ${error}`);
      throw error;
    }
  }
  
  /**
   * Validates that games exist on Steam
   * @param gameNames - Array of game names to validate
   */
  async validateGames(gameNames: string[]): Promise<Game[]> {
    try {
      const validated = await steamService.validateSteamGames(gameNames);
      
      // Convert to domain entities
      return validated.map((game: any) =>
        GameFactory.createFromSteam(game.appId, game.steamName)
      );
    } catch (error) {
      console.error(`Error validating games on Steam: ${error}`);
      return [];
    }
  }
  
  /**
   * Gets the current queue status
   */
  getQueueStatus(): { size: number; pending: number; isPaused: boolean } {
    return steamService.getQueueStatus();
  }
}
