import { CompareWishlistsUseCase } from '../CompareWishlists';
import { WishlistFactory } from '../../entities/Wishlist';
import { GameFactory } from '../../entities/Game';

describe('CompareWishlistsUseCase', () => {
  let useCase: CompareWishlistsUseCase;

  beforeEach(() => {
    useCase = new CompareWishlistsUseCase(0.2);
  });

  describe('execute', () => {
    it('should compare two empty wishlists', () => {
      const first = WishlistFactory.createEmpty('steam', 'user1');
      const second = WishlistFactory.createEmpty('backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.inBoth).toHaveLength(0);
      expect(result.comparison.onlyInFirst).toHaveLength(0);
      expect(result.comparison.onlyInSecond).toHaveLength(0);
      expect(result.statistics.totalGames).toBe(0);
      expect(result.statistics.matchPercentage).toBe('0.00%');
    });

    it('should find exact matches between wishlists', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter-Strike');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.inBoth).toHaveLength(1);
      expect(result.comparison.onlyInFirst).toHaveLength(0);
      expect(result.comparison.onlyInSecond).toHaveLength(0);
      expect(result.statistics.matchCount).toBe(1);
      expect(result.statistics.matchPercentage).toBe('100.00%');
    });

    it('should find fuzzy matches between wishlists', () => {
      // Use names that are actually similar enough to match with 0.2 threshold
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter Strike'); // Very similar, just punctuation

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.inBoth).toHaveLength(1);
      expect(result.comparison.inBoth[0].name).toBe('Counter-Strike');
    });

    it('should identify games only in first wishlist', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');

      const first = WishlistFactory.createFromGames([game1, game2], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.onlyInFirst).toHaveLength(1);
      expect(result.comparison.onlyInFirst[0].name).toBe('Counter-Strike');
      expect(result.statistics.onlyInFirst).toBe(1);
    });

    it('should identify games only in second wishlist', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game1, game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.onlyInSecond).toHaveLength(1);
      expect(result.comparison.onlyInSecond[0].name).toBe('Dota 2');
      expect(result.statistics.onlyInSecond).toBe(1);
    });

    it('should filter out excluded games by appId', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');
      const game3 = GameFactory.create(440, 'Team Fortress 2');

      const first = WishlistFactory.createFromGames([game1, game2], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game3], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
        excludedAppIds: [730], // Exclude Counter-Strike
      });

      // Counter-Strike should be filtered out
      expect(result.comparison.onlyInFirst).toHaveLength(1);
      expect(result.comparison.onlyInFirst[0].name).toBe('Dota 2');
    });

    it('should remove duplicate games from results', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game1Dup = GameFactory.create(730, 'CS:GO'); // Same appId
      const game2 = GameFactory.create(730, 'Counter Strike');

      const first = WishlistFactory.createFromGames(
        [game1, game1Dup],
        'steam',
        'user1'
      );
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      // Should only have one game in "both" despite duplicates
      expect(result.comparison.inBoth).toHaveLength(1);
    });

    it('should use custom fuzzy match threshold', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter Strike'); // Similar names

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      // With strict threshold (0.05), these should NOT match
      const strictResult = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
        fuzzyMatchThreshold: 0.05,
      });

      expect(strictResult.comparison.inBoth).toHaveLength(0);

      // With lenient threshold (0.3), they should match
      const lenientResult = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
        fuzzyMatchThreshold: 0.3,
      });

      expect(lenientResult.comparison.inBoth).toHaveLength(1);
    });

    it('should calculate statistics correctly', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');
      const game3 = GameFactory.create(440, 'Team Fortress 2');
      const game4 = GameFactory.create(620, 'Portal 2');

      const first = WishlistFactory.createFromGames(
        [game1, game2, game3],
        'steam',
        'user1'
      );
      const second = WishlistFactory.createFromGames(
        [game1, game4],
        'backloggd',
        'user2'
      );

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.statistics.totalGames).toBe(4);
      expect(result.statistics.matchCount).toBe(1);
      expect(result.statistics.onlyInFirst).toBe(2);
      expect(result.statistics.onlyInSecond).toBe(1);
      expect(result.statistics.matchPercentage).toBe('25.00%');
    });

    it('should handle wishlists with no matches', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.inBoth).toHaveLength(0);
      expect(result.comparison.onlyInFirst).toHaveLength(1);
      expect(result.comparison.onlyInSecond).toHaveLength(1);
      expect(result.statistics.matchPercentage).toBe('0.00%');
    });

    it('should preserve platform information in comparison', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game1], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.firstPlatform).toBe('steam');
      expect(result.comparison.secondPlatform).toBe('backloggd');
    });

    it('should handle large wishlists efficiently', () => {
      // Create 100 unique games for first wishlist
      const firstGames = Array.from({ length: 100 }, (_, i) =>
        GameFactory.create(i, `First-${i}-${Math.random().toString(36).substring(7)}`)
      );
      
      // Create 100 unique games for second wishlist (no matches)
      const secondGames = Array.from({ length: 100 }, (_, i) =>
        GameFactory.create(i + 100, `Second-${i}-${Math.random().toString(36).substring(7)}`)
      );

      const first = WishlistFactory.createFromGames(firstGames, 'steam', 'user1');
      const second = WishlistFactory.createFromGames(secondGames, 'backloggd', 'user2');

      const startTime = Date.now();
      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });
      const endTime = Date.now();

      // Should complete quickly (under 1 second for 200 games)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should have processed all games
      expect(result.statistics.totalGames).toBe(200);
      expect(result.comparison.onlyInFirst).toHaveLength(100);
      expect(result.comparison.onlyInSecond).toHaveLength(100);
      expect(result.comparison.inBoth).toHaveLength(0);
    });

    it('should use default fuzzy threshold when not provided', () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter Strike');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
        // No threshold provided, should use default 0.2
      });

      // Should match with default threshold
      expect(result.comparison.inBoth).toHaveLength(1);
    });
  });

  describe('constructor', () => {
    it('should use default fuzzy match threshold', () => {
      const useCase = new CompareWishlistsUseCase();
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter Strike');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = useCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      expect(result.comparison.inBoth).toHaveLength(1);
    });

    it('should accept custom default fuzzy match threshold', () => {
      const strictUseCase = new CompareWishlistsUseCase(0.05); // Very strict
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(730, 'Counter Strike');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const result = strictUseCase.execute({
        firstWishlist: first,
        secondWishlist: second,
      });

      // With very strict threshold (0.05), minor differences prevent matching
      expect(result.comparison.inBoth).toHaveLength(0);
    });
  });
});
