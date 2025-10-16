// Path of Exile inspired endgame mapping system
import { Equipment } from './equipment'
import { SkillGem, SupportGem, GemRarity } from './skillGems'

export type MapTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16
export type MapRarity = 'Normal' | 'Magic' | 'Rare' | 'Unique'

export interface MapModifier {
  id: string
  name: string
  description: string
  type: 'prefix' | 'suffix'
  tier: number // 1-6, higher tier = stronger modifier
  effects: {
    monsterLife?: number // Percentage increase
    monsterDamage?: number // Percentage increase
    monsterSpeed?: number // Percentage increase
    areaLevel?: number // Flat increase to area level
    packSize?: number // Percentage increase in monster pack size
    itemQuantity?: number // Percentage increase in item drops
    itemRarity?: number // Percentage increase in rare item drops
    experienceGain?: number // Percentage increase in experience
    curseEffect?: string // Special curse effects
    elementalDamage?: number // Added elemental damage to monsters
    resistances?: Record<string, number> // Monster resistances
  }
  requiredLevel: number
}

export interface MapReward {
  type: 'equipment' | 'skillGem' | 'supportGem' | 'currency' | 'experience'
  quantity: number
  minLevel?: number
  maxLevel?: number
  rarity?: MapRarity | GemRarity
  guaranteed?: boolean // Always drops
}

export interface Map {
  id: string
  name: string
  description: string
  tier: MapTier
  rarity: MapRarity
  baseLevel: number // Base monster level
  layout: 'linear' | 'circular' | 'maze' | 'arena' | 'branching'
  theme: 'forest' | 'dungeon' | 'desert' | 'ice' | 'volcanic' | 'corrupted' | 'celestial'
  modifiers: MapModifier[]
  baseRewards: MapReward[]
  completionTime: number // Estimated completion time in seconds
  unlockRequirement?: {
    completedMaps?: string[] // Required completed maps
    playerLevel?: number
    questsCompleted?: string[]
  }
  isCompleted: boolean
  timesCompleted: number
  bestTime?: number
}

export interface MapDevice {
  availableMaps: Map[]
  completedMaps: string[]
  currentMap?: Map
  mapStash: Map[] // Player's map inventory
  atlasProgress: {
    tier: MapTier
    completedCount: number
    totalCount: number
    bonusObjectives: number
  }
}

// Map Modifier Database
export const MAP_MODIFIERS: MapModifier[] = [
  // Prefix modifiers (monster buffs)
  {
    id: 'monster_life_1',
    name: 'Feral',
    description: 'Monsters have 25% increased Life',
    type: 'prefix',
    tier: 1,
    effects: { monsterLife: 25 },
    requiredLevel: 1
  },
  {
    id: 'monster_life_2',
    name: 'Savage',
    description: 'Monsters have 50% increased Life',
    type: 'prefix',
    tier: 3,
    effects: { monsterLife: 50 },
    requiredLevel: 20
  },
  {
    id: 'monster_damage_1',
    name: 'Brutal',
    description: 'Monsters deal 20% increased Damage',
    type: 'prefix',
    tier: 2,
    effects: { monsterDamage: 20 },
    requiredLevel: 10
  },
  {
    id: 'monster_speed_1',
    name: 'Fleet',
    description: 'Monsters have 15% increased Movement and Attack Speed',
    type: 'prefix',
    tier: 2,
    effects: { monsterSpeed: 15 },
    requiredLevel: 15
  },
  {
    id: 'elemental_damage_1',
    name: 'Burning',
    description: 'Monsters deal 30% additional Fire Damage',
    type: 'prefix',
    tier: 3,
    effects: { elementalDamage: 30 },
    requiredLevel: 25
  },
  
  // Suffix modifiers (rewards)
  {
    id: 'item_quantity_1',
    name: 'of Bounty',
    description: '20% increased Item Quantity',
    type: 'suffix',
    tier: 1,
    effects: { itemQuantity: 20 },
    requiredLevel: 1
  },
  {
    id: 'item_rarity_1',
    name: 'of Fortune',
    description: '30% increased Item Rarity',
    type: 'suffix',
    tier: 2,
    effects: { itemRarity: 30 },
    requiredLevel: 10
  },
  {
    id: 'pack_size_1',
    name: 'of Hordes',
    description: '25% increased Pack Size',
    type: 'suffix',
    tier: 3,
    effects: { packSize: 25 },
    requiredLevel: 20
  },
  {
    id: 'experience_1',
    name: 'of Learning',
    description: '15% increased Experience Gain',
    type: 'suffix',
    tier: 2,
    effects: { experienceGain: 15 },
    requiredLevel: 5
  }
]

// Base Map Templates
export const BASE_MAPS: Omit<Map, 'modifiers' | 'isCompleted' | 'timesCompleted' | 'rarity'>[] = [
  // Tier 1-3 (Early Maps)
  {
    id: 'beach',
    name: 'Beach',
    description: 'A sandy coastline overrun by corrupted sea creatures.',
    tier: 1,
    baseLevel: 68,
    layout: 'linear',
    theme: 'desert',
    baseRewards: [
      { type: 'equipment', quantity: 2, minLevel: 68, maxLevel: 72 },
      { type: 'experience', quantity: 1000 }
    ],
    completionTime: 180
  },
  {
    id: 'graveyard',
    name: 'Graveyard',
    description: 'An ancient cemetery where the dead refuse to rest.',
    tier: 2,
    baseLevel: 69,
    layout: 'maze',
    theme: 'corrupted',
    baseRewards: [
      { type: 'equipment', quantity: 3, minLevel: 69, maxLevel: 73 },
      { type: 'skillGem', quantity: 1, rarity: 'Normal' },
      { type: 'experience', quantity: 1200 }
    ],
    completionTime: 240
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    description: 'A dark underground complex filled with ancient horrors.',
    tier: 3,
    baseLevel: 70,
    layout: 'branching',
    theme: 'dungeon',
    baseRewards: [
      { type: 'equipment', quantity: 3, minLevel: 70, maxLevel: 74 },
      { type: 'supportGem', quantity: 1, rarity: 'Normal' },
      { type: 'experience', quantity: 1500 }
    ],
    completionTime: 300
  },
  
  // Tier 4-8 (Mid Maps)
  {
    id: 'volcano',
    name: 'Volcano',
    description: 'A treacherous volcanic peak with rivers of molten lava.',
    tier: 6,
    baseLevel: 73,
    layout: 'circular',
    theme: 'volcanic',
    baseRewards: [
      { type: 'equipment', quantity: 4, minLevel: 73, maxLevel: 77 },
      { type: 'skillGem', quantity: 1, rarity: 'Magic' },
      { type: 'experience', quantity: 2500 }
    ],
    completionTime: 420,
    unlockRequirement: {
      completedMaps: ['beach', 'graveyard', 'dungeon'],
      playerLevel: 50
    }
  },
  {
    id: 'glacier',
    name: 'Glacier',
    description: 'A frozen wasteland where ice elementals roam freely.',
    tier: 8,
    baseLevel: 75,
    layout: 'arena',
    theme: 'ice',
    baseRewards: [
      { type: 'equipment', quantity: 5, minLevel: 75, maxLevel: 79 },
      { type: 'supportGem', quantity: 2, rarity: 'Magic' },
      { type: 'experience', quantity: 3500 }
    ],
    completionTime: 480,
    unlockRequirement: {
      completedMaps: ['volcano'],
      playerLevel: 60
    }
  },
  
  // Tier 12-16 (Endgame Maps)
  {
    id: 'shaper_realm',
    name: 'Shaper\'s Realm',
    description: 'A reality-bending dimension where the laws of physics break down.',
    tier: 14,
    baseLevel: 81,
    layout: 'maze',
    theme: 'celestial',
    baseRewards: [
      { type: 'equipment', quantity: 8, minLevel: 81, maxLevel: 85, rarity: 'Rare', guaranteed: true },
      { type: 'skillGem', quantity: 2, rarity: 'Rare' },
      { type: 'supportGem', quantity: 2, rarity: 'Rare' },
      { type: 'experience', quantity: 8000 }
    ],
    completionTime: 720,
    unlockRequirement: {
      completedMaps: ['glacier'],
      playerLevel: 80
    }
  },
  {
    id: 'elder_sanctum',
    name: 'Elder Sanctum',
    description: 'The twisted domain of an ancient cosmic entity.',
    tier: 16,
    baseLevel: 83,
    layout: 'arena',
    theme: 'corrupted',
    baseRewards: [
      { type: 'equipment', quantity: 10, minLevel: 83, maxLevel: 87, rarity: 'Unique', guaranteed: true },
      { type: 'skillGem', quantity: 3, rarity: 'Unique' },
      { type: 'supportGem', quantity: 3, rarity: 'Unique' },
      { type: 'experience', quantity: 15000 }
    ],
    completionTime: 900,
    unlockRequirement: {
      completedMaps: ['shaper_realm'],
      playerLevel: 90
    }
  }
]

// Map Generation Functions
export function generateMap(baseMap: typeof BASE_MAPS[0], rarity: MapRarity = 'Normal'): Map {
  const map: Map = {
    ...baseMap,
    rarity,
    modifiers: [],
    isCompleted: false,
    timesCompleted: 0
  }
  
  // Add modifiers based on rarity
  const modifierCount = getModifierCount(rarity)
  const availableModifiers = MAP_MODIFIERS.filter(mod => mod.requiredLevel <= map.baseLevel)
  
  for (let i = 0; i < modifierCount; i++) {
    const modifier = availableModifiers[Math.floor(Math.random() * availableModifiers.length)]
    if (!map.modifiers.find(m => m.id === modifier.id)) {
      map.modifiers.push(modifier)
    }
  }
  
  return map
}

function getModifierCount(rarity: MapRarity): number {
  switch (rarity) {
    case 'Normal': return 0
    case 'Magic': return Math.floor(Math.random() * 2) + 1 // 1-2 modifiers
    case 'Rare': return Math.floor(Math.random() * 3) + 3 // 3-5 modifiers
    case 'Unique': return Math.floor(Math.random() * 2) + 4 // 4-5 modifiers
  }
}

export function calculateMapDifficulty(map: Map): number {
  let difficulty = map.tier * 10 + map.baseLevel
  
  map.modifiers.forEach(modifier => {
    difficulty += modifier.tier * 5
    if (modifier.effects.monsterLife) difficulty += modifier.effects.monsterLife / 5
    if (modifier.effects.monsterDamage) difficulty += modifier.effects.monsterDamage / 3
    if (modifier.effects.monsterSpeed) difficulty += modifier.effects.monsterSpeed / 4
  })
  
  return Math.floor(difficulty)
}

export function calculateMapRewards(map: Map): MapReward[] {
  const rewards = [...map.baseRewards]
  
  // Apply modifier bonuses
  map.modifiers.forEach(modifier => {
    if (modifier.effects.itemQuantity) {
      rewards.forEach(reward => {
        if (reward.type === 'equipment') {
          reward.quantity = Math.floor(reward.quantity * (1 + modifier.effects.itemQuantity! / 100))
        }
      })
    }
    
    if (modifier.effects.experienceGain) {
      rewards.forEach(reward => {
        if (reward.type === 'experience') {
          reward.quantity = Math.floor(reward.quantity * (1 + modifier.effects.experienceGain! / 100))
        }
      })
    }
  })
  
  return rewards
}

export function canAccessMap(map: Map, playerLevel: number, completedMaps: string[]): boolean {
  if (!map.unlockRequirement) return true
  
  if (map.unlockRequirement.playerLevel && playerLevel < map.unlockRequirement.playerLevel) {
    return false
  }
  
  if (map.unlockRequirement.completedMaps) {
    const hasRequiredMaps = map.unlockRequirement.completedMaps.every(requiredMap => 
      completedMaps.includes(requiredMap)
    )
    if (!hasRequiredMaps) return false
  }
  
  return true
}

export function getAvailableMaps(playerLevel: number, completedMaps: string[]): Map[] {
  return BASE_MAPS
    .filter(baseMap => canAccessMap(baseMap as Map, playerLevel, completedMaps))
    .map(baseMap => generateMap(baseMap, 'Normal'))
}

export function createDefaultMapDevice(): MapDevice {
  return {
    availableMaps: getAvailableMaps(1, []),
    completedMaps: [],
    mapStash: [],
    atlasProgress: {
      tier: 1,
      completedCount: 0,
      totalCount: BASE_MAPS.length,
      bonusObjectives: 0
    }
  }
}