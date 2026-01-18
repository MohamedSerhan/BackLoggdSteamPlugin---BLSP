/**
 * Domain Entity: ExcludedGame
 * Represents a game that has been excluded from wishlist comparisons
 */

/**
 * Excluded Game Entity
 * Represents a game that should be filtered out during comparison
 */
export interface ExcludedGame {
  readonly gameName: string;
  readonly appId: number | null;
  readonly reason: string;
  readonly excludedAt: Date;
}

/**
 * Collection of excluded games with utility methods
 */
export class ExcludedGameCollection {
  private readonly games: Map<string, ExcludedGame>;
  
  constructor(games: ExcludedGame[] = []) {
    this.games = new Map();
    games.forEach(game => {
      const key = this.getKey(game.gameName, game.appId);
      this.games.set(key, game);
    });
  }
  
  /**
   * Generate a unique key for a game
   */
  private getKey(gameName: string, appId: number | null): string {
    const normalizedName = gameName.toLowerCase().trim();
    return appId ? `${normalizedName}:${appId}` : normalizedName;
  }
  
  /**
   * Check if a game is excluded
   */
  isExcluded(gameName: string, appId?: number | null): boolean {
    // Check by exact match
    const key = this.getKey(gameName, appId || null);
    if (this.games.has(key)) {
      return true;
    }
    
    // Check by name only
    const nameKey = this.getKey(gameName, null);
    if (this.games.has(nameKey)) {
      return true;
    }
    
    // Check by appId only if provided
    if (appId) {
      for (const game of this.games.values()) {
        if (game.appId === appId) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Add a game to exclusions
   */
  add(gameName: string, appId: number | null, reason: string = ''): ExcludedGameCollection {
    const key = this.getKey(gameName, appId);
    
    // Don't add if already exists
    if (this.games.has(key)) {
      return this;
    }
    
    const newGame: ExcludedGame = {
      gameName: gameName.trim(),
      appId,
      reason: reason.trim(),
      excludedAt: new Date()
    };
    
    const newGames = new Map(this.games);
    newGames.set(key, newGame);
    
    return new ExcludedGameCollection(Array.from(newGames.values()));
  }
  
  /**
   * Remove a game from exclusions
   */
  remove(gameName: string, appId: number | null): ExcludedGameCollection {
    const key = this.getKey(gameName, appId);
    
    if (!this.games.has(key)) {
      return this;
    }
    
    const newGames = new Map(this.games);
    newGames.delete(key);
    
    return new ExcludedGameCollection(Array.from(newGames.values()));
  }
  
  /**
   * Get all excluded games
   */
  getAll(): ExcludedGame[] {
    return Array.from(this.games.values());
  }
  
  /**
   * Get count of excluded games
   */
  count(): number {
    return this.games.size;
  }
  
  /**
   * Filter a list of games by removing excluded ones
   */
  filterGames<T extends { name: string; appId?: number | null }>(games: T[]): T[] {
    return games.filter(game => !this.isExcluded(game.name, game.appId));
  }
}

/**
 * Factory for creating excluded game entities
 */
export class ExcludedGameFactory {
  /**
   * Create an ExcludedGame from raw data
   */
  static create(
    gameName: string,
    appId: number | null,
    reason: string = '',
    excludedAt?: Date
  ): ExcludedGame {
    if (!gameName || gameName.trim().length === 0) {
      throw new Error('Game name cannot be empty');
    }
    
    return {
      gameName: gameName.trim(),
      appId: appId,
      reason: reason.trim(),
      excludedAt: excludedAt || new Date()
    };
  }
  
  /**
   * Create from legacy format
   */
  static fromLegacy(data: any): ExcludedGame {
    return this.create(
      data.gameName,
      data.appId || null,
      data.reason || '',
      data.excludedAt ? new Date(data.excludedAt) : undefined
    );
  }
}
