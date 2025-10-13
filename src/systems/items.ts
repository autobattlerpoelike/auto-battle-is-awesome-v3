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

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateAffixes(rarity: ItemRarity) {
  const pool = AFFIX_POOLS[rarity.toLowerCase() as keyof typeof AFFIX_POOLS];
  const count = rarity === "Unique" ? 5 : rarity === "Rare" ? 4 : rarity === "Magic" ? 3 : 2;
  const chosen = [];
  const available = [...pool];
  for (let i = 0; i < count && available.length; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const aff = available.splice(idx, 1)[0];
    chosen.push({ key: aff.k, value: rand(aff.min, aff.max) });
  }
  return chosen;
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
