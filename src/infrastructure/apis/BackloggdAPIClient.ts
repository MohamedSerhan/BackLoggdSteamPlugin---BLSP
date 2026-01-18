/**
 * API Client: Backloggd
 * Wraps existing backloggdService.js functionality with TypeScript interface
 * Handles Backloggd API interactions for wishlist and backlog data
 */

import { Game, GameFactory } from '../../domain/entities/Game';
import { WishlistCollection, WishlistFactory } from '../../domain/entities/Wishlist';

// Import existing JavaScript service
const backloggdService = require('../../../services/backloggdService');

/**
 * Client for Backloggd API operations
 * Wraps existing backloggdService.js with domain entities
 */
export class BackloggdAPIClient {
  private backloggdDomain: string;
  private backloggdUsername: string;
  
  constructor(domain?: string, username?: string) {
    this.backloggdDomain = domain || process.env.BACKLOGGD_DOMAIN || '';
    this.backloggdUsername = username || process.env.BACKLOGGD_USERNAME || '';
    
    if (!this.backloggdDomain) {
      console.warn('BACKLOGGD_DOMAIN not configured - Backloggd operations will fail');
    }
    if (!this.backloggdUsername) {
      console.warn('BACKLOGGD_USERNAME not configured - Backloggd operations will fail');
    }
  }
  
  /**
   * Fetches all Backloggd data (wishlist and backlog)
   * @returns Object containing wishlist and backlog collections
   */
  async getAllData(): Promise<{
    wishlist: WishlistCollection;
    backlog: WishlistCollection;
  }> {
    try {
      const data = await backloggdService.getBackLoggdData();
      
      // Convert wishlist data to domain entities
      const wishlistGames = this.convertBackloggdGamesToEntities(data.wishlist || []);
      const backlogGames = this.convertBackloggdGamesToEntities(data.backlog || []);
      
      return {
        wishlist: WishlistFactory.createFromGames(
          wishlistGames,
          'backloggd',
          this.backloggdUsername
        ),
        backlog: WishlistFactory.createFromGames(
          backlogGames,
          'backloggd',
          this.backloggdUsername
        )
      };
    } catch (error) {
      console.error(`Error fetching Backloggd data: ${error}`);
      throw error;
    }
  }
  
  /**
   * Fetches the user's Backloggd wishlist
   * @param username - Optional username override
   */
  async getWishlist(username?: string): Promise<WishlistCollection> {
    const targetUsername = username || this.backloggdUsername;
    
    try {
      const data = await backloggdService.getBackLoggdData();
      const games = this.convertBackloggdGamesToEntities(data.wishlist || []);
      
      return WishlistFactory.createFromGames(
        games,
        'backloggd',
        targetUsername
      );
    } catch (error) {
      console.error(`Error fetching Backloggd wishlist: ${error}`);
      throw error;
    }
  }
  
  /**
   * Fetches the user's Backloggd backlog
   * @param username - Optional username override
   */
  async getBacklog(username?: string): Promise<WishlistCollection> {
    const targetUsername = username || this.backloggdUsername;
    
    try {
      const data = await backloggdService.getBackLoggdData();
      const games = this.convertBackloggdGamesToEntities(data.backlog || []);
      
      return WishlistFactory.createFromGames(
        games,
        'backloggd',
        targetUsername
      );
    } catch (error) {
      console.error(`Error fetching Backloggd backlog: ${error}`);
      throw error;
    }
  }
  
  /**
   * Converts Backloggd API response games to domain entities
   * @param backloggdGames - Raw game data from Backloggd API (array of strings or objects)
   */
  private convertBackloggdGamesToEntities(backloggdGames: any[]): Game[] {
    return backloggdGames
      .map((game: any) => {
        try {
          // Backloggd API returns simple string array of game names
          // e.g., ["Black Myth Wukong", "Elden Ring", ...]
          let gameName: string;
          
          if (typeof game === 'string') {
            // Direct string (current API format)
            gameName = game;
          } else if (typeof game === 'object') {
            // Object format (for backwards compatibility)
            gameName = game.name || game.title || '';
          } else {
            gameName = '';
          }
          
          if (!gameName || gameName.trim() === '') {
            console.warn('Skipping Backloggd game with no name:', game);
            return null;
          }
          
          // Backloggd API doesn't provide Steam app IDs
          return GameFactory.createFromBackloggd(gameName.trim());
        } catch (error) {
          console.error(`Error converting Backloggd game:`, error, game);
          return null;
        }
      })
      .filter((game): game is Game => game !== null);
  }
  
  /**
   * Sets the username for API calls
   * @param username - Backloggd username
   */
  setUsername(username: string): void {
    this.backloggdUsername = username;
  }
  
  /**
   * Sets the domain for API calls
   * @param domain - Backloggd API domain
   */
  setDomain(domain: string): void {
    this.backloggdDomain = domain;
  }
  
  /**
   * Gets the currently configured username
   */
  getUsername(): string {
    return this.backloggdUsername;
  }
  
  /**
   * Gets the currently configured domain
   */
  getDomain(): string {
    return this.backloggdDomain;
  }
}
