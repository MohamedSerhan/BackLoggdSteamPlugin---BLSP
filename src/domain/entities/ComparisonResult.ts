/**
 * Domain Entity: ComparisonResult
 * Represents the result of comparing two wishlists
 */

import { Game } from './Game';

export interface ComparisonResult {
  /** Games that exist in both wishlists */
  both: Game[];
  
  /** Games only in the first wishlist */
  onlyInFirst: Game[];
  
  /** Games only in the second wishlist */
  onlyInSecond: Game[];
  
  /** Metadata about the comparison */
  metadata: {
    firstPlatform: string;
    secondPlatform: string;
    comparedAt: Date;
    totalGames: number;
  };
}

/**
 * Comparison Result Value Object
 * Immutable comparison with operations and statistics
 */
export class WishlistComparison {
  constructor(
    public readonly inBoth: ReadonlyArray<Game>,
    public readonly onlyInFirst: ReadonlyArray<Game>,
    public readonly onlyInSecond: ReadonlyArray<Game>,
    public readonly firstPlatform: string,
    public readonly secondPlatform: string
  ) {}
  
  /**
   * Gets the total number of unique games across both lists
   */
  get totalUniqueGames(): number {
    return this.inBoth.length + this.onlyInFirst.length + this.onlyInSecond.length;
  }
  
  /**
   * Gets the number of games in common
   */
  get matchCount(): number {
    return this.inBoth.length;
  }
  
  /**
   * Gets the percentage of games that match
   */
  get matchPercentage(): number {
    if (this.totalUniqueGames === 0) return 0;
    return (this.matchCount / this.totalUniqueGames) * 100;
  }
  
  /**
   * Checks if the wishlists are identical
   */
  get areIdentical(): boolean {
    return this.onlyInFirst.length === 0 && this.onlyInSecond.length === 0;
  }
  
  /**
   * Checks if the wishlists have any overlap
   */
  get haveOverlap(): boolean {
    return this.inBoth.length > 0;
  }
  
  /**
   * Gets statistics about the comparison
   */
  get statistics() {
    return {
      total: this.totalUniqueGames,
      inBoth: this.inBoth.length,
      onlyInFirst: this.onlyInFirst.length,
      onlyInSecond: this.onlyInSecond.length,
      matchPercentage: this.matchPercentage.toFixed(2) + '%'
    };
  }
  
  /**
   * Converts to user-friendly report format
   */
  toUserFriendlyFormat(): {
    'Add to BackLoggd Wishlist': string[];
    'Add to Steam Wishlist': Game[];
    'Already on Both': Game[];
  } {
    // Assuming first is Steam, second is Backloggd
    return {
      'Add to BackLoggd Wishlist': this.onlyInFirst.map(g => g.name),
      'Add to Steam Wishlist': [...this.onlyInSecond],
      'Already on Both': [...this.inBoth]
    };
  }
  
  /**
   * Converts to ComparisonResult interface
   */
  toComparisonResult(): ComparisonResult {
    return {
      both: [...this.inBoth],
      onlyInFirst: [...this.onlyInFirst],
      onlyInSecond: [...this.onlyInSecond],
      metadata: {
        firstPlatform: this.firstPlatform,
        secondPlatform: this.secondPlatform,
        comparedAt: new Date(),
        totalGames: this.totalUniqueGames
      }
    };
  }
  
  /**
   * Filters the comparison by a predicate
   */
  filter(predicate: (game: Game) => boolean): WishlistComparison {
    return new WishlistComparison(
      this.inBoth.filter(predicate),
      this.onlyInFirst.filter(predicate),
      this.onlyInSecond.filter(predicate),
      this.firstPlatform,
      this.secondPlatform
    );
  }
  
  /**
   * Removes duplicate games from the comparison
   */
  removeDuplicates(): WishlistComparison {
    const uniqueInBoth = Array.from(
      new Map(this.inBoth.map(g => [g.appId, g])).values()
    );
    const uniqueOnlyInFirst = Array.from(
      new Map(this.onlyInFirst.map(g => [g.appId, g])).values()
    );
    const uniqueOnlyInSecond = Array.from(
      new Map(this.onlyInSecond.map(g => [g.appId, g])).values()
    );
    
    return new WishlistComparison(
      uniqueInBoth,
      uniqueOnlyInFirst,
      uniqueOnlyInSecond,
      this.firstPlatform,
      this.secondPlatform
    );
  }
}

/**
 * Factory for creating comparison results
 */
export class ComparisonFactory {
  static create(
    inBoth: Game[],
    onlyInFirst: Game[],
    onlyInSecond: Game[],
    firstPlatform: string,
    secondPlatform: string
  ): WishlistComparison {
    return new WishlistComparison(
      inBoth,
      onlyInFirst,
      onlyInSecond,
      firstPlatform,
      secondPlatform
    );
  }
  
  static createEmpty(
    firstPlatform: string,
    secondPlatform: string
  ): WishlistComparison {
    return new WishlistComparison(
      [],
      [],
      [],
      firstPlatform,
      secondPlatform
    );
  }
}
