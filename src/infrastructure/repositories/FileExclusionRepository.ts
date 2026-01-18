/**
 * File-based Exclusion Repository Implementation
 * Persists excluded games to JSON file
 */

import { IExclusionRepository, ExclusionOperationResult } from './IExclusionRepository';
import { ExcludedGameCollection, ExcludedGameFactory } from '../../domain/entities/ExcludedGame';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Persisted data structure for excluded games
 */
interface ExclusionFileData {
  excludedGames: Array<{
    gameName: string;
    appId: number | null;
    reason: string;
    excludedAt: string;
  }>;
  lastUpdated: string;
}

/**
 * File-based repository for excluded games
 * Stores exclusions in a JSON file for persistence
 */
export class FileExclusionRepository implements IExclusionRepository {
  private readonly filePath: string;
  
  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'excludedGames.json');
  }
  
  /**
   * Load excluded games from file
   */
  async loadExcludedGames(): Promise<ExcludedGameCollection> {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: ExclusionFileData = JSON.parse(data);
        
        const games = parsed.excludedGames.map(game => 
          ExcludedGameFactory.fromLegacy(game)
        );
        
        return new ExcludedGameCollection(games);
      }
    } catch (error) {
      console.warn(`Failed to load excluded games: ${error}`);
    }
    
    return new ExcludedGameCollection([]);
  }
  
  /**
   * Save excluded games collection to file
   */
  async saveExcludedGames(collection: ExcludedGameCollection): Promise<boolean> {
    try {
      const data: ExclusionFileData = {
        excludedGames: collection.getAll().map(game => ({
          gameName: game.gameName,
          appId: game.appId,
          reason: game.reason,
          excludedAt: game.excludedAt.toISOString()
        })),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to save excluded games: ${error}`);
      return false;
    }
  }
  
  /**
   * Add a game to exclusions
   */
  async excludeGame(
    gameName: string,
    appId: number | null,
    reason: string = ''
  ): Promise<ExclusionOperationResult> {
    const collection = await this.loadExcludedGames();
    
    // Check if already excluded
    if (collection.isExcluded(gameName, appId)) {
      return {
        success: false,
        message: `Game "${gameName}" is already excluded`
      };
    }
    
    // Add to collection
    const updated = collection.add(gameName, appId, reason);
    
    // Save
    const saved = await this.saveExcludedGames(updated);
    
    if (saved) {
      return {
        success: true,
        message: `Game "${gameName}" has been excluded`
      };
    }
    
    return {
      success: false,
      message: 'Failed to save exclusion'
    };
  }
  
  /**
   * Remove a game from exclusions
   */
  async unexcludeGame(
    gameName: string,
    appId: number | null
  ): Promise<ExclusionOperationResult> {
    const collection = await this.loadExcludedGames();
    
    // Check if excluded
    if (!collection.isExcluded(gameName, appId)) {
      return {
        success: false,
        message: `Game "${gameName}" is not in the exclusion list`
      };
    }
    
    // Remove from collection
    const updated = collection.remove(gameName, appId);
    
    // Save
    const saved = await this.saveExcludedGames(updated);
    
    if (saved) {
      return {
        success: true,
        message: `Game "${gameName}" has been included`
      };
    }
    
    return {
      success: false,
      message: 'Failed to save inclusion'
    };
  }
  
  /**
   * Check if a game is excluded
   */
  async isGameExcluded(gameName: string, appId?: number | null): Promise<boolean> {
    const collection = await this.loadExcludedGames();
    return collection.isExcluded(gameName, appId);
  }
}
