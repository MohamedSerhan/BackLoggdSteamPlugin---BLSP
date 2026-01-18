# Phase 2 - Session 2 Handoff Instructions

## Current Status: Session 1 Complete ✅

**Branch**: `phase2-refactor`  
**Commit**: `260f2ca` - "Phase 2 Session 1: Domain layer - entities, use cases, repository interfaces"  
**Progress**: ~15% of total Phase 2 (66-94 hours)  
**Time Spent**: ~4-5 hours  

---

## What Was Completed in Session 1

### ✅ Domain Layer (Complete)
Created pure business logic with no external dependencies:

1. **Entities** (`src/domain/entities/`)
   - `Game.ts` - Game entity with GameName value object and GameFactory
   - `Wishlist.ts` - Wishlist entity with WishlistCollection and operations
   - `ComparisonResult.ts` - WishlistComparison with statistics and operations

2. **Use Cases** (`src/domain/usecases/`)
   - `CompareWishlists.ts` - Core business logic for comparing wishlists with fuzzy matching

3. **Repository Interfaces** (`src/infrastructure/repositories/`)
   - `IGameRepository.ts` - Contract for game data operations
   - `IWishlistRepository.ts` - Contract for wishlist operations

### ✅ Infrastructure
- Directory structure created for clean architecture
- All folders set up: domain/, infrastructure/, application/, presentation/

---

## What Needs to be Done Next (Session 2)

### Priority 1: Complete Repository Implementations (8-10 hours)

#### Step 1: Create Cache Repository Interface
**File**: `src/infrastructure/repositories/ICacheRepository.ts`

```typescript
export interface ICacheRepository<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

#### Step 2: Implement Game Cache Repository
**File**: `src/infrastructure/cache/GameCacheRepository.ts`

- Wrap existing `utils/gameCacheManager.js` functionality
- Implement ICacheRepository<Game>
- 3-month TTL as configured
- File-based storage

#### Step 3: Implement Steam API Client
**File**: `src/infrastructure/apis/SteamAPIClient.ts`

- Wrap existing `services/steamService.js` functionality
- Implement IGameRepository for Steam-specific operations
- Use p-queue for rate limiting
- Handle 429 errors with retry logic

#### Step 4: Implement Backloggd API Client
**File**: `src/infrastructure/apis/BackloggdAPIClient.ts`

- Wrap existing `services/backloggdService.js` functionality
- Implement wishlist fetching
- Handle API responses

#### Step 5: Create Composite Repositories
**File**: `src/infrastructure/repositories/GameRepository.ts`

```typescript
// Combines cache + API with cache-first strategy
export class GameRepository implements IGameRepository {
  constructor(
    private cache: ICacheRepository<Game>,
    private api: SteamAPIClient
  ) {}
  
  async getByAppId(appId: number): Promise<Game | null> {
    // Check cache first
    const cached = await this.cache.get(`game_${appId}`);
    if (cached) return cached;
    
    // Fetch from API
    const game = await this.api.getByAppId(appId);
    if (game) {
      await this.cache.set(`game_${appId}`, game);
    }
    return game;
  }
  
  // ... other methods
}
```

---

### Priority 2: Wire Up Application Layer (4-6 hours)

#### Step 6: Create Application Services
**File**: `src/application/services/WishlistService.ts`

```typescript
export class WishlistService {
  constructor(
    private gameRepo: IGameRepository,
    private wishlistRepo: IWishlistRepository,
    private compareUseCase: CompareWishlistsUseCase
  ) {}
  
  async compareWishlists(
    steamId: string,
    backloggdUsername: string
  ): Promise<CompareWishlistsOutput> {
    // Fetch both wishlists
    const steamWishlist = await this.wishlistRepo.getSteamWishlist(steamId);
    const backloggdWishlist = await this.wishlistRepo.getBackloggdWishlist(backloggdUsername);
    
    // Compare using use case
    return this.compareUseCase.execute({
      firstWishlist: steamWishlist,
      secondWishlist: backloggdWishlist
    });
  }
}
```

---

### Priority 3: Update Entry Point (2-3 hours)

#### Step 7: Refactor index.js
**File**: `src/main.ts` (new entry point)

```typescript
import { WishlistService } from './application/services/WishlistService';
import { GameRepository } from './infrastructure/repositories/GameRepository';
// ... imports

async function main() {
  // Set up dependencies
  const cacheRepo = new GameCacheRepository();
  const steamAPI = new SteamAPIClient();
  const gameRepo = new GameRepository(cacheRepo, steamAPI);
  
  // ... create other dependencies
  
  const wishlistService = new WishlistService(
    gameRepo,
    wishlistRepo,
    compareUseCase
  );
  
  // Run comparison
  const result = await wishlistService.compareWishlists(
    process.env.STEAM_ID!,
    process.env.BACKLOGGD_USERNAME!
  );
  
  // Generate report
  await generateHTMLReport(result);
}

main().catch(console.error);
```

---

## Directory Structure After Session 2

```
src/
├── domain/                    # ✅ DONE
│   ├── entities/
│   │   ├── Game.ts
│   │   ├── Wishlist.ts
│   │   └── ComparisonResult.ts
│   └── usecases/
│       └── CompareWishlists.ts
│
├── infrastructure/            # 🔄 IN PROGRESS (Session 2)
│   ├── repositories/
│   │   ├── IGameRepository.ts         # ✅ DONE
│   │   ├── IWishlistRepository.ts     # ✅ DONE
│   │   ├── ICacheRepository.ts        # ⏳ TODO
│   │   ├── GameRepository.ts          # ⏳ TODO
│   │   └── WishlistRepository.ts      # ⏳ TODO
│   ├── apis/
│   │   ├── SteamAPIClient.ts          # ⏳ TODO
│   │   └── BackloggdAPIClient.ts      # ⏳ TODO
│   └── cache/
│       └── GameCacheRepository.ts     # ⏳ TODO
│
├── application/               # ⏳ TODO (Session 2)
│   └── services/
│       └── WishlistService.ts
│
└── presentation/              # ⏳ TODO (Session 3)
    ├── reports/
    └── cli/

main.ts                        # ⏳ TODO (Session 2)
```

---

## Testing Strategy for Session 2

After each implementation, test incrementally:

```bash
# 1. After creating repositories
npm run build
npm test src/infrastructure/repositories/

# 2. After creating services
npm test src/application/services/

# 3. After wiring up main
npm start
```

**Expected Behavior**: App should still work exactly as before, but with new architecture under the hood.

---

## Critical Success Factors

### ✅ DO:
1. Keep existing app functional - old code stays until new code tested
2. Test after each major component
3. Commit after each working milestone
4. Use dependency injection everywhere
5. Follow existing interfaces exactly

### ❌ DON'T:
1. Don't delete old code yet - just add new alongside
2. Don't change behavior - pure refactor only
3. Don't skip testing steps
4. Don't mix concerns (keep layers separate)

---

## Session 2 Estimated Breakdown

| Task | Time | Priority |
|------|------|----------|
| Cache repository interface | 1 hr | High |
| Cache implementation | 2 hrs | High |
| Steam API client | 2 hrs | High |
| Backloggd API client | 1.5 hrs | High |
| Composite repositories | 2 hrs | High |
| Application services | 3 hrs | High |
| Wire up main entry point | 2 hrs | High |
| Testing & debugging | 2 hrs | High |
| **TOTAL** | **15-16 hrs** | |

---

## Commands to Resume

```bash
# 1. Checkout the branch
git checkout phase2-refactor

# 2. Verify you're on the right commit
git log --oneline -1
# Should show: 260f2ca Phase 2 Session 1: Domain layer...

# 3. Check what was created
ls src/domain/entities/
ls src/domain/usecases/
ls src/infrastructure/repositories/

# 4. Start implementing (see Priority 1 above)
```

---

## After Session 2 Complete

You should have:
- ✅ All repository implementations
- ✅ API clients wrapping existing services
- ✅ Application services layer
- ✅ New main.ts entry point
- ✅ App working with new architecture
- ✅ Old code still present (not deleted yet)

Then Session 3 will:
- Complete TypeScript migration
- Add comprehensive tests
- Remove old code
- Polish and document

---

## Questions/Issues?

If you hit blockers:
1. Check existing code in `services/` and `utils/` for reference
2. Interfaces are already defined - just implement them
3. Keep it simple - wrap existing functionality, don't rewrite
4. Test frequently - small commits

---

**Good luck with Session 2! The foundation is solid. 🚀**

**Estimated Remaining**: ~50-70 hours after Session 2
