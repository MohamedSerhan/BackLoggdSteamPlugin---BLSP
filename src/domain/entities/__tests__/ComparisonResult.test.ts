import {
  ComparisonResult,
  WishlistComparison,
  ComparisonFactory,
} from '../ComparisonResult';
import { GameFactory } from '../Game';

describe('ComparisonResult Interface', () => {
  it('should have required properties', () => {
    const result: ComparisonResult = {
      both: [],
      onlyInFirst: [],
      onlyInSecond: [],
      metadata: {
        firstPlatform: 'steam',
        secondPlatform: 'backloggd',
        comparedAt: new Date(),
        totalGames: 0,
      },
    };

    expect(result.both).toEqual([]);
    expect(result.onlyInFirst).toEqual([]);
    expect(result.onlyInSecond).toEqual([]);
    expect(result.metadata.firstPlatform).toBe('steam');
    expect(result.metadata.secondPlatform).toBe('backloggd');
    expect(result.metadata.comparedAt).toBeInstanceOf(Date);
    expect(result.metadata.totalGames).toBe(0);
  });
});

describe('WishlistComparison', () => {
  // Test data
  const game1 = GameFactory.create(730, 'Counter-Strike');
  const game2 = GameFactory.create(570, 'Dota 2');
  const game3 = GameFactory.create(440, 'Team Fortress 2');
  const game4 = GameFactory.create(570, 'Dota 2 Duplicate'); // Same appId

  describe('constructor', () => {
    it('should create a comparison with all arrays', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      expect(comparison.inBoth).toHaveLength(1);
      expect(comparison.onlyInFirst).toHaveLength(1);
      expect(comparison.onlyInSecond).toHaveLength(1);
      expect(comparison.firstPlatform).toBe('steam');
      expect(comparison.secondPlatform).toBe('backloggd');
    });

    it('should handle empty arrays', () => {
      const comparison = new WishlistComparison(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.inBoth).toHaveLength(0);
      expect(comparison.onlyInFirst).toHaveLength(0);
      expect(comparison.onlyInSecond).toHaveLength(0);
    });
  });

  describe('totalUniqueGames', () => {
    it('should count all unique games across categories', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      expect(comparison.totalUniqueGames).toBe(3);
    });

    it('should return 0 for empty comparison', () => {
      const comparison = new WishlistComparison(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.totalUniqueGames).toBe(0);
    });

    it('should count games with multiple in each category', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [game3],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.totalUniqueGames).toBe(3);
    });
  });

  describe('matchCount', () => {
    it('should return the number of games in both', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [game3],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.matchCount).toBe(2);
    });

    it('should return 0 when no matches', () => {
      const comparison = new WishlistComparison(
        [],
        [game1],
        [game2],
        'steam',
        'backloggd'
      );

      expect(comparison.matchCount).toBe(0);
    });
  });

  describe('matchPercentage', () => {
    it('should calculate percentage of matching games', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      // 1 out of 3 = 33.33%
      expect(comparison.matchPercentage).toBeCloseTo(33.33, 2);
    });

    it('should return 0 for empty comparison', () => {
      const comparison = new WishlistComparison(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.matchPercentage).toBe(0);
    });

    it('should return 100 when all games match', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.matchPercentage).toBe(100);
    });

    it('should return 50 when half match', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.matchPercentage).toBe(50);
    });
  });

  describe('areIdentical', () => {
    it('should return true when all games are in both', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.areIdentical).toBe(true);
    });

    it('should return false when games only in first', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.areIdentical).toBe(false);
    });

    it('should return false when games only in second', () => {
      const comparison = new WishlistComparison(
        [game1],
        [],
        [game2],
        'steam',
        'backloggd'
      );

      expect(comparison.areIdentical).toBe(false);
    });

    it('should return true for empty wishlists', () => {
      const comparison = new WishlistComparison(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.areIdentical).toBe(true);
    });
  });

  describe('haveOverlap', () => {
    it('should return true when games exist in both', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      expect(comparison.haveOverlap).toBe(true);
    });

    it('should return false when no overlap', () => {
      const comparison = new WishlistComparison(
        [],
        [game1],
        [game2],
        'steam',
        'backloggd'
      );

      expect(comparison.haveOverlap).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should provide comprehensive statistics', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const stats = comparison.statistics;

      expect(stats.total).toBe(3);
      expect(stats.inBoth).toBe(1);
      expect(stats.onlyInFirst).toBe(1);
      expect(stats.onlyInSecond).toBe(1);
      expect(stats.matchPercentage).toBe('33.33%');
    });

    it('should format percentage as string with 2 decimals', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [game3],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.statistics.matchPercentage).toBe('66.67%');
    });
  });

  describe('toUserFriendlyFormat', () => {
    it('should convert to user-friendly format', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const friendly = comparison.toUserFriendlyFormat();

      expect(friendly['Add to BackLoggd Wishlist']).toEqual(['Dota 2']);
      expect(friendly['Add to Steam Wishlist']).toHaveLength(1);
      expect(friendly['Add to Steam Wishlist'][0].name).toBe('Team Fortress 2');
      expect(friendly['Already on Both']).toHaveLength(1);
      expect(friendly['Already on Both'][0].name).toBe('Counter-Strike');
    });

    it('should handle empty comparison', () => {
      const comparison = new WishlistComparison(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      const friendly = comparison.toUserFriendlyFormat();

      expect(friendly['Add to BackLoggd Wishlist']).toEqual([]);
      expect(friendly['Add to Steam Wishlist']).toEqual([]);
      expect(friendly['Already on Both']).toEqual([]);
    });
  });

  describe('toComparisonResult', () => {
    it('should convert to ComparisonResult interface', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const result = comparison.toComparisonResult();

      expect(result.both).toHaveLength(1);
      expect(result.onlyInFirst).toHaveLength(1);
      expect(result.onlyInSecond).toHaveLength(1);
      expect(result.metadata.firstPlatform).toBe('steam');
      expect(result.metadata.secondPlatform).toBe('backloggd');
      expect(result.metadata.totalGames).toBe(3);
      expect(result.metadata.comparedAt).toBeInstanceOf(Date);
    });

    it('should create new arrays (not references)', () => {
      const comparison = new WishlistComparison(
        [game1],
        [],
        [],
        'steam',
        'backloggd'
      );

      const result = comparison.toComparisonResult();

      // Should be able to modify result without affecting original
      result.both.push(game2);
      expect(comparison.inBoth).toHaveLength(1);
      expect(result.both).toHaveLength(2);
    });
  });

  describe('filter', () => {
    it('should filter games by predicate', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [game3],
        [],
        'steam',
        'backloggd'
      );

      const filtered = comparison.filter(g => g.appId > 500);

      expect(filtered.inBoth).toHaveLength(2);
      expect(filtered.onlyInFirst).toHaveLength(0);
    });

    it('should return new instance', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const filtered = comparison.filter(() => true);

      expect(filtered).not.toBe(comparison);
      expect(filtered.firstPlatform).toBe('steam');
      expect(filtered.secondPlatform).toBe('backloggd');
    });

    it('should filter across all categories', () => {
      const comparison = new WishlistComparison(
        [game1, game2],
        [game3],
        [game1],
        'steam',
        'backloggd'
      );

      const filtered = comparison.filter(g => g.appId === 730);

      expect(filtered.inBoth).toHaveLength(1);
      expect(filtered.onlyInFirst).toHaveLength(0);
      expect(filtered.onlyInSecond).toHaveLength(1);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicate games by appId', () => {
      const comparison = new WishlistComparison(
        [game2, game4], // Both have appId 570
        [game1, game1], // Duplicate
        [],
        'steam',
        'backloggd'
      );

      const deduplicated = comparison.removeDuplicates();

      expect(deduplicated.inBoth).toHaveLength(1);
      expect(deduplicated.onlyInFirst).toHaveLength(1);
    });

    it('should return new instance', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const deduplicated = comparison.removeDuplicates();

      expect(deduplicated).not.toBe(comparison);
    });

    it('should handle comparison with no duplicates', () => {
      const comparison = new WishlistComparison(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      const deduplicated = comparison.removeDuplicates();

      expect(deduplicated.totalUniqueGames).toBe(3);
    });
  });
});

describe('ComparisonFactory', () => {
  const game1 = GameFactory.create(730, 'Counter-Strike');
  const game2 = GameFactory.create(570, 'Dota 2');
  const game3 = GameFactory.create(440, 'Team Fortress 2');

  describe('create', () => {
    it('should create a WishlistComparison', () => {
      const comparison = ComparisonFactory.create(
        [game1],
        [game2],
        [game3],
        'steam',
        'backloggd'
      );

      expect(comparison).toBeInstanceOf(WishlistComparison);
      expect(comparison.inBoth).toHaveLength(1);
      expect(comparison.onlyInFirst).toHaveLength(1);
      expect(comparison.onlyInSecond).toHaveLength(1);
      expect(comparison.firstPlatform).toBe('steam');
      expect(comparison.secondPlatform).toBe('backloggd');
    });

    it('should handle empty arrays', () => {
      const comparison = ComparisonFactory.create(
        [],
        [],
        [],
        'steam',
        'backloggd'
      );

      expect(comparison.totalUniqueGames).toBe(0);
    });
  });

  describe('createEmpty', () => {
    it('should create an empty comparison', () => {
      const comparison = ComparisonFactory.createEmpty('steam', 'backloggd');

      expect(comparison).toBeInstanceOf(WishlistComparison);
      expect(comparison.inBoth).toHaveLength(0);
      expect(comparison.onlyInFirst).toHaveLength(0);
      expect(comparison.onlyInSecond).toHaveLength(0);
      expect(comparison.totalUniqueGames).toBe(0);
      expect(comparison.areIdentical).toBe(true);
    });

    it('should set platform names', () => {
      const comparison = ComparisonFactory.createEmpty('platform1', 'platform2');

      expect(comparison.firstPlatform).toBe('platform1');
      expect(comparison.secondPlatform).toBe('platform2');
    });
  });
});
