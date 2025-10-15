import { DamageType } from './combat'

// Equipment Types and Categories
export type EquipmentSlot = 
  | 'weapon' | 'offhand' | 'helm' | 'chest' | 'legs' | 'boots' 
  | 'gloves' | 'ring' | 'amulet' | 'belt'

export type EquipmentCategory = 'weapon' | 'armor' | 'accessory'

export type WeaponType = 'sword' | 'axe' | 'mace' | 'dagger' | 'bow' | 'crossbow' | 'staff' | 'wand'
export type ArmorType = 'helm' | 'chest' | 'legs' | 'boots' | 'gloves' | 'shield'
export type AccessoryType = 'ring' | 'amulet' | 'belt'

// Character Attributes
export type Attribute = 'strength' | 'dexterity' | 'intelligence' | 'vitality' | 'luck'

// Equipment Stats
export interface EquipmentStats {
  // Primary stats
  damage?: number
  armor?: number
  
  // Attribute bonuses
  strength?: number
  dexterity?: number
  intelligence?: number
  vitality?: number
  luck?: number
  
  // Combat stats
  critChance?: number
  critMultiplier?: number
  attackSpeed?: number
  dodgeChance?: number
  blockChance?: number
  
  // Defensive stats
  resistance?: Partial<Record<DamageType, number>>
  
  // Utility stats
  goldFind?: number
  magicFind?: number
  experienceBonus?: number
  
  // Health/Mana
  health?: number
  mana?: number
  healthRegen?: number
  manaRegen?: number
  
  // Special effects
  lifeSteal?: number
  manaSteal?: number
  thorns?: number
}

// Affix Types
export interface Affix {
  name: string
  stat: keyof EquipmentStats
  value: number
  tier: number
  weight: number // Probability weight for generation
}

// Equipment Item
export interface Equipment {
  id: string
  name: string
  type: WeaponType | ArmorType | AccessoryType
  slot: EquipmentSlot
  category: EquipmentCategory
  rarity: string
  level: number
  baseStats: EquipmentStats
  affixes: Affix[]
  damageType?: DamageType
  requirements?: Partial<Record<Attribute, number>>
  value: number
}

// Base Equipment Definitions
export const WEAPON_BASES: Record<WeaponType, {
  name: string
  slot: EquipmentSlot
  baseStats: EquipmentStats
  damageTypes: DamageType[]
  requirements: Partial<Record<Attribute, number>>
}> = {
  sword: {
    name: 'Sword',
    slot: 'weapon',
    baseStats: { damage: 8 },
    damageTypes: ['physical', 'fire', 'ice', 'lightning'],
    requirements: {} // Removed requirements
  },
  axe: {
    name: 'Axe',
    slot: 'weapon',
    baseStats: { damage: 12, critChance: 0.05 },
    damageTypes: ['physical', 'fire'],
    requirements: {} // Removed requirements
  },
  mace: {
    name: 'Mace',
    slot: 'weapon',
    baseStats: { damage: 10, armor: 2 },
    damageTypes: ['physical', 'lightning'],
    requirements: {} // Removed requirements
  },
  dagger: {
    name: 'Dagger',
    slot: 'weapon',
    baseStats: { damage: 6, critChance: 0.1, attackSpeed: 0.3 },
    damageTypes: ['physical', 'poison'],
    requirements: {} // Removed requirements
  },
  bow: {
    name: 'Bow',
    slot: 'weapon',
    baseStats: { damage: 9, critChance: 0.08 },
    damageTypes: ['physical', 'fire', 'ice', 'poison'],
    requirements: {} // Removed requirements
  },
  crossbow: {
    name: 'Crossbow',
    slot: 'weapon',
    baseStats: { damage: 14, critChance: 0.06 },
    damageTypes: ['physical', 'lightning'],
    requirements: {} // Removed requirements
  },
  staff: {
    name: 'Staff',
    slot: 'weapon',
    baseStats: { damage: 7, mana: 20, manaRegen: 2 },
    damageTypes: ['fire', 'ice', 'lightning'],
    requirements: {} // Removed requirements
  },
  wand: {
    name: 'Wand',
    slot: 'weapon',
    baseStats: { damage: 5, mana: 15, critChance: 0.07 },
    damageTypes: ['fire', 'ice', 'lightning', 'poison'],
    requirements: {} // Removed requirements
  }
}

export const ARMOR_BASES: Record<ArmorType, {
  name: string
  slot: EquipmentSlot
  baseStats: EquipmentStats
  requirements: Partial<Record<Attribute, number>>
}> = {
  helm: {
    name: 'Helm',
    slot: 'helm',
    baseStats: { armor: 5, health: 15 },
    requirements: {}
  },
  chest: {
    name: 'Chest Armor',
    slot: 'chest',
    baseStats: { armor: 12, health: 30 },
    requirements: {}
  },
  legs: {
    name: 'Leg Armor',
    slot: 'legs',
    baseStats: { armor: 8, health: 20 },
    requirements: {}
  },
  boots: {
    name: 'Boots',
    slot: 'boots',
    baseStats: { armor: 4, dodgeChance: 0.02 },
    requirements: {}
  },
  gloves: {
    name: 'Gloves',
    slot: 'gloves',
    baseStats: { armor: 3, attackSpeed: 0.1 },
    requirements: {}
  },
  shield: {
    name: 'Shield',
    slot: 'offhand',
    baseStats: { armor: 8, blockChance: 0.15 },
    requirements: {} // Removed requirements
  }
}

export const ACCESSORY_BASES: Record<AccessoryType, {
  name: string
  slot: EquipmentSlot
  baseStats: EquipmentStats
  requirements: Partial<Record<Attribute, number>>
}> = {
  ring: {
    name: 'Ring',
    slot: 'ring',
    baseStats: {},
    requirements: {}
  },
  amulet: {
    name: 'Amulet',
    slot: 'amulet',
    baseStats: {},
    requirements: {}
  },
  belt: {
    name: 'Belt',
    slot: 'belt',
    baseStats: { health: 10 },
    requirements: {}
  }
}

// Thematic Affix Pools
export const WEAPON_AFFIXES: Affix[] = [
  // Damage affixes
  { name: 'of Power', stat: 'damage', value: 3, tier: 1, weight: 100 },
  { name: 'of Might', stat: 'damage', value: 6, tier: 2, weight: 80 },
  { name: 'of Devastation', stat: 'damage', value: 10, tier: 3, weight: 40 },
  
  // Critical affixes
  { name: 'of Precision', stat: 'critChance', value: 0.03, tier: 1, weight: 80 },
  { name: 'of Lethality', stat: 'critChance', value: 0.06, tier: 2, weight: 60 },
  { name: 'of Execution', stat: 'critChance', value: 0.1, tier: 3, weight: 30 },
  
  // Speed affixes
  { name: 'of Swiftness', stat: 'attackSpeed', value: 0.1, tier: 1, weight: 70 },
  { name: 'of Haste', stat: 'attackSpeed', value: 0.2, tier: 2, weight: 50 },
  { name: 'of Lightning', stat: 'attackSpeed', value: 0.35, tier: 3, weight: 25 },
  
  // Life steal
  { name: 'of Vampirism', stat: 'lifeSteal', value: 0.03, tier: 1, weight: 60 },
  { name: 'of Blood', stat: 'lifeSteal', value: 0.06, tier: 2, weight: 40 },
  { name: 'of the Vampire', stat: 'lifeSteal', value: 0.1, tier: 3, weight: 20 }
]

export const ARMOR_AFFIXES: Affix[] = [
  // Defense affixes
  { name: 'of Protection', stat: 'armor', value: 2, tier: 1, weight: 100 },
  { name: 'of Defense', stat: 'armor', value: 4, tier: 2, weight: 80 },
  { name: 'of the Fortress', stat: 'armor', value: 7, tier: 3, weight: 40 },
  
  // Health affixes
  { name: 'of Vitality', stat: 'health', value: 15, tier: 1, weight: 90 },
  { name: 'of Life', stat: 'health', value: 30, tier: 2, weight: 70 },
  { name: 'of the Titan', stat: 'health', value: 50, tier: 3, weight: 35 },
  
  // Dodge affixes
  { name: 'of Evasion', stat: 'dodgeChance', value: 0.02, tier: 1, weight: 70 },
  { name: 'of Agility', stat: 'dodgeChance', value: 0.04, tier: 2, weight: 50 },
  { name: 'of the Wind', stat: 'dodgeChance', value: 0.07, tier: 3, weight: 25 },
  
  // Regeneration
  { name: 'of Regeneration', stat: 'healthRegen', value: 1, tier: 1, weight: 60 },
  { name: 'of Recovery', stat: 'healthRegen', value: 2, tier: 2, weight: 40 },
  { name: 'of Renewal', stat: 'healthRegen', value: 4, tier: 3, weight: 20 }
]

export const ACCESSORY_AFFIXES: Affix[] = [
  // Attribute bonuses
  { name: 'of Strength', stat: 'strength', value: 3, tier: 1, weight: 80 },
  { name: 'of Dexterity', stat: 'dexterity', value: 3, tier: 1, weight: 80 },
  { name: 'of Intelligence', stat: 'intelligence', value: 3, tier: 1, weight: 80 },
  { name: 'of Vitality', stat: 'vitality', value: 3, tier: 1, weight: 80 },
  { name: 'of Luck', stat: 'luck', value: 3, tier: 1, weight: 60 },
  
  // Magic find and gold find
  { name: 'of Fortune', stat: 'goldFind', value: 0.15, tier: 1, weight: 70 },
  { name: 'of Wealth', stat: 'goldFind', value: 0.25, tier: 2, weight: 50 },
  { name: 'of Greed', stat: 'goldFind', value: 0.4, tier: 3, weight: 25 },
  
  { name: 'of Discovery', stat: 'magicFind', value: 0.1, tier: 1, weight: 60 },
  { name: 'of Finding', stat: 'magicFind', value: 0.2, tier: 2, weight: 40 },
  { name: 'of the Seeker', stat: 'magicFind', value: 0.35, tier: 3, weight: 20 },
  
  // Experience bonus
  { name: 'of Learning', stat: 'experienceBonus', value: 0.1, tier: 1, weight: 50 },
  { name: 'of Wisdom', stat: 'experienceBonus', value: 0.2, tier: 2, weight: 30 },
  { name: 'of the Scholar', stat: 'experienceBonus', value: 0.35, tier: 3, weight: 15 }
]

// Rarity definitions
export const RARITIES = {
  Common: { color: '#9CA3AF', affixCount: [0, 1], statMultiplier: 1.0 },
  Magic: { color: '#3B82F6', affixCount: [1, 2], statMultiplier: 1.3 },
  Rare: { color: '#EAB308', affixCount: [2, 4], statMultiplier: 1.6 },
  Unique: { color: '#A855F7', affixCount: [3, 5], statMultiplier: 2.2 },
  Legendary: { color: '#F97316', affixCount: [4, 6], statMultiplier: 3.0 }
}

// Equipment slot configuration for UI
export const EQUIPMENT_SLOTS = [
  { id: 'weapon', name: 'Weapon', icon: '⚔️', category: 'weapon' },
  { id: 'offhand', name: 'Off-Hand', icon: '🛡️', category: 'armor' },
  { id: 'helm', name: 'Helm', icon: '⛑️', category: 'armor' },
  { id: 'chest', name: 'Chest', icon: '👕', category: 'armor' },
  { id: 'gloves', name: 'Gloves', icon: '🧤', category: 'armor' },
  { id: 'legs', name: 'Legs', icon: '👖', category: 'armor' },
  { id: 'boots', name: 'Boots', icon: '👢', category: 'armor' },
  { id: 'belt', name: 'Belt', icon: '🎒', category: 'accessory' },
  { id: 'ring', name: 'Ring', icon: '💍', category: 'accessory' },
  { id: 'amulet', name: 'Amulet', icon: '📿', category: 'accessory' }
]