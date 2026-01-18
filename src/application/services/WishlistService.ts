/**
 * Application Service: Wishlist Service
 * Orchestrates domain logic and infrastructure for wishlist comparison
 */

import { IWishlistRepository } from '../../infrastructure/repositories/IWishlistRepository';
import { CompareWishlistsUseCase, CompareWishlistsOutput } from '../../domain/usecases/CompareWishlists';
import { WishlistCollection } from '../../domain/entities/Wishlist';

/**
 * Service for managing wishlist operations
 * Coordinates between repositories and use cases
 */
export class WishlistService {
  constructor(
    private readonly wishlistRepo: IWishlistRepository,
    private readonly compareUseCase: CompareWishlistsUseCase
  ) {}
  
  /**
   * Compares a user's Steam wishlist with their Backloggd wishlist
   * @param steamId - Steam user ID
   * @param backloggdUsername - Backloggd username
   * @param excludedAppIds - Optional array of app IDs to exclude
   * @param excludedNames - Optional array of game names to exclude
   * @param fuzzyMatchThreshold - Optional fuzzy match threshold (default 0.2)
   */
  async compareWishlists(
    steamId: string,
    backloggdUsername: string,
    excludedAppIds?: number[],
    excludedNames?: string[],
    fuzzyMatchThreshold?: number
  ): Promise<CompareWishlistsOutput> {
    try {
      console.log(`Fetching wishlists for comparison...`);
      console.log(`Steam ID: ${steamId}`);
      console.log(`Backloggd Username: ${backloggdUsername}`);
      
      // Fetch both wishlists
      const steamWishlist = await this.wishlistRepo.getSteamWishlist(steamId);
      const backloggdWishlist = await this.wishlistRepo.getBackloggdWishlist(backloggdUsername);
      
      console.log(`Steam wishlist: ${steamWishlist.count} games`);
      console.log(`Backloggd wishlist: ${backloggdWishlist.count} games`);
      
      // Compare using use case
      const result = this.compareUseCase.execute({
        firstWishlist: steamWishlist,
        secondWishlist: backloggdWishlist,
        excludedAppIds,
        excludedNames,
        fuzzyMatchThreshold
      });
      
      console.log(`Comparison complete:`);
      console.log(`- Games in both: ${result.statistics.matchCount}`);
      console.log(`- Only in Steam: ${result.statistics.onlyInFirst}`);
      console.log(`- Only in Backloggd: ${result.statistics.onlyInSecond}`);
      console.log(`- Match percentage: ${result.statistics.matchPercentage}`);
      
      return result;
    } catch (error) {
      console.error(`Error comparing wishlists:`, error);
      throw error;
    }
  }
  
  /**
   * Compares Steam wishlist with Backloggd backlog
   * @param steamId - Steam user ID
   * @param backloggdUsername - Backloggd username
   * @param excludedAppIds - Optional array of app IDs to exclude
   * @param fuzzyMatchThreshold - Optional fuzzy match threshold
   */
  async compareSteamWithBacklog(
    steamId: string,
    backloggdUsername: string,
    excludedAppIds?: number[],
    fuzzyMatchThreshold?: number
  ): Promise<CompareWishlistsOutput> {
    try {
      console.log(`Comparing Steam wishlist with Backloggd backlog...`);
      
      const steamWishlist = await this.wishlistRepo.getSteamWishlist(steamId);
      const backloggdBacklog = await this.wishlistRepo.getBackloggdBacklog(backloggdUsername);
      
      console.log(`Steam wishlist: ${steamWishlist.count} games`);
      console.log(`Backloggd backlog: ${backloggdBacklog.count} games`);
      
      return this.compareUseCase.execute({
        firstWishlist: steamWishlist,
        secondWishlist: backloggdBacklog,
        excludedAppIds,
        fuzzyMatchThreshold
      });
    } catch (error) {
      console.error(`Error comparing Steam wishlist with Backloggd backlog:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a Steam wishlist
   * @param steamId - Steam user ID
   */
  async getSteamWishlist(steamId: string): Promise<WishlistCollection> {
    try {
      return await this.wishlistRepo.getSteamWishlist(steamId);
    } catch (error) {
      console.error(`Error fetching Steam wishlist:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a Backloggd wishlist
   * @param username - Backloggd username
   */
  async getBackloggdWishlist(username: string): Promise<WishlistCollection> {
    try {
      return await this.wishlistRepo.getBackloggdWishlist(username);
    } catch (error) {
      console.error(`Error fetching Backloggd wishlist:`, error);
      throw error;
    }
  }
  
  /**
   * Fetches a Backloggd backlog
   * @param username - Backloggd username
   */
  async getBackloggdBacklog(username: string): Promise<WishlistCollection> {
    try {
      return await this.wishlistRepo.getBackloggdBacklog(username);
    } catch (error) {
      console.error(`Error fetching Backloggd backlog:`, error);
      throw error;
    }
  }
  
  /**
   * Validates game names on Steam
   * @param gameNames - Array of game names to validate
   */
  async validateGamesOnSteam(gameNames: string[]): Promise<WishlistCollection> {
    try {
      return await this.wishlistRepo.validateGamesOnSteam(gameNames);
    } catch (error) {
      console.error(`Error validating games on Steam:`, error);
      throw error;
    }
  }
  
  /**
   * Compares two arbitrary wishlist collections
   * @param first - First wishlist
   * @param second - Second wishlist
   * @param excludedAppIds - Optional array of app IDs to exclude
   * @param fuzzyMatchThreshold - Optional fuzzy match threshold
   */
  async compareCollections(
    first: WishlistCollection,
    second: WishlistCollection,
    excludedAppIds?: number[],
    fuzzyMatchThreshold?: number
  ): Promise<CompareWishlistsOutput> {
    try {
      return this.compareUseCase.execute({
        firstWishlist: first,
        secondWishlist: second,
        excludedAppIds,
        fuzzyMatchThreshold
      });
    } catch (error) {
      console.error(`Error comparing wishlist collections:`, error);
      throw error;
    }
  }
}
