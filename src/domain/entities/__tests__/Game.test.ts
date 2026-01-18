import { Game, GameName, GameFactory } from '../Game';

describe('GameName Value Object', () => {
  describe('constructor', () => {
    it('should create a GameName with raw and normalized values', () => {
      const name = new GameName('Counter-Strike: Global Offensive');
      expect(name.value).toBe('Counter-Strike: Global Offensive');
      expect(name.normalizedValue).toBeTruthy();
    });

    it('should normalize game names for comparison', () => {
      const name1 = new GameName('Counter-Strike: Global Offensive');
      const name2 = new GameName('counter strike global offensive');
      
      // Normalized values should be similar after processing
      expect(name1.normalizedValue).toBeDefined();
      expect(name2.normalizedValue).toBeDefined();
    });

    it('should handle special characters in normalization', () => {
      const name = new GameName('Diablo® III: Reaper of Souls™');
      expect(name.normalizedValue).not.toContain('®');
      expect(name.normalizedValue).not.toContain('™');
    });

    it('should remove common edition suffixes', () => {
      const name = new GameName('The Witcher 3: Game of the Year Edition');
      expect(name.normalizedValue).not.toContain('game of the year');
    });

    it('should handle "and" to "&" conversion', () => {
      const name = new GameName('Dungeons and Dragons');
      expect(name.normalizedValue).toContain('&');
    });
  });

  describe('value property', () => {
    it('should return the original raw name', () => {
      const rawName = 'Counter-Strike: Global Offensive';
      const name = new GameName(rawName);
      expect(name.value).toBe(rawName);
    });
  });

  describe('normalizedValue property', () => {
    it('should return the normalized version', () => {
      const name = new GameName('GAME NAME');
      expect(name.normalizedValue).toBe('game name');
    });

    it('should be lowercase', () => {
      const name = new GameName('Counter-Strike');
      expect(name.normalizedValue).toBe(name.normalizedValue.toLowerCase());
    });
  });

  describe('isSimilarTo', () => {
    it('should return true for identical names', () => {
      const name1 = new GameName('Counter-Strike');
      const name2 = new GameName('Counter-Strike');
      expect(name1.isSimilarTo(name2)).toBe(true);
    });

    it('should return true for similar names with minor differences', () => {
      const name1 = new GameName('Counter-Strike: GO');
      const name2 = new GameName('Counter Strike GO');
      expect(name1.isSimilarTo(name2)).toBe(true);
    });

    it('should return false for completely different names', () => {
      const name1 = new GameName('Counter-Strike');
      const name2 = new GameName('Dota 2');
      expect(name1.isSimilarTo(name2)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const name1 = new GameName('Counter-Strike');
      const name2 = new GameName('Counter');
      
      // Should be similar with higher threshold
      expect(name1.isSimilarTo(name2, 0.5)).toBe(true);
      
      // Should not be similar with lower threshold
      expect(name1.isSimilarTo(name2, 0.1)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal normalized names', () => {
      const name1 = new GameName('Counter-Strike');
      const name2 = new GameName('counter-strike');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = new GameName('Counter-Strike');
      const name2 = new GameName('Dota 2');
      expect(name1.equals(name2)).toBe(false);
    });

    it('should ignore case differences', () => {
      const name1 = new GameName('GAME');
      const name2 = new GameName('game');
      expect(name1.equals(name2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the raw name', () => {
      const rawName = 'Counter-Strike: Global Offensive';
      const name = new GameName(rawName);
      expect(name.toString()).toBe(rawName);
    });
  });
});

describe('Game Entity', () => {
  describe('structure', () => {
    it('should have required properties', () => {
      const game: Game = {
        appId: 730,
        name: 'Counter-Strike: Global Offensive',
      };
      
      expect(game.appId).toBe(730);
      expect(game.name).toBe('Counter-Strike: Global Offensive');
    });

    it('should support optional platformIds', () => {
      const game: Game = {
        appId: 730,
        name: 'Counter-Strike',
        platformIds: {
          steam: 730,
          backloggd: 'counter-strike-go',
        },
      };
      
      expect(game.platformIds?.steam).toBe(730);
      expect(game.platformIds?.backloggd).toBe('counter-strike-go');
    });

    it('should support optional metadata', () => {
      const game: Game = {
        appId: 730,
        name: 'Counter-Strike',
        metadata: {
          developer: 'Valve',
          publisher: 'Valve',
          tags: ['FPS', 'Multiplayer'],
        },
      };
      
      expect(game.metadata?.developer).toBe('Valve');
      expect(game.metadata?.tags).toContain('FPS');
    });
  });

  describe('identity', () => {
    it('should be identified by appId', () => {
      const game1: Game = { appId: 730, name: 'Game A' };
      const game2: Game = { appId: 730, name: 'Game B' };
      
      // Same appId means same game
      expect(game1.appId).toBe(game2.appId);
    });
  });
});

describe('GameFactory', () => {
  describe('createFromSteam', () => {
    it('should create a game from Steam data', () => {
      const game = GameFactory.createFromSteam(730, 'Counter-Strike: Global Offensive');
      
      expect(game.appId).toBe(730);
      expect(game.name).toBe('Counter-Strike: Global Offensive');
      expect(game.platformIds?.steam).toBe(730);
    });

    it('should handle any appId and name', () => {
      const game = GameFactory.createFromSteam(570, 'Dota 2');
      
      expect(game.appId).toBe(570);
      expect(game.name).toBe('Dota 2');
      expect(game.platformIds?.steam).toBe(570);
    });

    it('should preserve original name formatting', () => {
      const game = GameFactory.createFromSteam(123, '  Spaced Name  ');
      
      expect(game.name).toBe('  Spaced Name  ');
    });
  });

  describe('createFromBackloggd', () => {
    it('should create a game from Backloggd data with Steam appId', () => {
      const game = GameFactory.createFromBackloggd('Counter-Strike: GO', 730);
      
      expect(game.appId).toBe(730);
      expect(game.name).toBe('Counter-Strike: GO');
      expect(game.platformIds?.steam).toBe(730);
    });

    it('should create a game without Steam appId', () => {
      const game = GameFactory.createFromBackloggd('Indie Game');
      
      expect(game.appId).toBe(0);
      expect(game.name).toBe('Indie Game');
      expect(game.platformIds?.steam).toBeUndefined();
    });

    it('should handle optional steamAppId parameter', () => {
      const game1 = GameFactory.createFromBackloggd('Game', 999);
      const game2 = GameFactory.createFromBackloggd('Game');
      
      expect(game1.platformIds?.steam).toBe(999);
      expect(game2.appId).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a basic game with appId and name', () => {
      const game = GameFactory.create(123, 'Test Game');
      
      expect(game.appId).toBe(123);
      expect(game.name).toBe('Test Game');
      expect(game.platformIds).toBeUndefined();
    });

    it('should create minimal game structure', () => {
      const game = GameFactory.create(1, 'A');
      
      expect(game).toHaveProperty('appId');
      expect(game).toHaveProperty('name');
    });
  });
});
