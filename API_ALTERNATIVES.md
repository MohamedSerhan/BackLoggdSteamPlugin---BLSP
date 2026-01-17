# Steam API Rate Limiting - Solutions & Alternatives

## The Problem

Steam's `store.steampowered.com/api/appdetails` endpoint is **rate-limited at ~200 requests per 5 minutes** regardless of authentication. This affects fetching game details for wishlists with 200+ games.

---

## Solution 1: SteamSpy API (RECOMMENDED - No Rate Limits!) ⭐

### Overview
SteamSpy provides comprehensive Steam game data **without rate limits** for reasonable use.

### Benefits
- ✅ **No rate limiting** for normal usage
- ✅ **Free** - No API key required
- ✅ **Comprehensive data** - Game names, tags, genres, etc.
- ✅ **Faster** - Can make many requests quickly
- ✅ **Updated daily** - Good enough for wishlist comparison

### Limitations
- ⚠️ Data updated once per day (not real-time)
- ⚠️ Very new games might not be in database yet
- ⚠️ Not official Steam API

### Implementation
```javascript
// Single game
https://steamspy.com/api.php?request=appdetails&appid=APPID

// Response includes:
{
  "appid": 730,
  "name": "Counter-Strike: Global Offensive",
  "developer": "Valve",
  "publisher": "Valve",
  "tags": {...},
  "positive": 6800000,
  "negative": 500000
}
```

### Time to Implement: **2-3 hours**
### Expected Benefit: **Eliminates rate limiting completely**

---

## Solution 2: Better Caching Strategy ⚡

### Overview
Cache individual games **permanently** since game names rarely change.

### Current Issue
- Cache expires after 24 hours
- Must refetch all 248 games every day

### Proposed Solution
```
cache/
├── wishlist/
│   └── {steamId}.json          # 24hr TTL - List of app IDs
├── games/
│   └── {appId}.json            # NEVER expires - Game details
└── metadata/
    └── last_updated.json       # Track cache status
```

### Benefits
- ✅ **Only fetch new games** you added to wishlist
- ✅ **Instant results** for cached games
- ✅ **90%+ cache hit rate** after first run
- ✅ **Works with current API** - No changes needed

### Implementation
```javascript
// Pseudo-code
async function fetchGameDetails(appId) {
    // Check individual game cache first
    const cached = getGameCache(appId);
    if (cached) return cached;
    
    // Only fetch if not cached
    const data = await fetchFromSteam(appId);
    setGameCache(appId, data); // Cache forever
    return data;
}
```

### Time to Implement: **3-4 hours**
### Expected Benefit: **95% reduction in API calls after first run**

---

## Solution 3: Pre-built Steam Games Database 💾

### Overview
Download a complete database of all Steam games (~150MB) and query locally.

### Benefits
- ✅ **Zero API calls** for game lookups
- ✅ **Instant results** - No network delay
- ✅ **Offline capability**
- ✅ **No rate limiting ever**

### Limitations
- ⚠️ Requires initial database download
- ⚠️ Database needs periodic updates (weekly)
- ⚠️ Extra storage space needed

### Available Databases
- **SteamDB** - Community-maintained
- **Steam API scrapes** - Available on GitHub
- **Kaggle datasets** - Various Steam game datasets

### Implementation
Use SQLite with Prisma:
```javascript
// Query local database
const game = await prisma.game.findUnique({
    where: { appId: 730 }
});
```

### Time to Implement: **8-12 hours** (includes database setup)
### Expected Benefit: **Zero API calls, instant results**

---

## Solution 4: Hybrid Approach (BEST OF ALL WORLDS) 🎯

### Implementation Strategy

```javascript
async function getGameName(appId) {
    // 1. Check local cache first (instant)
    const cached = getGameFromCache(appId);
    if (cached) return cached;
    
    // 2. Try SteamSpy (no rate limits)
    try {
        const steamSpyData = await fetchFromSteamSpy(appId);
        if (steamSpyData) {
            cacheGameForever(appId, steamSpyData.name);
            return steamSpyData.name;
        }
    } catch (error) {
        // SteamSpy failed, continue to fallback
    }
    
    // 3. Fallback to Steam API (rate limited)
    const steamData = await fetchFromSteamWithRetry(appId);
    cacheGameForever(appId, steamData.name);
    return steamData.name;
}
```

### Benefits
- ✅ Best performance (cache first)
- ✅ No rate limits (SteamSpy primary)
- ✅ Reliable fallback (Steam API)
- ✅ Permanent caching
- ✅ Future-proof

### Time to Implement: **4-5 hours**
### Expected Benefit: **Eliminates 99% of rate limit issues**

---

## Recommended Immediate Action

### Quick Win (30 minutes): Better Cache Strategy
```bash
# Implement permanent individual game caching
# Benefits: 95% reduction in API calls after first run
# No external dependencies needed
```

### Best Long-term (2-3 hours): Add SteamSpy
```bash
# Integrate SteamSpy API with Steam API fallback
# Benefits: No more rate limiting issues
# Reliable and fast
```

---

## Comparison Table

| Solution | Setup Time | Rate Limit | Speed | Reliability | Maintenance |
|----------|------------|------------|-------|-------------|-------------|
| **Current** | - | 200/5min | Slow | Low | None |
| **SteamSpy** | 2-3 hrs | None | Fast | High | Low |
| **Better Cache** | 3-4 hrs | 200/5min* | Medium | High | None |
| **Local DB** | 8-12 hrs | None | Instant | High | Medium |
| **Hybrid** | 4-5 hrs | None** | Fast | Very High | Low |

*Only hits rate limit on first run  
**Effectively none with SteamSpy primary

---

## My Recommendation

**Implement the Hybrid Approach**:

1. **Phase 1** (30 min): Better caching - Quick win
2. **Phase 2** (2 hrs): Add SteamSpy integration
3. **Phase 3** (1 hr): Refine fallback logic

This gives you:
- Immediate improvement (better cache)
- Long-term solution (SteamSpy)
- Reliability (Steam fallback)

---

## Want Me to Implement?

I can implement any of these solutions. Which would you like?

**Option A**: Quick cache fix (30 min) → Immediate 95% improvement  
**Option B**: SteamSpy integration (2-3 hrs) → Eliminates rate limiting  
**Option C**: Full hybrid solution (4-5 hrs) → Best of everything  

Let me know and I'll get started!

---

**Note**: The "API key" we added earlier only works for the wishlist fetching endpoint, NOT for game details. That's why you're still hitting rate limits. The appdetails endpoint has NO authentication option - it's just rate-limited for everyone.
