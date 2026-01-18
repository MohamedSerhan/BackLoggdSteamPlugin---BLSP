import { Wishlist, WishlistCollection, WishlistFactory } from '../Wishlist';
import { Game, GameFactory } from '../Game';

describe('Wishlist Interface', () => {
  it('should have required properties', () => {
    const wishlist: Wishlist = {
      platform: 'steam',
      userId: '12345',
      games: [],
      lastUpdated: new Date(),
    };
    
    expect(wishlist.platform).toBe('steam');
    expect(wishlist.userId).toBe('12345');
    expect(wishlist.games).toEqual([]);
    expect(wishlist.lastUpdated).toBeInstanceOf(Date);
  });
});

describe('WishlistCollection', () => {
  // Test helpers
  const createTestGame = (appId: number, name: string): Game => {
    return GameFactory.create(appId, name);
  };

  const game1 = createTestGame(730, 'Counter-Strike');
  const game2 = createTestGame(570, 'Dota 2');
  const game3 = createTestGame(440, 'Team Fortress 2');

  describe('constructor and properties', () => {
    it('should create an empty wishlist collection', () => {
      const wishlist = new WishlistCollection([], 'steam', 'user123');
      
      expect(wishlist.count).toBe(0);
      expect(wishlist.platform).toBe('steam');
      expect(wishlist.userId).toBe('user123');
      expect(wishlist.items).toEqual([]);
    });

    it('should create a wishlist collection with games', () => {
      const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');
      
      expect(wishlist.count).toBe(2);
      expect(wishlist.items).toHaveLength(2);
    });

    it('should return readonly items array', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const items = wishlist.items;
      
      // ReadonlyArray is a TypeScript compile-time check
      // It prevents modifications at compile time, not runtime
      expect(items).toBeDefined();
      expect(items.length).toBe(1);
    });
  });

  describe('findByAppId', () => {
    const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');

    it('should find game by appId', () => {
      const found = wishlist.findByAppId(730);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Counter-Strike');
    });

    it('should return undefined for non-existent appId', () => {
      const found = wishlist.findByAppId(999);
      expect(found).toBeUndefined();
    });
  });

  describe('findByName', () => {
    const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');

    it('should find games by exact name match', () => {
      const found = wishlist.findByName('Counter-Strike');
      expect(found).toHaveLength(1);
      expect(found[0].appId).toBe(730);
    });

    it('should be case-insensitive', () => {
      const found = wishlist.findByName('counter-strike');
      expect(found).toHaveLength(1);
      expect(found[0].appId).toBe(730);
    });

    it('should return empty array for non-existent name', () => {
      const found = wishlist.findByName('Non-existent Game');
      expect(found).toEqual([]);
    });

    it('should return multiple games with same name', () => {
      const duplicate = createTestGame(999, 'Counter-Strike');
      const wishlistWithDupe = new WishlistCollection(
        [game1, duplicate],
        'steam',
        'user123'
      );
      
      const found = wishlistWithDupe.findByName('Counter-Strike');
      expect(found).toHaveLength(2);
    });
  });

  describe('contains and containsAppId', () => {
    const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');

    it('should return true if game exists', () => {
      expect(wishlist.contains(game1)).toBe(true);
    });

    it('should return false if game does not exist', () => {
      expect(wishlist.contains(game3)).toBe(false);
    });

    it('should return true if appId exists', () => {
      expect(wishlist.containsAppId(730)).toBe(true);
    });

    it('should return false if appId does not exist', () => {
      expect(wishlist.containsAppId(999)).toBe(false);
    });
  });

  describe('add', () => {
    it('should add a game and return new instance', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const updated = wishlist.add(game2);
      
      expect(updated.count).toBe(2);
      expect(updated.contains(game2)).toBe(true);
      expect(wishlist.count).toBe(1); // Original unchanged
    });

    it('should not add duplicate games', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const updated = wishlist.add(game1);
      
      expect(updated.count).toBe(1);
      expect(updated).toBe(wishlist); // Returns same instance
    });

    it('should preserve platform and userId', () => {
      const wishlist = new WishlistCollection([game1], 'backloggd', 'john');
      const updated = wishlist.add(game2);
      
      expect(updated.platform).toBe('backloggd');
      expect(updated.userId).toBe('john');
    });
  });

  describe('remove', () => {
    it('should remove a game and return new instance', () => {
      const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');
      const updated = wishlist.remove(game1);
      
      expect(updated.count).toBe(1);
      expect(updated.contains(game1)).toBe(false);
      expect(updated.contains(game2)).toBe(true);
      expect(wishlist.count).toBe(2); // Original unchanged
    });

    it('should handle removing non-existent game', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const updated = wishlist.remove(game2);
      
      expect(updated.count).toBe(1);
    });
  });

  describe('filter', () => {
    const wishlist = new WishlistCollection([game1, game2, game3], 'steam', 'user123');

    it('should filter games by predicate', () => {
      const filtered = wishlist.filter(g => g.appId > 500);
      
      expect(filtered.count).toBe(2);
      expect(filtered.containsAppId(730)).toBe(true);
      expect(filtered.containsAppId(570)).toBe(true);
      expect(filtered.containsAppId(440)).toBe(false);
    });

    it('should return new instance', () => {
      const filtered = wishlist.filter(g => g.appId > 500);
      expect(filtered).not.toBe(wishlist);
    });

    it('should preserve platform and userId', () => {
      const filtered = wishlist.filter(() => true);
      expect(filtered.platform).toBe('steam');
      expect(filtered.userId).toBe('user123');
    });
  });

  describe('map', () => {
    const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');

    it('should map games to another type', () => {
      const appIds = wishlist.map(g => g.appId);
      expect(appIds).toEqual([730, 570]);
    });

    it('should map games to strings', () => {
      const names = wishlist.map(g => g.name);
      expect(names).toEqual(['Counter-Strike', 'Dota 2']);
    });
  });

  describe('getAppIds and getNames', () => {
    const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');

    it('should get all app IDs', () => {
      const appIds = wishlist.getAppIds();
      expect(appIds).toEqual([730, 570]);
    });

    it('should get all game names', () => {
      const names = wishlist.getNames();
      expect(names).toEqual(['Counter-Strike', 'Dota 2']);
    });
  });

  describe('merge', () => {
    it('should merge two wishlists', () => {
      const wishlist1 = new WishlistCollection([game1], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2, game3], 'steam', 'user2');
      
      const merged = wishlist1.merge(wishlist2);
      
      expect(merged.count).toBe(3);
      expect(merged.contains(game1)).toBe(true);
      expect(merged.contains(game2)).toBe(true);
      expect(merged.contains(game3)).toBe(true);
    });

    it('should not duplicate games', () => {
      const wishlist1 = new WishlistCollection([game1, game2], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2, game3], 'steam', 'user2');
      
      const merged = wishlist1.merge(wishlist2);
      
      expect(merged.count).toBe(3);
    });

    it('should preserve original wishlist platform and userId', () => {
      const wishlist1 = new WishlistCollection([game1], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2], 'backloggd', 'user2');
      
      const merged = wishlist1.merge(wishlist2);
      
      expect(merged.platform).toBe('steam');
      expect(merged.userId).toBe('user1');
    });
  });

  describe('difference', () => {
    it('should return games in first wishlist but not in second', () => {
      const wishlist1 = new WishlistCollection([game1, game2], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2, game3], 'steam', 'user2');
      
      const diff = wishlist1.difference(wishlist2);
      
      expect(diff.count).toBe(1);
      expect(diff.contains(game1)).toBe(true);
      expect(diff.contains(game2)).toBe(false);
    });

    it('should return empty wishlist if all games are in other', () => {
      const wishlist1 = new WishlistCollection([game1], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game1, game2], 'steam', 'user2');
      
      const diff = wishlist1.difference(wishlist2);
      
      expect(diff.count).toBe(0);
    });
  });

  describe('intersection', () => {
    it('should return games in both wishlists', () => {
      const wishlist1 = new WishlistCollection([game1, game2], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2, game3], 'steam', 'user2');
      
      const intersection = wishlist1.intersection(wishlist2);
      
      expect(intersection.count).toBe(1);
      expect(intersection.contains(game2)).toBe(true);
    });

    it('should return empty wishlist if no common games', () => {
      const wishlist1 = new WishlistCollection([game1], 'steam', 'user1');
      const wishlist2 = new WishlistCollection([game2], 'steam', 'user2');
      
      const intersection = wishlist1.intersection(wishlist2);
      
      expect(intersection.count).toBe(0);
    });
  });

  describe('toArray', () => {
    it('should convert to plain array', () => {
      const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');
      const array = wishlist.toArray();
      
      expect(Array.isArray(array)).toBe(true);
      expect(array).toHaveLength(2);
      expect(array[0]).toEqual(game1);
    });

    it('should return a new array (not readonly)', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const array = wishlist.toArray();
      
      // Should be able to mutate the returned array
      expect(() => array.push(game2)).not.toThrow();
      expect(wishlist.count).toBe(1); // Original unchanged
    });
  });

  describe('toWishlist', () => {
    it('should convert to Wishlist interface', () => {
      const wishlist = new WishlistCollection([game1, game2], 'steam', 'user123');
      const converted = wishlist.toWishlist();
      
      expect(converted.platform).toBe('steam');
      expect(converted.userId).toBe('user123');
      expect(converted.games).toHaveLength(2);
      expect(converted.lastUpdated).toBeInstanceOf(Date);
    });

    it('should set lastUpdated to current time', () => {
      const wishlist = new WishlistCollection([game1], 'steam', 'user123');
      const before = new Date();
      const converted = wishlist.toWishlist();
      const after = new Date();
      
      expect(converted.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(converted.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});

describe('WishlistFactory', () => {
  const game1 = GameFactory.create(730, 'Counter-Strike');
  const game2 = GameFactory.create(570, 'Dota 2');

  describe('createEmpty', () => {
    it('should create an empty wishlist collection', () => {
      const wishlist = WishlistFactory.createEmpty('steam', 'user123');
      
      expect(wishlist.count).toBe(0);
      expect(wishlist.platform).toBe('steam');
      expect(wishlist.userId).toBe('user123');
    });

    it('should support different platforms', () => {
      const steam = WishlistFactory.createEmpty('steam', 'user1');
      const backloggd = WishlistFactory.createEmpty('backloggd', 'user2');
      
      expect(steam.platform).toBe('steam');
      expect(backloggd.platform).toBe('backloggd');
    });
  });

  describe('createFromGames', () => {
    it('should create wishlist from games array', () => {
      const wishlist = WishlistFactory.createFromGames(
        [game1, game2],
        'steam',
        'user123'
      );
      
      expect(wishlist.count).toBe(2);
      expect(wishlist.contains(game1)).toBe(true);
      expect(wishlist.contains(game2)).toBe(true);
    });

    it('should handle empty games array', () => {
      const wishlist = WishlistFactory.createFromGames([], 'steam', 'user123');
      expect(wishlist.count).toBe(0);
    });
  });

  describe('createFromWishlist', () => {
    it('should create WishlistCollection from Wishlist interface', () => {
      const wishlist: Wishlist = {
        platform: 'backloggd',
        userId: 'john',
        games: [game1, game2],
        lastUpdated: new Date(),
      };
      
      const collection = WishlistFactory.createFromWishlist(wishlist);
      
      expect(collection.count).toBe(2);
      expect(collection.platform).toBe('backloggd');
      expect(collection.userId).toBe('john');
      expect(collection.contains(game1)).toBe(true);
    });
  });
});
