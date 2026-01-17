/**
 * Repository Interface: Wishlist Repository
 * Defines contract for fetching wishlists from different platforms
 */

import { Wishlist, WishlistCollection, WishlistType } from '../../domain/entities/Wishlist';

export interface IWishlistRepository {
  /**
   * Fetches a user's wishlist from a platform
   */
  getWishlist(platform: 'steam' | 'backloggd', userId: string, type?: WishlistType): Promise<WishlistCollection>;
  
  /**
   * Fetches a user's Steam wishlist
   */
  getSteamWishlist(steamId: string): Promise<WishlistCollection>;
  
  /**
   * Fetches a user's Backloggd wishlist
   */
  getBackloggdWishlist(username: string): Promise<WishlistCollection>;
  
  /**
   * Fetches a user's Backloggd backlog
   */
  getBackloggdBacklog(username: string): Promise<WishlistCollection>;
  
  /**
   * Validates that games exist on Steam
   */
  validateGamesOnSteam(gameNames: string[]): Promise<WishlistCollection>;
}
