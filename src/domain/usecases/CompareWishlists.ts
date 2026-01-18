/**
 * Domain Use Case: Compare Wishlists
 * Pure business logic for comparing two wishlists
 */

import { Game, GameName } from '../entities/Game';
import { WishlistCollection } from '../entities/Wishlist';
import { WishlistComparison, ComparisonFactory } from '../entities/ComparisonResult';

export interface CompareWishlistsInput {
  firstWishlist: WishlistCollection;
  secondWishlist: WishlistCollection;
  excludedAppIds?: number[];
  excludedNames?: string[];
  fuzzyMatchThreshold?: number;
}

export interface CompareWishlistsOutput {
  comparison: WishlistComparison;
  statistics: {
    totalGames: number;
    matchCount: number;
    onlyInFirst: number;
    onlyInSecond: number;
    matchPercentage: string;
  };
}

/**
 * Use Case: Compare two wishlists and categorize games
 * 
 * Business Rules:
 * 1. Games are matched by fuzzy name comparison (default 20% threshold)
 * 2. Excluded games are filtered out from results
 * 3. Duplicates are removed
 * 4. Results are categorized into: both, only in first, only in second
 */
export class CompareWishlistsUseCase {
  constructor(
    private readonly fuzzyMatchThreshold: number = 0.2
  ) {}
  
  execute(input: CompareWishlistsInput): CompareWishlistsOutput {
    const { firstWishlist, secondWishlist, excludedAppIds = [], excludedNames = [], fuzzyMatchThreshold } = input;
    const threshold = fuzzyMatchThreshold ?? this.fuzzyMatchThreshold;
    
    // Step 1: Filter out excluded games
    const filteredFirst = this.filterExcluded(firstWishlist, excludedAppIds, excludedNames);
    const filteredSecond = this.filterExcluded(secondWishlist, excludedAppIds, excludedNames);
    
    // Step 2: Find matches using fuzzy name matching
    const { inBoth, onlyInFirst, onlyInSecond } = this.compareWishlists(
      filteredFirst,
      filteredSecond,
      threshold
    );
    
    // Step 3: Remove duplicates
    const uniqueInBoth = this.removeDuplicates(inBoth);
    const uniqueOnlyInFirst = this.removeDuplicates(onlyInFirst);
    const uniqueOnlyInSecond = this.removeDuplicates(onlyInSecond);
    
    // Step 4: Create comparison result
    const comparison = ComparisonFactory.create(
      uniqueInBoth,
      uniqueOnlyInFirst,
      uniqueOnlyInSecond,
      firstWishlist.platform,
      secondWishlist.platform
    );
    
    return {
      comparison,
      statistics: {
        totalGames: comparison.totalUniqueGames,
        matchCount: comparison.matchCount,
        onlyInFirst: uniqueOnlyInFirst.length,
        onlyInSecond: uniqueOnlyInSecond.length,
        matchPercentage: comparison.matchPercentage.toFixed(2) + '%'
      }
    };
  }
  
  private filterExcluded(
    wishlist: WishlistCollection,
    excludedAppIds: number[],
    excludedNames: string[]
  ): WishlistCollection {
    if (excludedAppIds.length === 0 && excludedNames.length === 0) {
      return wishlist;
    }
    
    // Normalize excluded names for comparison
    const normalizedExcludedNames = new Set(
      excludedNames.map(name => new GameName(name).normalizedValue)
    );
    
    return wishlist.filter(game => {
      // Filter by appId for games with valid appIds (Steam games)
      if (game.appId && game.appId > 0 && excludedAppIds.includes(game.appId)) {
        return false;
      }
      
      // Filter by normalized name (works for both Steam and Backloggd games)
      const gameName = new GameName(game.name);
      if (normalizedExcludedNames.has(gameName.normalizedValue)) {
        return false;
      }
      
      return true;
    });
  }
  
  private compareWishlists(
    first: WishlistCollection,
    second: WishlistCollection,
    threshold: number
  ): {
    inBoth: Game[];
    onlyInFirst: Game[];
    onlyInSecond: Game[];
  } {
    const inBoth: Game[] = [];
    const onlyInFirst: Game[] = [];
    const matchedSecondNames = new Set<string>();
    
    // Find games in first that match or don't match in second
    for (const firstGame of first.items) {
      const firstGameName = new GameName(firstGame.name);
      let foundMatch = false;
      
      for (const secondGame of second.items) {
        const secondGameName = new GameName(secondGame.name);
        
        if (firstGameName.isSimilarTo(secondGameName, threshold)) {
          inBoth.push(firstGame);
          // Use normalized name as key instead of appId (fixes appId=0 collision bug)
          matchedSecondNames.add(secondGameName.normalizedValue);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        onlyInFirst.push(firstGame);
      }
    }
    
    // Find games only in second (not matched)
    // Use normalized name instead of appId for matching
    const onlyInSecond = second.items.filter(game => {
      const gameName = new GameName(game.name);
      return !matchedSecondNames.has(gameName.normalizedValue);
    });
    
    return {
      inBoth,
      onlyInFirst,
      onlyInSecond: [...onlyInSecond]
    };
  }
  
  private removeDuplicates(games: Game[]): Game[] {
    const uniqueGames = new Map<string, Game>();
    
    for (const game of games) {
      // Use normalized name as key to avoid appId=0 collisions
      const gameName = new GameName(game.name);
      const key = gameName.normalizedValue;
      
      if (!uniqueGames.has(key)) {
        uniqueGames.set(key, game);
      }
    }
    
    return Array.from(uniqueGames.values());
  }
}
