// Stone Embedding System
import { DamageType } from './combat'
import { Attribute, EquipmentStats } from './equipment'

export type StoneType = 
  | 'ruby' | 'sapphire' | 'emerald' | 'diamond' | 'topaz' | 'amethyst'
  | 'onyx' | 'opal' | 'garnet' | 'citrine' | 'peridot' | 'turquoise'

export type StoneRarity = 'Common' | 'Rare' | 'Mythical' | 'Divine'

export interface StoneAffix {
  stat: string
  value: number
  name: string
  tier: number
  weight: number
}

export interface Stone {
  id: string
  name: string
  type: StoneType
  rarity: StoneRarity
  level: number
  baseStats: EquipmentStats
  affixes: StoneAffix[]
  socketTypes: string[] // Which equipment slots this stone can be socketed into
  value: number
}

export interface SocketedEquipment {
  stones: Stone[]
  maxSockets: number
}

// Stone base definitions
export const STONE_BASES: Record<StoneType, {
  name: string
  baseStats: EquipmentStats
  socketTypes: string[]
  primaryStat: string
}> = {
  ruby: {
    name: 'Ruby',
    baseStats: { damage: 3, strength: 2 },
    socketTypes: ['weapon', 'ring', 'amulet'],
    primaryStat: 'damage'
  },
  sapphire: {
    name: 'Sapphire',
    baseStats: { mana: 15, intelligence: 2 },
    socketTypes: ['helm', 'chest', 'ring', 'amulet'],
    primaryStat: 'mana'
  },
  emerald: {
    name: 'Emerald',
    baseStats: { dexterity: 3, critChance: 0.02 },
    socketTypes: ['weapon', 'gloves', 'ring', 'amulet'],
    primaryStat: 'dexterity'
  },
  diamond: {
    name: 'Diamond',
    baseStats: { armor: 5, health: 20 },
    socketTypes: ['helm', 'chest', 'legs', 'boots'],
    primaryStat: 'armor'
  },
  topaz: {
    name: 'Topaz',
    baseStats: { attackSpeed: 0.1, luck: 2 },
    socketTypes: ['weapon', 'gloves', 'ring'],
    primaryStat: 'attackSpeed'
  },
  amethyst: {
    name: 'Amethyst',
    baseStats: { vitality: 3, healthRegen: 0.5 },
    socketTypes: ['helm', 'chest', 'belt', 'amulet'],
    primaryStat: 'vitality'
  },
  onyx: {
    name: 'Onyx',
    baseStats: { dodgeChance: 0.02, dexterity: 2 },
    socketTypes: ['boots', 'gloves', 'ring'],
    primaryStat: 'dodgeChance'
  },
  opal: {
    name: 'Opal',
    baseStats: { magicFind: 0.1, luck: 3 },
    socketTypes: ['ring', 'amulet', 'belt'],
    primaryStat: 'magicFind'
  },
  garnet: {
    name: 'Garnet',
    baseStats: { lifeSteal: 0.03, strength: 2 },
    socketTypes: ['weapon', 'ring', 'amulet'],
    primaryStat: 'lifeSteal'
  },
  citrine: {
    name: 'Citrine',
    baseStats: { goldFind: 0.15, luck: 2 },
    socketTypes: ['ring', 'amulet', 'belt'],
    primaryStat: 'goldFind'
  },
  peridot: {
    name: 'Peridot',
    baseStats: { experienceBonus: 0.1, intelligence: 2 },
    socketTypes: ['helm', 'amulet', 'ring'],
    primaryStat: 'experienceBonus'
  },
  turquoise: {
    name: 'Turquoise',
    baseStats: { manaRegen: 0.3, intelligence: 2 },
    socketTypes: ['helm', 'chest', 'amulet'],
    primaryStat: 'manaRegen'
  }
}

// Stone rarity definitions
export const STONE_RARITIES = {
  Common: { color: '#9CA3AF', statMultiplier: 1.0, affixCount: [0, 1] },
  Rare: { color: '#3B82F6', statMultiplier: 1.5, affixCount: [1, 2] },
  Mythical: { color: '#8B5CF6', statMultiplier: 2.0, affixCount: [2, 3] },
  Divine: { color: '#F59E0B', statMultiplier: 2.5, affixCount: [3, 4] }
}

// Stone-specific affixes
export const STONE_AFFIXES: StoneAffix[] = [
  // Damage affixes
  { name: 'of Power', stat: 'damage', value: 2, tier: 1, weight: 80 },
  { name: 'of Might', stat: 'damage', value: 4, tier: 2, weight: 60 },
  { name: 'of Force', stat: 'damage', value: 7, tier: 3, weight: 40 },
  { name: 'of Devastation', stat: 'damage', value: 12, tier: 4, weight: 20 },
  
  // Health affixes
  { name: 'of Life', stat: 'health', value: 15, tier: 1, weight: 80 },
  { name: 'of Vitality', stat: 'health', value: 30, tier: 2, weight: 60 },
  { name: 'of the Titan', stat: 'health', value: 50, tier: 3, weight: 40 },
  { name: 'of Immortality', stat: 'health', value: 80, tier: 4, weight: 20 },
  
  // Mana affixes
  { name: 'of Energy', stat: 'mana', value: 20, tier: 1, weight: 70 },
  { name: 'of the Mind', stat: 'mana', value: 40, tier: 2, weight: 50 },
  { name: 'of Wisdom', stat: 'mana', value: 65, tier: 3, weight: 30 },
  { name: 'of the Arcane', stat: 'mana', value: 100, tier: 4, weight: 15 },
  
  // Attribute affixes
  { name: 'of Strength', stat: 'strength', value: 2, tier: 1, weight: 70 },
  { name: 'of Great Strength', stat: 'strength', value: 4, tier: 2, weight: 50 },
  { name: 'of Superior Strength', stat: 'strength', value: 7, tier: 3, weight: 30 },
  
  { name: 'of Dexterity', stat: 'dexterity', value: 2, tier: 1, weight: 70 },
  { name: 'of Great Dexterity', stat: 'dexterity', value: 4, tier: 2, weight: 50 },
  { name: 'of Superior Dexterity', stat: 'dexterity', value: 7, tier: 3, weight: 30 },
  
  { name: 'of Intelligence', stat: 'intelligence', value: 2, tier: 1, weight: 70 },
  { name: 'of Great Intelligence', stat: 'intelligence', value: 4, tier: 2, weight: 50 },
  { name: 'of Superior Intelligence', stat: 'intelligence', value: 7, tier: 3, weight: 30 },
  
  { name: 'of Vitality', stat: 'vitality', value: 2, tier: 1, weight: 70 },
  { name: 'of Great Vitality', stat: 'vitality', value: 4, tier: 2, weight: 50 },
  { name: 'of Superior Vitality', stat: 'vitality', value: 7, tier: 3, weight: 30 },
  
  { name: 'of Luck', stat: 'luck', value: 2, tier: 1, weight: 60 },
  { name: 'of Fortune', stat: 'luck', value: 4, tier: 2, weight: 40 },
  { name: 'of Destiny', stat: 'luck', value: 7, tier: 3, weight: 20 },
  
  // Combat affixes
  { name: 'of Precision', stat: 'critChance', value: 0.015, tier: 1, weight: 60 },
  { name: 'of Accuracy', stat: 'critChance', value: 0.03, tier: 2, weight: 40 },
  { name: 'of the Eagle', stat: 'critChance', value: 0.05, tier: 3, weight: 20 },
  
  { name: 'of Evasion', stat: 'dodgeChance', value: 0.015, tier: 1, weight: 50 },
  { name: 'of the Cat', stat: 'dodgeChance', value: 0.03, tier: 2, weight: 30 },
  { name: 'of the Shadow', stat: 'dodgeChance', value: 0.05, tier: 3, weight: 15 },
  
  { name: 'of Speed', stat: 'attackSpeed', value: 0.05, tier: 1, weight: 50 },
  { name: 'of Swiftness', stat: 'attackSpeed', value: 0.1, tier: 2, weight: 30 },
  { name: 'of Lightning', stat: 'attackSpeed', value: 0.18, tier: 3, weight: 15 },
  
  // Utility affixes
  { name: 'of Wealth', stat: 'goldFind', value: 0.1, tier: 1, weight: 40 },
  { name: 'of Greed', stat: 'goldFind', value: 0.2, tier: 2, weight: 25 },
  { name: 'of Avarice', stat: 'goldFind', value: 0.35, tier: 3, weight: 12 },
  
  { name: 'of Discovery', stat: 'magicFind', value: 0.08, tier: 1, weight: 35 },
  { name: 'of Finding', stat: 'magicFind', value: 0.15, tier: 2, weight: 20 },
  { name: 'of the Seeker', stat: 'magicFind', value: 0.25, tier: 3, weight: 10 },
  
  { name: 'of Learning', stat: 'experienceBonus', value: 0.08, tier: 1, weight: 30 },
  { name: 'of Wisdom', stat: 'experienceBonus', value: 0.15, tier: 2, weight: 18 },
  { name: 'of the Scholar', stat: 'experienceBonus', value: 0.25, tier: 3, weight: 8 }
]

// Helper function to get stone color by rarity
export function getStoneColor(rarity: StoneRarity): string {
  return STONE_RARITIES[rarity]?.color || '#FFFFFF'
}

// Helper function to get stone icon by type
export function getStoneIcon(type: StoneType): string {
  const icons: Record<StoneType, string> = {
    ruby: '🔴',
    sapphire: '🔵',
    emerald: '🟢',
    diamond: '💎',
    topaz: '🟡',
    amethyst: '🟣',
    onyx: '⚫',
    opal: '⚪',
    garnet: '🔴',
    citrine: '🟨',
    peridot: '🟢',
    turquoise: '🔷'
  }
  return icons[type] || '💎'
}