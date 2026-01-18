import { WishlistService } from '../WishlistService';
import { IWishlistRepository } from '../../../infrastructure/repositories/IWishlistRepository';
import { CompareWishlistsUseCase } from '../../../domain/usecases/CompareWishlists';
import { WishlistFactory } from '../../../domain/entities/Wishlist';
import { GameFactory } from '../../../domain/entities/Game';
import { ComparisonFactory } from '../../../domain/entities/ComparisonResult';

describe('WishlistService', () => {
  let service: WishlistService;
  let mockWishlistRepo: jest.Mocked<IWishlistRepository>;
  let mockCompareUseCase: jest.Mocked<CompareWishlistsUseCase>;

  // Mock console methods to avoid cluttering test output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    // Create mock repository
    mockWishlistRepo = {
      getWishlist: jest.fn(),
      getSteamWishlist: jest.fn(),
      getBackloggdWishlist: jest.fn(),
      getBackloggdBacklog: jest.fn(),
      validateGamesOnSteam: jest.fn(),
    } as jest.Mocked<IWishlistRepository>;

    // Create mock use case
    mockCompareUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CompareWishlistsUseCase>;

    // Create service with mocks
    service = new WishlistService(mockWishlistRepo, mockCompareUseCase);
  });

  describe('compareWishlists', () => {
    it('should fetch and compare Steam and Backloggd wishlists', async () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const steamWishlist = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const backloggdWishlist = WishlistFactory.createFromGames([game1], 'backloggd', 'user2');

      const comparison = ComparisonFactory.create([game1], [], [], 'steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 1,
          matchCount: 1,
          onlyInFirst: 0,
          onlyInSecond: 0,
          matchPercentage: '100.00%',
        },
      };

      mockWishlistRepo.getSteamWishlist.mockResolvedValue(steamWishlist);
      mockWishlistRepo.getBackloggdWishlist.mockResolvedValue(backloggdWishlist);
      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      const result = await service.compareWishlists('steamId123', 'backloggdUser');

      expect(mockWishlistRepo.getSteamWishlist).toHaveBeenCalledWith('steamId123');
      expect(mockWishlistRepo.getBackloggdWishlist).toHaveBeenCalledWith('backloggdUser');
      expect(mockCompareUseCase.execute).toHaveBeenCalledWith({
        firstWishlist: steamWishlist,
        secondWishlist: backloggdWishlist,
        excludedAppIds: undefined,
        excludedNames: undefined,
        fuzzyMatchThreshold: undefined,
      });
      expect(result).toEqual(mockOutput);
    });

    it('should pass excluded app IDs to use case', async () => {
      const steamWishlist = WishlistFactory.createEmpty('steam', 'user1');
      const backloggdWishlist = WishlistFactory.createEmpty('backloggd', 'user2');

      const comparison = ComparisonFactory.createEmpty('steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 0,
          matchCount: 0,
          onlyInFirst: 0,
          onlyInSecond: 0,
          matchPercentage: '0.00%',
        },
      };

      mockWishlistRepo.getSteamWishlist.mockResolvedValue(steamWishlist);
      mockWishlistRepo.getBackloggdWishlist.mockResolvedValue(backloggdWishlist);
      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      const excludedIds = [730, 570];
      await service.compareWishlists('steamId', 'backloggdUser', excludedIds);

      expect(mockCompareUseCase.execute).toHaveBeenCalledWith({
        firstWishlist: steamWishlist,
        secondWishlist: backloggdWishlist,
        excludedAppIds: excludedIds,
        excludedNames: undefined,
        fuzzyMatchThreshold: undefined,
      });
    });

    it('should pass fuzzy match threshold to use case', async () => {
      const steamWishlist = WishlistFactory.createEmpty('steam', 'user1');
      const backloggdWishlist = WishlistFactory.createEmpty('backloggd', 'user2');

      const comparison = ComparisonFactory.createEmpty('steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 0,
          matchCount: 0,
          onlyInFirst: 0,
          onlyInSecond: 0,
          matchPercentage: '0.00%',
        },
      };

      mockWishlistRepo.getSteamWishlist.mockResolvedValue(steamWishlist);
      mockWishlistRepo.getBackloggdWishlist.mockResolvedValue(backloggdWishlist);
      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      await service.compareWishlists('steamId', 'backloggdUser', [], [], 0.3);

      expect(mockCompareUseCase.execute).toHaveBeenCalledWith({
        firstWishlist: steamWishlist,
        secondWishlist: backloggdWishlist,
        excludedAppIds: [],
        excludedNames: [],
        fuzzyMatchThreshold: 0.3,
      });
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Repository error');
      mockWishlistRepo.getSteamWishlist.mockRejectedValue(error);

      await expect(
        service.compareWishlists('steamId', 'backloggdUser')
      ).rejects.toThrow('Repository error');

      expect(console.error).toHaveBeenCalledWith('Error comparing wishlists:', error);
    });
  });

  describe('compareSteamWithBacklog', () => {
    it('should fetch and compare Steam wishlist with Backloggd backlog', async () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const steamWishlist = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const backloggdBacklog = WishlistFactory.createFromGames([game1], 'backloggd', 'user2');

      const comparison = ComparisonFactory.create([game1], [], [], 'steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 1,
          matchCount: 1,
          onlyInFirst: 0,
          onlyInSecond: 0,
          matchPercentage: '100.00%',
        },
      };

      mockWishlistRepo.getSteamWishlist.mockResolvedValue(steamWishlist);
      mockWishlistRepo.getBackloggdBacklog.mockResolvedValue(backloggdBacklog);
      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      const result = await service.compareSteamWithBacklog('steamId123', 'backloggdUser');

      expect(mockWishlistRepo.getSteamWishlist).toHaveBeenCalledWith('steamId123');
      expect(mockWishlistRepo.getBackloggdBacklog).toHaveBeenCalledWith('backloggdUser');
      expect(result).toEqual(mockOutput);
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Backlog fetch error');
      mockWishlistRepo.getBackloggdBacklog.mockRejectedValue(error);

      await expect(
        service.compareSteamWithBacklog('steamId', 'backloggdUser')
      ).rejects.toThrow('Backlog fetch error');

      expect(console.error).toHaveBeenCalledWith(
        'Error comparing Steam wishlist with Backloggd backlog:',
        error
      );
    });
  });

  describe('getSteamWishlist', () => {
    it('should fetch Steam wishlist', async () => {
      const game = GameFactory.create(730, 'Counter-Strike');
      const wishlist = WishlistFactory.createFromGames([game], 'steam', 'user1');

      mockWishlistRepo.getSteamWishlist.mockResolvedValue(wishlist);

      const result = await service.getSteamWishlist('steamId123');

      expect(mockWishlistRepo.getSteamWishlist).toHaveBeenCalledWith('steamId123');
      expect(result).toEqual(wishlist);
      expect(result.count).toBe(1);
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Steam API error');
      mockWishlistRepo.getSteamWishlist.mockRejectedValue(error);

      await expect(service.getSteamWishlist('steamId')).rejects.toThrow('Steam API error');

      expect(console.error).toHaveBeenCalledWith('Error fetching Steam wishlist:', error);
    });
  });

  describe('getBackloggdWishlist', () => {
    it('should fetch Backloggd wishlist', async () => {
      const game = GameFactory.create(730, 'Counter-Strike');
      const wishlist = WishlistFactory.createFromGames([game], 'backloggd', 'user1');

      mockWishlistRepo.getBackloggdWishlist.mockResolvedValue(wishlist);

      const result = await service.getBackloggdWishlist('username');

      expect(mockWishlistRepo.getBackloggdWishlist).toHaveBeenCalledWith('username');
      expect(result).toEqual(wishlist);
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Backloggd API error');
      mockWishlistRepo.getBackloggdWishlist.mockRejectedValue(error);

      await expect(service.getBackloggdWishlist('username')).rejects.toThrow('Backloggd API error');

      expect(console.error).toHaveBeenCalledWith('Error fetching Backloggd wishlist:', error);
    });
  });

  describe('getBackloggdBacklog', () => {
    it('should fetch Backloggd backlog', async () => {
      const game = GameFactory.create(730, 'Counter-Strike');
      const backlog = WishlistFactory.createFromGames([game], 'backloggd', 'user1');

      mockWishlistRepo.getBackloggdBacklog.mockResolvedValue(backlog);

      const result = await service.getBackloggdBacklog('username');

      expect(mockWishlistRepo.getBackloggdBacklog).toHaveBeenCalledWith('username');
      expect(result).toEqual(backlog);
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Backlog fetch error');
      mockWishlistRepo.getBackloggdBacklog.mockRejectedValue(error);

      await expect(service.getBackloggdBacklog('username')).rejects.toThrow('Backlog fetch error');

      expect(console.error).toHaveBeenCalledWith('Error fetching Backloggd backlog:', error);
    });
  });

  describe('validateGamesOnSteam', () => {
    it('should validate game names on Steam', async () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');
      const validatedGames = WishlistFactory.createFromGames([game1, game2], 'steam', 'validation');

      mockWishlistRepo.validateGamesOnSteam.mockResolvedValue(validatedGames);

      const gameNames = ['Counter-Strike', 'Dota 2'];
      const result = await service.validateGamesOnSteam(gameNames);

      expect(mockWishlistRepo.validateGamesOnSteam).toHaveBeenCalledWith(gameNames);
      expect(result).toEqual(validatedGames);
      expect(result.count).toBe(2);
    });

    it('should handle empty game names array', async () => {
      const emptyCollection = WishlistFactory.createEmpty('steam', 'validation');

      mockWishlistRepo.validateGamesOnSteam.mockResolvedValue(emptyCollection);

      const result = await service.validateGamesOnSteam([]);

      expect(mockWishlistRepo.validateGamesOnSteam).toHaveBeenCalledWith([]);
      expect(result.count).toBe(0);
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Validation error');
      mockWishlistRepo.validateGamesOnSteam.mockRejectedValue(error);

      await expect(service.validateGamesOnSteam(['Game'])).rejects.toThrow('Validation error');

      expect(console.error).toHaveBeenCalledWith('Error validating games on Steam:', error);
    });
  });

  describe('compareCollections', () => {
    it('should compare two wishlist collections', async () => {
      const game1 = GameFactory.create(730, 'Counter-Strike');
      const game2 = GameFactory.create(570, 'Dota 2');

      const first = WishlistFactory.createFromGames([game1], 'steam', 'user1');
      const second = WishlistFactory.createFromGames([game2], 'backloggd', 'user2');

      const comparison = ComparisonFactory.create([], [game1], [game2], 'steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 2,
          matchCount: 0,
          onlyInFirst: 1,
          onlyInSecond: 1,
          matchPercentage: '0.00%',
        },
      };

      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      const result = await service.compareCollections(first, second);

      expect(mockCompareUseCase.execute).toHaveBeenCalledWith({
        firstWishlist: first,
        secondWishlist: second,
        excludedAppIds: undefined,
        fuzzyMatchThreshold: undefined,
      });
      expect(result).toEqual(mockOutput);
    });

    it('should pass optional parameters to use case', async () => {
      const first = WishlistFactory.createEmpty('steam', 'user1');
      const second = WishlistFactory.createEmpty('backloggd', 'user2');

      const comparison = ComparisonFactory.createEmpty('steam', 'backloggd');
      const mockOutput = {
        comparison,
        statistics: {
          totalGames: 0,
          matchCount: 0,
          onlyInFirst: 0,
          onlyInSecond: 0,
          matchPercentage: '0.00%',
        },
      };

      mockCompareUseCase.execute.mockReturnValue(mockOutput);

      await service.compareCollections(first, second, [730], 0.3);

      expect(mockCompareUseCase.execute).toHaveBeenCalledWith({
        firstWishlist: first,
        secondWishlist: second,
        excludedAppIds: [730],
        fuzzyMatchThreshold: 0.3,
      });
    });

    it('should handle errors and rethrow', async () => {
      const first = WishlistFactory.createEmpty('steam', 'user1');
      const second = WishlistFactory.createEmpty('backloggd', 'user2');

      const error = new Error('Comparison error');
      mockCompareUseCase.execute.mockImplementation(() => {
        throw error;
      });

      await expect(service.compareCollections(first, second)).rejects.toThrow('Comparison error');

      expect(console.error).toHaveBeenCalledWith(
        'Error comparing wishlist collections:',
        error
      );
    });
  });
});
