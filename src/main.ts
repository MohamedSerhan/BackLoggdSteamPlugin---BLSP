/**
 * Main Entry Point
 * Sets up dependency injection and runs the application
 */

require('dotenv').config();

// Infrastructure
import { SteamAPIClient } from './infrastructure/apis/SteamAPIClient';
import { BackloggdAPIClient } from './infrastructure/apis/BackloggdAPIClient';
import { WishlistRepository } from './infrastructure/repositories/WishlistRepository';

// Domain
import { CompareWishlistsUseCase } from './domain/usecases/CompareWishlists';
import { Game } from './domain/entities/Game';

// Application
import { WishlistService } from './application/services/WishlistService';

// Legacy imports for exclusion and report generation
const { loadExcludedGames } = require('../exclusionManager');
const { generateHTMLReport } = require('../reportPage');
const { logInfo, logSuccess, logError } = require('../services/logColors');

/**
 * Main application function
 * Sets up dependencies and runs the wishlist comparison
 */
async function main(): Promise<void> {
  try {
    logInfo('Starting BackLoggdSteamPlugin - BLSP (New Architecture)...');
    
    // Load environment variables
    const steamId = process.env.STEAM_ID;
    const backloggdUsername = process.env.BACKLOGGD_USERNAME;
    
    if (!steamId) {
      throw new Error('STEAM_ID environment variable is required');
    }
    
    if (!backloggdUsername) {
      throw new Error('BACKLOGGD_USERNAME environment variable is required');
    }
    
    // Step 1: Set up infrastructure dependencies
    logInfo('Initializing infrastructure layer...');
    
    // API Clients
    const steamClient = new SteamAPIClient(steamId);
    const backloggdClient = new BackloggdAPIClient();
    
    // Repositories
    const wishlistRepository = new WishlistRepository(steamClient, backloggdClient);
    
    // Note: gameRepository created for future use (not needed for current comparison)
    // const gameRepository = new GameRepository(gameCache, steamClient);
    
    // Step 2: Set up domain layer
    logInfo('Initializing domain layer...');
    const compareUseCase = new CompareWishlistsUseCase(0.2); // 20% fuzzy match threshold
    
    // Step 3: Set up application layer
    logInfo('Initializing application layer...');
    const wishlistService = new WishlistService(wishlistRepository, compareUseCase);
    
    // Step 4: Load excluded games
    logInfo('Loading excluded games...');
    const excludedData = loadExcludedGames();
    const excludedAppIds = excludedData.excludedGames
      .map((game: any) => game.appId)
      .filter((id: number) => id > 0);
    
    if (excludedAppIds.length > 0) {
      logInfo(`Found ${excludedAppIds.length} excluded games`);
    }
    
    // Step 5: Run comparison
    logInfo('Starting wishlist comparison...');
    const result = await wishlistService.compareWishlists(
      steamId,
      backloggdUsername,
      excludedAppIds
    );
    
    // Step 6: Transform results to legacy format for report generation
    logInfo('Transforming results for report generation...');
    const legacyFormat = {
      'Add to BackLoggd Wishlist': result.comparison.onlyInFirst.map((game: Game) => ({
        steamName: game.name,
        appId: game.appId
      })),
      'Add to Steam Wishlist': result.comparison.onlyInSecond.map((game: Game) => ({
        steamName: game.name,
        appId: game.appId
      })),
      'Already on Both': result.comparison.inBoth.map((game: Game) => ({
        steamName: game.name,
        appId: game.appId
      }))
    };
    
    // Step 7: Generate HTML report
    logInfo('Generating HTML report...');
    generateHTMLReport(legacyFormat);
    
    // Step 8: Display summary
    logSuccess('✅ Wishlist comparison complete!');
    logSuccess(`📊 Summary:`);
    logSuccess(`   - Total unique games: ${result.statistics.totalGames}`);
    logSuccess(`   - Games in both wishlists: ${result.statistics.matchCount}`);
    logSuccess(`   - Only in Steam: ${result.statistics.onlyInFirst}`);
    logSuccess(`   - Only in Backloggd: ${result.statistics.onlyInSecond}`);
    logSuccess(`   - Match percentage: ${result.statistics.matchPercentage}`);
    logSuccess('📄 Report generated: wishlistReport.html');
    
  } catch (error: any) {
    logError('❌ Error running application:');
    logError(error.message);
    if (error.stack) {
      logError('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(error => {
    logError('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
