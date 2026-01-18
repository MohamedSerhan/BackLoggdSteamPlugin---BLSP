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

// Application
import { WishlistService } from './application/services/WishlistService';

// Presentation
import { ConsoleOutput } from './presentation/cli/ConsoleOutput';
import { HTMLReportGenerator } from './presentation/reports/HTMLReportGenerator';

// Exclusion Management
import { FileExclusionRepository } from './infrastructure/repositories/FileExclusionRepository';

/**
 * Main application function
 * Sets up dependencies and runs the wishlist comparison
 */
async function main(): Promise<void> {
  // Initialize presentation layer
  const console = new ConsoleOutput();
  const reportGenerator = new HTMLReportGenerator();
  
  try {
    console.info('Starting BackLoggdSteamPlugin - BLSP (Clean Architecture)...');
    
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
    console.info('Initializing infrastructure layer...');
    
    // API Clients
    const steamClient = new SteamAPIClient(steamId);
    const backloggdClient = new BackloggdAPIClient();
    
    // Repositories
    const wishlistRepository = new WishlistRepository(steamClient, backloggdClient);
    
    // Step 2: Set up domain layer
    console.info('Initializing domain layer...');
    const compareUseCase = new CompareWishlistsUseCase(0.2); // 20% fuzzy match threshold
    
    // Step 3: Set up application layer
    console.info('Initializing application layer...');
    const wishlistService = new WishlistService(wishlistRepository, compareUseCase);
    
    // Step 4: Set up exclusion repository
    console.info('Initializing exclusion repository...');
    const exclusionRepository = new FileExclusionRepository();
    
    // Step 5: Load excluded games
    console.info('Loading excluded games...');
    const excludedGames = await exclusionRepository.loadExcludedGames();
    const excludedAppIds = excludedGames.getAll()
      .map(game => game.appId)
      .filter((id): id is number => id !== null && id > 0);
    const excludedNames = excludedGames.getAll()
      .map(game => game.gameName);
    
    if (excludedGames.count() > 0) {
      console.info(`Found ${excludedGames.count()} excluded games`);
    }
    
    // Step 6: Run comparison
    console.info('Starting wishlist comparison...');
    const result = await wishlistService.compareWishlists(
      steamId,
      backloggdUsername,
      excludedAppIds,
      excludedNames
    );
    
    // Step 7: Generate HTML report
    console.info('Generating HTML report...');
    const reportPath = await reportGenerator.generateReport(result);
    
    // Step 8: Display summary
    console.success('✅ Wishlist comparison complete!');
    console.success(`📊 Summary:`);
    console.success(`   - Total unique games: ${result.statistics.totalGames}`);
    console.success(`   - Games in both wishlists: ${result.statistics.matchCount}`);
    console.success(`   - Only in Steam wishlist: ${result.statistics.onlyInFirst}`);
    console.success(`   - Only in Backloggd wishlist: ${result.statistics.onlyInSecond}`);
    console.success(`   - Match percentage: ${result.statistics.matchPercentage}`);
    console.success(`📄 Report generated: ${reportPath}`);
    
  } catch (error: any) {
    console.error('❌ Error running application:', error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
