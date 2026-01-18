/**
 * Composite Repository: Wishlist Repository
 * Combines Steam and Backloggd API clients
 * Implements IWishlistRepository interface
 */

import { WishlistCollection, WishlistType } from '../../domain/entities/Wishlist';
import { IWishlistRepository } from './IWishlistRepository';
import { SteamAPIClient } from '../apis/SteamAPIClient';
import { BackloggdAPIClient } from '../apis/BackloggdAPIClient';

/**
 * Repository for fetching wishlists from multiple platforms
 */
export class WishlistRepository implements IWishlistRepository {
  constructor(
    private readonly steamClient: SteamAPIClient,
    private readonly backloggdClient: BackloggdAPIClient
  ) {}
  
  /**
   * Fetches a user's wishlist from a platform
   * @param platform - Platform to fetch from ('steam' or 'backloggd')
   * @param userId - User identifier (Steam ID or Backloggd username)
   * @param type - Type of wishlist (for Backloggd: 'wishlist' or 'backlog')
   */
  async getWishlist(
    platform: 'steam' | 'backloggd',
    userId: string,
    type: WishlistType = 'wishlist'
  ): Promise<WishlistCollection> {
    try {
      if (platform === 'steam') {
        return await this.getSteamWishlist(userId);
      } else {
        if (type === 'backlog') {
          return await this.getBackloggdBacklog(userId);
        } else {
          return await this.getBackloggdWishlist(userId);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${platform} wishlist for ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a user's Steam wishlist
   * @param steamId - Steam user ID
   */
  async getSteamWishlist(steamId: string): Promise<WishlistCollection> {
    try {
      const games = await this.steamClient.getUserWishlist();
      
      const { WishlistFactory } = require('../../domain/entities/Wishlist');
      return WishlistFactory.createFromGames(games, 'steam', steamId);
    } catch (error) {
      console.error(`Error fetching Steam wishlist for ${steamId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a user's Backloggd wishlist
   * @param username - Backloggd username
   */
  async getBackloggdWishlist(username: string): Promise<WishlistCollection> {
    try {
      return await this.backloggdClient.getWishlist(username);
    } catch (error) {
      console.error(`Error fetching Backloggd wishlist for ${username}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a user's Backloggd backlog
   * @param username - Backloggd username
   */
  async getBackloggdBacklog(username: string): Promise<WishlistCollection> {
    try {
      return await this.backloggdClient.getBacklog(username);
    } catch (error) {
      console.error(`Error fetching Backloggd backlog for ${username}:`, error);
      throw error;
    }
  }
  
  /**
   * Validates that games exist on Steam
   * @param gameNames - Array of game names to validate
   */
  async validateGamesOnSteam(gameNames: string[]): Promise<WishlistCollection> {
    try {
      const validatedGames = await this.steamClient.validateGames(gameNames);
      
      const { WishlistFactory } = require('../../domain/entities/Wishlist');
      return WishlistFactory.createFromGames(
        validatedGames,
        'steam',
        'validated'
      );
    } catch (error) {
      console.error(`Error validating games on Steam:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches all Backloggd data (wishlist and backlog)
   * @param username - Backloggd username
   */
  async getBackloggdAllData(username: string): Promise<{
    wishlist: WishlistCollection;
    backlog: WishlistCollection;
  }> {
    try {
      return await this.backloggdClient.getAllData();
    } catch (error) {
      console.error(`Error fetching all Backloggd data for ${username}:`, error);
      throw error;
    }
  }
}
