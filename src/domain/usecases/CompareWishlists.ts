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
    const { firstWishlist, secondWishlist, excludedAppIds = [], fuzzyMatchThreshold } = input;
    const threshold = fuzzyMatchThreshold ?? this.fuzzyMatchThreshold;
    
    // Step 1: Filter out excluded games
    const filteredFirst = this.filterExcluded(firstWishlist, excludedAppIds);
    const filteredSecond = this.filterExcluded(secondWishlist, excludedAppIds);
    
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
    excludedAppIds: number[]
  ): WishlistCollection {
    if (excludedAppIds.length === 0) {
      return wishlist;
    }
    
    return wishlist.filter(game => !excludedAppIds.includes(game.appId));
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
    const matchedSecondIds = new Set<number>();
    
    // Find games in first that match or don't match in second
    for (const firstGame of first.items) {
      const firstGameName = new GameName(firstGame.name);
      let foundMatch = false;
      
      for (const secondGame of second.items) {
        const secondGameName = new GameName(secondGame.name);
        
        if (firstGameName.isSimilarTo(secondGameName, threshold)) {
          inBoth.push(firstGame);
          matchedSecondIds.add(secondGame.appId);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        onlyInFirst.push(firstGame);
      }
    }
    
    // Find games only in second (not matched)
    const onlyInSecond = second.items.filter(
      game => !matchedSecondIds.has(game.appId)
    );
    
    return {
      inBoth,
      onlyInFirst,
      onlyInSecond: [...onlyInSecond]
    };
  }
  
  private removeDuplicates(games: Game[]): Game[] {
    const uniqueGames = new Map<number, Game>();
    
    for (const game of games) {
      if (!uniqueGames.has(game.appId)) {
        uniqueGames.set(game.appId, game);
      }
    }
    
    return Array.from(uniqueGames.values());
  }
}
