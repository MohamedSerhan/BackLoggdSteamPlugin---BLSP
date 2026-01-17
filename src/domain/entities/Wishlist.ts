/**
 * Domain Entity: Wishlist
 * Represents a user's wishlist on a platform
 */

import { Game } from './Game';

export interface Wishlist {
  /** Platform identifier (steam, backloggd) */
  platform: 'steam' | 'backloggd';
  
  /** User identifier on the platform */
  userId: string;
  
  /** Games in the wishlist */
  games: Game[];
  
  /** When the wishlist was last fetched */
  lastUpdated: Date;
}

export type WishlistType = 'wishlist' | 'backlog';

/**
 * Wishlist Value Object
 * Immutable collection of games with operations
 */
export class WishlistCollection {
  constructor(
    private readonly games: ReadonlyArray<Game>,
    public readonly platform: 'steam' | 'backloggd',
    public readonly userId: string
  ) {}
  
  get count(): number {
    return this.games.length;
  }
  
  get items(): ReadonlyArray<Game> {
    return this.games;
  }
  
  /**
   * Finds a game by app ID
   */
  findByAppId(appId: number): Game | undefined {
    return this.games.find(g => g.appId === appId);
  }
  
  /**
   * Finds games by name (exact match)
   */
  findByName(name: string): Game[] {
    return this.games.filter(g => 
      g.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  /**
   * Checks if a game exists in the wishlist
   */
  contains(game: Game): boolean {
    return this.games.some(g => g.appId === game.appId);
  }
  
  /**
   * Checks if a game exists by app ID
   */
  containsAppId(appId: number): boolean {
    return this.games.some(g => g.appId === appId);
  }
  
  /**
   * Adds a game to the wishlist (returns new instance)
   */
  add(game: Game): WishlistCollection {
    if (this.contains(game)) {
      return this;
    }
    return new WishlistCollection(
      [...this.games, game],
      this.platform,
      this.userId
    );
  }
  
  /**
   * Removes a game from the wishlist (returns new instance)
   */
  remove(game: Game): WishlistCollection {
    return new WishlistCollection(
      this.games.filter(g => g.appId !== game.appId),
      this.platform,
      this.userId
    );
  }
  
  /**
   * Filters games by a predicate
   */
  filter(predicate: (game: Game) => boolean): WishlistCollection {
    return new WishlistCollection(
      this.games.filter(predicate),
      this.platform,
      this.userId
    );
  }
  
  /**
   * Maps games to another type
   */
  map<T>(mapper: (game: Game) => T): T[] {
    return this.games.map(mapper);
  }
  
  /**
   * Gets all app IDs
   */
  getAppIds(): number[] {
    return this.games.map(g => g.appId);
  }
  
  /**
   * Gets all game names
   */
  getNames(): string[] {
    return this.games.map(g => g.name);
  }
  
  /**
   * Merges with another wishlist (returns new instance)
   */
  merge(other: WishlistCollection): WishlistCollection {
    const mergedGames = [...this.games];
    
    other.items.forEach(game => {
      if (!this.containsAppId(game.appId)) {
        mergedGames.push(game);
      }
    });
    
    return new WishlistCollection(
      mergedGames,
      this.platform,
      this.userId
    );
  }
  
  /**
   * Returns games that exist in this wishlist but not in another
   */
  difference(other: WishlistCollection): WishlistCollection {
    return this.filter(game => !other.containsAppId(game.appId));
  }
  
  /**
   * Returns games that exist in both wishlists
   */
  intersection(other: WishlistCollection): WishlistCollection {
    return this.filter(game => other.containsAppId(game.appId));
  }
  
  /**
   * Converts to plain array
   */
  toArray(): Game[] {
    return [...this.games];
  }
  
  /**
   * Converts to Wishlist interface
   */
  toWishlist(): Wishlist {
    return {
      platform: this.platform,
      userId: this.userId,
      games: this.toArray(),
      lastUpdated: new Date()
    };
  }
}

/**
 * Factory for creating Wishlist collections
 */
export class WishlistFactory {
  static createEmpty(
    platform: 'steam' | 'backloggd',
    userId: string
  ): WishlistCollection {
    return new WishlistCollection([], platform, userId);
  }
  
  static createFromGames(
    games: Game[],
    platform: 'steam' | 'backloggd',
    userId: string
  ): WishlistCollection {
    return new WishlistCollection(games, platform, userId);
  }
  
  static createFromWishlist(wishlist: Wishlist): WishlistCollection {
    return new WishlistCollection(
      wishlist.games,
      wishlist.platform,
      wishlist.userId
    );
  }
}
