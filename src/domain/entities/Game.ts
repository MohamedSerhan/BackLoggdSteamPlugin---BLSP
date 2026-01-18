/**
 * Domain Entity: Game
 * Represents a game across all platforms (Steam, Backloggd, etc.)
 */

export interface Game {
  /** Unique identifier (usually Steam App ID) */
  appId: number;
  
  /** Display name of the game */
  name: string;
  
  /** Optional: Platform-specific identifiers */
  platformIds?: {
    steam?: number;
    backloggd?: string;
  };
  
  /** Optional: Additional metadata */
  metadata?: {
    developer?: string;
    publisher?: string;
    releaseDate?: Date;
    tags?: string[];
  };
}

/**
 * Value Object: Game Name
 * Handles game name normalization and comparison
 */
export class GameName {
  private readonly normalized: string;
  
  constructor(private readonly rawName: string) {
    this.normalized = this.normalize(rawName);
  }
  
  /**
   * Normalizes game names for consistent comparison
   * Removes special characters, common edition suffixes, standardizes formatting
   */
  private normalize(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFC")
      .replace(/^number\b/, '#')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\band\b/g, '&')
      .replace(/\bvi\b/g, '6')
      .replace(/\bonline\b/g, '')
      .replace(/\bedition\b/g, '')
      .replace(/\bremastered\b/g, '')
      .replace(/\bdefinitive\b/g, '')
      .replace(/\bgame of the year\b/g, '')
      .trim();
  }
  
  get value(): string {
    return this.rawName;
  }
  
  get normalizedValue(): string {
    return this.normalized;
  }
  
  /**
   * Determines if two game names are similar using fuzzy matching
   * Uses Levenshtein distance with a 20% threshold
   */
  isSimilarTo(other: GameName, threshold: number = 0.2): boolean {
    const levenshtein = require('fast-levenshtein');
    const distance = levenshtein.get(this.normalized, other.normalized);
    const maxLength = Math.max(this.normalized.length, other.normalized.length);
    return distance <= (maxLength * threshold);
  }
  
  equals(other: GameName): boolean {
    return this.normalized === other.normalized;
  }
  
  toString(): string {
    return this.rawName;
  }
}

/**
 * Factory for creating Game entities
 */
export class GameFactory {
  static createFromSteam(appId: number, name: string): Game {
    return {
      appId,
      name,
      platformIds: {
        steam: appId
      }
    };
  }
  
  static createFromBackloggd(name: string, steamAppId?: number): Game {
    return {
      appId: steamAppId || 0,
      name,
      platformIds: {
        steam: steamAppId
      }
    };
  }
  
  static create(appId: number, name: string): Game {
    return {
      appId,
      name
    };
  }
}
