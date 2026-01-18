import {
  ExcludedGame,
  ExcludedGameCollection,
  ExcludedGameFactory,
} from '../ExcludedGame';

describe('ExcludedGame Interface', () => {
  it('should have required properties', () => {
    const excluded: ExcludedGame = {
      gameName: 'Test Game',
      appId: 123,
      reason: 'misidentified',
      excludedAt: new Date(),
    };

    expect(excluded.gameName).toBe('Test Game');
    expect(excluded.appId).toBe(123);
    expect(excluded.reason).toBe('misidentified');
    expect(excluded.excludedAt).toBeInstanceOf(Date);
  });

  it('should allow null appId', () => {
    const excluded: ExcludedGame = {
      gameName: 'Test Game',
      appId: null,
      reason: 'test',
      excludedAt: new Date(),
    };

    expect(excluded.appId).toBeNull();
  });
});

describe('ExcludedGameCollection', () => {
  describe('constructor', () => {
    it('should create an empty collection', () => {
      const collection = new ExcludedGameCollection();
      expect(collection.count()).toBe(0);
    });

    it('should create collection from array of games', () => {
      const games: ExcludedGame[] = [
        {
          gameName: 'Game 1',
          appId: 123,
          reason: 'test',
          excludedAt: new Date(),
        },
        {
          gameName: 'Game 2',
          appId: null,
          reason: 'test',
          excludedAt: new Date(),
        },
      ];

      const collection = new ExcludedGameCollection(games);
      expect(collection.count()).toBe(2);
    });
  });

  describe('isExcluded', () => {
    const games: ExcludedGame[] = [
      {
        gameName: 'Counter-Strike',
        appId: 730,
        reason: 'test',
        excludedAt: new Date(),
      },
      {
        gameName: 'Dota 2',
        appId: null,
        reason: 'test',
        excludedAt: new Date(),
      },
    ];
    const collection = new ExcludedGameCollection(games);

    it('should return true for excluded game by name and appId', () => {
      expect(collection.isExcluded('Counter-Strike', 730)).toBe(true);
    });

    it('should return true for excluded game by name only', () => {
      expect(collection.isExcluded('Dota 2')).toBe(true);
      expect(collection.isExcluded('Dota 2', 999)).toBe(true);
    });

    it('should return true for excluded game by appId match', () => {
      expect(collection.isExcluded('CS:GO', 730)).toBe(true);
    });

    it('should return false for non-excluded game', () => {
      expect(collection.isExcluded('Team Fortress 2', 440)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(collection.isExcluded('COUNTER-STRIKE', 730)).toBe(true);
      expect(collection.isExcluded('dota 2')).toBe(true);
    });

    it('should handle whitespace in names', () => {
      expect(collection.isExcluded('  Counter-Strike  ', 730)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add a game to exclusions', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.add('Test Game', 123, 'misidentified');

      expect(updated.count()).toBe(1);
      expect(updated.isExcluded('Test Game', 123)).toBe(true);
      expect(collection.count()).toBe(0); // Original unchanged
    });

    it('should trim game name and reason', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.add('  Test Game  ', 123, '  reason  ');

      const games = updated.getAll();
      expect(games[0].gameName).toBe('Test Game');
      expect(games[0].reason).toBe('reason');
    });

    it('should not add duplicate games', () => {
      const collection = new ExcludedGameCollection();
      const updated1 = collection.add('Test Game', 123, 'reason');
      const updated2 = updated1.add('Test Game', 123, 'different reason');

      expect(updated2.count()).toBe(1);
      expect(updated2).toBe(updated1); // Returns same instance
    });

    it('should handle null appId', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.add('Test Game', null, 'reason');

      expect(updated.isExcluded('Test Game')).toBe(true);
    });

    it('should set excludedAt to current time', () => {
      const collection = new ExcludedGameCollection();
      const before = new Date();
      const updated = collection.add('Test Game', 123);
      const after = new Date();

      const game = updated.getAll()[0];
      expect(game.excludedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(game.excludedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should use empty string for reason if not provided', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.add('Test Game', 123);

      const game = updated.getAll()[0];
      expect(game.reason).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove a game from exclusions', () => {
      const games: ExcludedGame[] = [
        {
          gameName: 'Game 1',
          appId: 123,
          reason: 'test',
          excludedAt: new Date(),
        },
        {
          gameName: 'Game 2',
          appId: 456,
          reason: 'test',
          excludedAt: new Date(),
        },
      ];
      const collection = new ExcludedGameCollection(games);
      const updated = collection.remove('Game 1', 123);

      expect(updated.count()).toBe(1);
      expect(updated.isExcluded('Game 1', 123)).toBe(false);
      expect(updated.isExcluded('Game 2', 456)).toBe(true);
      expect(collection.count()).toBe(2); // Original unchanged
    });

    it('should return same instance if game not found', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.remove('Nonexistent', 999);

      expect(updated).toBe(collection);
    });

    it('should handle removing by name and null appId', () => {
      const games: ExcludedGame[] = [
        {
          gameName: 'Game 1',
          appId: null,
          reason: 'test',
          excludedAt: new Date(),
        },
      ];
      const collection = new ExcludedGameCollection(games);
      const updated = collection.remove('Game 1', null);

      expect(updated.count()).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all excluded games', () => {
      const games: ExcludedGame[] = [
        {
          gameName: 'Game 1',
          appId: 123,
          reason: 'test',
          excludedAt: new Date(),
        },
        {
          gameName: 'Game 2',
          appId: 456,
          reason: 'test',
          excludedAt: new Date(),
        },
      ];
      const collection = new ExcludedGameCollection(games);
      const all = collection.getAll();

      expect(all).toHaveLength(2);
      expect(all[0].gameName).toBe('Game 1');
      expect(all[1].gameName).toBe('Game 2');
    });

    it('should return empty array for empty collection', () => {
      const collection = new ExcludedGameCollection();
      expect(collection.getAll()).toEqual([]);
    });

    it('should return a new array (not internal map)', () => {
      const collection = new ExcludedGameCollection();
      const updated = collection.add('Test', 123);
      const all1 = updated.getAll();
      const all2 = updated.getAll();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });

  describe('count', () => {
    it('should return the number of excluded games', () => {
      const games: ExcludedGame[] = [
        {
          gameName: 'Game 1',
          appId: 123,
          reason: 'test',
          excludedAt: new Date(),
        },
        {
          gameName: 'Game 2',
          appId: 456,
          reason: 'test',
          excludedAt: new Date(),
        },
      ];
      const collection = new ExcludedGameCollection(games);

      expect(collection.count()).toBe(2);
    });

    it('should return 0 for empty collection', () => {
      const collection = new ExcludedGameCollection();
      expect(collection.count()).toBe(0);
    });
  });

  describe('filterGames', () => {
    const excludedGames: ExcludedGame[] = [
      {
        gameName: 'Counter-Strike',
        appId: null, // Excluded by name only
        reason: 'test',
        excludedAt: new Date(),
      },
      {
        gameName: 'Dota 2',
        appId: null,
        reason: 'test',
        excludedAt: new Date(),
      },
    ];
    const collection = new ExcludedGameCollection(excludedGames);

    it('should filter out excluded games', () => {
      const games = [
        { name: 'Counter-Strike', appId: 730 },
        { name: 'Team Fortress 2', appId: 440 },
        { name: 'Dota 2', appId: 570 },
      ];

      const filtered = collection.filterGames(games);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Team Fortress 2');
    });

    it('should return all games if none are excluded', () => {
      const emptyCollection = new ExcludedGameCollection();
      const games = [
        { name: 'Game 1', appId: 1 },
        { name: 'Game 2', appId: 2 },
      ];

      const filtered = emptyCollection.filterGames(games);

      expect(filtered).toEqual(games);
    });

    it('should handle games without appId', () => {
      const games = [
        { name: 'Counter-Strike' },
        { name: 'Team Fortress 2' },
        { name: 'Dota 2' },
      ];

      const filtered = collection.filterGames(games);

      // Counter-Strike matches by name (with appId 730), Dota 2 matches by name (appId null)
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Team Fortress 2');
    });

    it('should return empty array if all games excluded', () => {
      const games = [
        { name: 'Counter-Strike', appId: 730 },
        { name: 'Dota 2', appId: 570 },
      ];

      const filtered = collection.filterGames(games);

      expect(filtered).toEqual([]);
    });
  });
});

describe('ExcludedGameFactory', () => {
  describe('create', () => {
    it('should create an ExcludedGame', () => {
      const game = ExcludedGameFactory.create('Test Game', 123, 'misidentified');

      expect(game.gameName).toBe('Test Game');
      expect(game.appId).toBe(123);
      expect(game.reason).toBe('misidentified');
      expect(game.excludedAt).toBeInstanceOf(Date);
    });

    it('should trim game name and reason', () => {
      const game = ExcludedGameFactory.create('  Test Game  ', 123, '  reason  ');

      expect(game.gameName).toBe('Test Game');
      expect(game.reason).toBe('reason');
    });

    it('should use empty string for reason if not provided', () => {
      const game = ExcludedGameFactory.create('Test Game', 123);

      expect(game.reason).toBe('');
    });

    it('should allow null appId', () => {
      const game = ExcludedGameFactory.create('Test Game', null, 'reason');

      expect(game.appId).toBeNull();
    });

    it('should set excludedAt to current time if not provided', () => {
      const before = new Date();
      const game = ExcludedGameFactory.create('Test Game', 123);
      const after = new Date();

      expect(game.excludedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(game.excludedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should use provided excludedAt date', () => {
      const customDate = new Date('2023-01-01');
      const game = ExcludedGameFactory.create('Test Game', 123, 'reason', customDate);

      expect(game.excludedAt).toBe(customDate);
    });

    it('should throw error for empty game name', () => {
      expect(() => ExcludedGameFactory.create('', 123)).toThrow('Game name cannot be empty');
    });

    it('should throw error for whitespace-only game name', () => {
      expect(() => ExcludedGameFactory.create('   ', 123)).toThrow('Game name cannot be empty');
    });
  });

  describe('fromLegacy', () => {
    it('should create ExcludedGame from legacy data', () => {
      const legacyData = {
        gameName: 'Test Game',
        appId: 123,
        reason: 'misidentified',
        excludedAt: '2023-01-01T00:00:00.000Z',
      };

      const game = ExcludedGameFactory.fromLegacy(legacyData);

      expect(game.gameName).toBe('Test Game');
      expect(game.appId).toBe(123);
      expect(game.reason).toBe('misidentified');
      expect(game.excludedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
      const legacyData = {
        gameName: 'Test Game',
      };

      const game = ExcludedGameFactory.fromLegacy(legacyData);

      expect(game.gameName).toBe('Test Game');
      expect(game.appId).toBeNull();
      expect(game.reason).toBe('');
      expect(game.excludedAt).toBeInstanceOf(Date);
    });

    it('should parse excludedAt date string', () => {
      const legacyData = {
        gameName: 'Test Game',
        appId: 123,
        excludedAt: '2023-06-15T12:00:00.000Z',
      };

      const game = ExcludedGameFactory.fromLegacy(legacyData);

      expect(game.excludedAt.getFullYear()).toBe(2023);
      expect(game.excludedAt.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(game.excludedAt.getDate()).toBe(15);
    });
  });
});
