// Item affix generator for more robust loot

export type ItemRarity = "Common" | "Magic" | "Rare" | "Unique";

const AFFIX_POOLS = {
  common: [
    { k: "str", min: 1, max: 3 },
    { k: "vit", min: 2, max: 4 },
  ],
  magic: [
    { k: "str", min: 2, max: 5 },
    { k: "dex", min: 2, max: 5 },
    { k: "vit", min: 3, max: 7 },
  ],
  rare: [
    { k: "str", min: 3, max: 8 },
    { k: "dex", min: 3, max: 8 },
    { k: "vit", min: 5, max: 10 },
    { k: "crit", min: 1, max: 5 },
  ],
  unique: [
    { k: "str", min: 6, max: 12 },
    { k: "dex", min: 6, max: 12 },
    { k: "vit", min: 8, max: 15 },
    { k: "crit", min: 3, max: 8 },
    { k: "lifesteal", min: 1, max: 4 },
  ],
};

// Cache for affix generation to improve performance
const affixCache = new Map<string, Array<{ key: string; value: number }>>;
const maxCacheSize = 1000;

// Pre-calculated rarity counts for better performance
const RARITY_COUNTS = {
  "Common": 2,
  "Magic": 3,
  "Rare": 4,
  "Unique": 5
} as const;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateAffixes(rarity: ItemRarity) {
  // Create cache key
  const cacheKey = `${rarity}`;
  
  // Check cache first (with some randomization to avoid identical results)
  if (affixCache.has(cacheKey) && Math.random() > 0.8) {
    const cached = affixCache.get(cacheKey)!;
    // Add variation to cached results
    return cached.map(affix => ({
      ...affix,
      value: rand(Math.floor(affix.value * 0.8), Math.ceil(affix.value * 1.2))
    }));
  }
  
  const pool = AFFIX_POOLS[rarity.toLowerCase() as keyof typeof AFFIX_POOLS];
  const count = RARITY_COUNTS[rarity];
  const chosen: Array<{ key: string; value: number }> = [];
  const available = [...pool];
  
  for (let i = 0; i < count && available.length; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const aff = available.splice(idx, 1)[0];
    chosen.push({ key: aff.k, value: rand(aff.min, aff.max) });
  }
  
  // Cache the result if cache isn't full
  if (affixCache.size < maxCacheSize) {
    affixCache.set(cacheKey, [...chosen]);
  }
  
  return chosen;
}

// Cleanup function for memory management
export function cleanupItemsSystem(): void {
  affixCache.clear();
}

export function makeItem({ baseType = "weapon", rarity = "Common", name }: { baseType?: string; rarity?: ItemRarity; name?: string }) {
  const affixes = generateAffixes(rarity);
  const stats: Record<string, number> = {};
  affixes.forEach((a) => (stats[a.key] = (stats[a.key] || 0) + a.value));
  return {
    id: `${baseType}_${Date.now().toString(36)}`,
    name: name || `${rarity} ${baseType}`,
    baseType,
    rarity,
    stats,
    affixes,
  };
}
