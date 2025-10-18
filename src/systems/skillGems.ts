// Skill Gem System Types and Data
import { calculatePassiveTreeStats } from './passiveTree'

export type SkillGemType = 'active' | 'support'
export type SkillGemCategory = 'attack' | 'spell' | 'aura' | 'movement' | 'utility'
export type SupportGemCategory = 'damage' | 'area' | 'projectile' | 'duration' | 'utility'

// Path of Exile inspired rarity system for gems
export type GemRarity = 'Normal' | 'Magic' | 'Rare' | 'Unique'

export interface GemRarityBonus {
  rarity: GemRarity
  damageBonus: number // Percentage bonus
  qualityBonus: number // Quality percentage (0-20%)
  colorVariant?: string // Visual color variant
  // Tag-specific bonuses
  areaOfEffectBonus?: number // For AoE skills
  areaDamageBonus?: number // For AoE skills
  projectileDamageBonus?: number // For Projectile skills
  physicalDamageBonus?: number // For Physical skills
  elementalDamageBonus?: number // For Fire/Cold/Lightning skills
  attackSpeedBonus?: number // For Attack skills
  castSpeedBonus?: number // For Spell skills
  criticalChanceBonus?: number // For Critical skills
  durationBonus?: number // For Duration skills
  manaCostReduction?: number // General mana efficiency
}

// Path of Exile inspired skill tags
export type SkillTag = 
  // Core types
  | 'Attack' | 'Spell' | 'Aura' | 'Curse' | 'Warcry' | 'Support'
  // Damage types
  | 'Physical' | 'Fire' | 'Cold' | 'Lightning' | 'Chaos' | 'Elemental'
  // Mechanics
  | 'Projectile' | 'AoE' | 'Melee' | 'Channeling' | 'Duration'
  | 'Movement' | 'Travel' | 'Minion' | 'Totem' | 'Trap' | 'Mine'
  // Special properties
  | 'Critical' | 'Bow' | 'Weapon' | 'Unarmed' | 'Brand'
  | 'Slam' | 'Strike' | 'Guard' | 'Vaal' | 'Trigger'

// Scaling mechanics for skill progression
export interface SkillScaling {
  baseDamage?: number
  damagePerLevel?: number
  baseManaCost?: number
  manaCostPerLevel?: number
  baseCooldown?: number
  cooldownReductionPerLevel?: number
  baseArea?: number
  areaPerLevel?: number
  baseDuration?: number
  durationPerLevel?: number
  baseRange?: number
  rangePerLevel?: number
}

export interface SkillGem {
  id: string
  name: string
  description: string
  type: SkillGemType
  category: SkillGemCategory | SupportGemCategory
  tags: SkillTag[] // New tag system
  level: number
  maxLevel: number
  unlockLevel: number // Player level required to unlock (set to 0 for auto-unlock)
  skillPointCost: number // Cost to unlock (set to 0 for free)
  manaCost: number
  cooldown: number // in milliseconds
  isUnlocked: boolean
  isEquipped: boolean
  supportGems: SupportGem[] // Only for active skills
  icon: string // Icon identifier
  scaling: SkillScaling // Scaling mechanics
  rarity: GemRarity // Gem rarity like in PoE
  quality: number // Quality percentage (0-20%)
}

export interface SupportGem {
  id: string
  name: string
  description: string
  tags: SkillTag[] // Support gems can also have tags
  level: number
  maxLevel: number
  unlockLevel: number // Set to 0 for auto-unlock
  skillPointCost: number // Set to 0 for free
  isUnlocked: boolean
  modifiers: SkillModifier[]
  icon: string
  scaling?: {
    baseValue: number
    valuePerLevel: number
  }
  rarity: GemRarity // Support gem rarity
  quality: number // Quality percentage (0-20%)
}

export interface SkillModifier {
  type: 'damage' | 'area' | 'projectiles' | 'speed' | 'duration' | 'manaCost' | 'cooldown' | 'added_damage' | 'damage_multiplier' | 'critical_chance_multiplier'
  value: number
  isPercentage?: boolean
  description?: string
  damageType?: string
  tags?: string[]
}

export interface SkillBar {
  slots: (SkillGem | null)[]
  maxSlots: number
}

// Rarity Bonus Definitions - Tag-specific bonuses based on Path of Exile
export const GEM_RARITY_BONUSES: Record<GemRarity, GemRarityBonus> = {
  'Normal': {
    rarity: 'Normal',
    damageBonus: 0,
    qualityBonus: 0,
    colorVariant: '#ffffff'
  },
  'Magic': {
    rarity: 'Magic',
    damageBonus: 10,
    qualityBonus: 5,
    colorVariant: '#8888ff',
    areaOfEffectBonus: 5,
    projectileDamageBonus: 8,
    manaCostReduction: 5
  },
  'Rare': {
    rarity: 'Rare',
    damageBonus: 25,
    qualityBonus: 10,
    colorVariant: '#ffff88',
    areaOfEffectBonus: 12,
    areaDamageBonus: 15,
    projectileDamageBonus: 20,
    physicalDamageBonus: 18,
    elementalDamageBonus: 18,
    attackSpeedBonus: 10,
    castSpeedBonus: 10,
    criticalChanceBonus: 8,
    durationBonus: 15,
    manaCostReduction: 10
  },
  'Unique': {
    rarity: 'Unique',
    damageBonus: 50,
    qualityBonus: 20,
    colorVariant: '#ff8800',
    areaOfEffectBonus: 25,
    areaDamageBonus: 30,
    projectileDamageBonus: 40,
    physicalDamageBonus: 35,
    elementalDamageBonus: 35,
    attackSpeedBonus: 20,
    castSpeedBonus: 20,
    criticalChanceBonus: 15,
    durationBonus: 25,
    manaCostReduction: 20
  }
}

// Main Skill Gems Database - Inspired by Path of Exile
export const MAIN_SKILL_GEMS: Omit<SkillGem, 'level' | 'isUnlocked' | 'isEquipped' | 'supportGems'>[] = [
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Continuous spinning attack that hits all nearby enemies. Inspired by Path of Exile\'s Cyclone skill - channels automatically during combat with area scaling and movement.',
    type: 'active',
    category: 'attack',
    tags: ['Attack', 'AoE', 'Channeling', 'Melee', 'Physical'], // Path of Exile style tags
    maxLevel: 20,
    unlockLevel: 0, // Auto-unlock (no requirements)
    skillPointCost: 0, // Free to unlock
    manaCost: 0, // No mana cost for automated combat
    cooldown: 0, // No cooldown for continuous channeling
    icon: '🌪️',
    rarity: 'Normal', // Default rarity
    quality: 0, // Base quality
    scaling: {
      baseDamage: 12, // Increased base damage
      damagePerLevel: 2.5, // Better scaling per level
      baseManaCost: 0, // No mana cost for automated combat
      manaCostPerLevel: 0, // No mana cost growth
      baseCooldown: 0, // No cooldown for true channeling behavior
      cooldownReductionPerLevel: 0, // No cooldown reduction needed
      baseArea: 2.5, // Larger base area
      areaPerLevel: 0.15 // Better area scaling
    }
  },
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a fiery projectile that explodes on impact, dealing fire damage to nearby enemies.',
    type: 'active',
    category: 'spell',
    tags: ['Spell', 'Projectile', 'AoE', 'Fire'],
    maxLevel: 20,
    unlockLevel: 0, // Auto-unlock (no requirements)
    skillPointCost: 0, // Free to unlock
    manaCost: 0, // No mana cost for automated combat
    cooldown: 0, // No cooldown for automated combat
    icon: '🔥',
    rarity: 'Normal', // Default rarity
    quality: 0, // Base quality
    scaling: {
      baseDamage: 15,
      damagePerLevel: 3,
      baseManaCost: 0, // No mana cost for automated combat
      manaCostPerLevel: 0,
      baseCooldown: 0, // No cooldown for automated combat
      cooldownReductionPerLevel: 0,
      baseArea: 1.5,
      areaPerLevel: 0.1,
      baseRange: 300, // Reasonable ranged combat distance
      rangePerLevel: 10 // Moderate range increase with skill level
    }
  }
]

// Support Gems Database
export const SUPPORT_GEMS: Omit<SupportGem, 'level' | 'isUnlocked'>[] = [
  {
    id: 'increased_damage',
    name: 'Increased Damage',
    description: 'Increases damage of supported skills',
    tags: ['Attack', 'Spell'], // Can support both attacks and spells
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'damage',
        value: 15,
        isPercentage: true,
        description: '+15% more damage'
      }
    ],
    icon: '💪',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 15,
      valuePerLevel: 2
    }
  },
  {
    id: 'increased_area',
    name: 'Increased Area of Effect',
    description: 'Increases area of effect of supported skills',
    tags: ['AoE'], // Only supports AoE skills
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'area',
        value: 25,
        isPercentage: true,
        description: '+25% increased area of effect'
      }
    ],
    icon: '📏',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 25,
      valuePerLevel: 3
    }
  },
  {
    id: 'multiple_projectiles',
    name: 'Multiple Projectiles',
    description: 'Supported skills fire additional projectiles',
    tags: ['Projectile'], // Only supports projectile skills
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'projectiles',
        value: 2,
        isPercentage: false,
        description: '+2 additional projectiles'
      },
      {
        type: 'damage',
        value: -20,
        isPercentage: true,
        description: '-20% less damage'
      }
    ],
    icon: '🎯',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 2,
      valuePerLevel: 0.2
    }
  },
  {
    id: 'faster_casting',
    name: 'Faster Casting',
    description: 'Reduces cooldown of supported skills',
    tags: ['Spell'], // Primarily for spells but can work with any skill with cooldown
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'cooldown',
        value: -25,
        isPercentage: true,
        description: '-25% reduced cooldown'
      }
    ],
    icon: '⏱️',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 25,
      valuePerLevel: 1.5
    }
  },
  {
    id: 'reduced_mana',
    name: 'Reduced Mana Cost',
    description: 'Reduces mana cost of supported skills',
    tags: ['Attack', 'Spell'], // Universal support for any skill that uses mana
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'manaCost',
        value: -30,
        isPercentage: true,
        description: '-30% reduced mana cost'
      }
    ],
    icon: '💙',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 30,
      valuePerLevel: 1
    }
  },
  {
    id: 'added_fire_damage',
    name: 'Added Fire Damage Support',
    description: 'Adds fire damage to supported skills.',
    tags: ['Support', 'Fire'],
    maxLevel: 20,
    unlockLevel: 0, // Auto-unlock (no requirements)
    skillPointCost: 0, // Free to unlock
    modifiers: [
      {
        type: 'added_damage',
        value: 10, // Adds 10 fire damage
        damageType: 'fire',
        tags: ['Fire']
      }
    ],
    icon: '🔥',
    rarity: 'Normal', // Default rarity
    quality: 0, // Base quality
    scaling: {
      baseValue: 10,
      valuePerLevel: 2 // +2 fire damage per level
    }
  },
  {
    id: 'elemental_focus',
    name: 'Elemental Focus Support',
    description: 'Increases elemental damage but prevents critical strikes.',
    tags: ['Support', 'Elemental'],
    maxLevel: 20,
    unlockLevel: 0, // Auto-unlock (no requirements)
    skillPointCost: 0, // Free to unlock
    modifiers: [
      {
        type: 'damage_multiplier',
        value: 1.5, // 50% more elemental damage
        tags: ['Fire', 'Cold', 'Lightning']
      },
      {
        type: 'critical_chance_multiplier',
        value: 0, // Cannot deal critical strikes
        tags: []
      }
    ],
    icon: '🌟',
    rarity: 'Normal', // Default rarity
    quality: 0, // Base quality
    scaling: {
      baseValue: 1.5,
      valuePerLevel: 0.02 // 2% more elemental damage per level
    }
  },
  {
    id: 'melee_physical_damage',
    name: 'Melee Physical Damage Support',
    description: 'Increases physical damage of supported melee skills.',
    tags: ['Support', 'Melee', 'Physical'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'damage_multiplier',
        value: 1.4, // 40% more physical damage
        tags: ['Physical', 'Melee']
      }
    ],
    icon: '⚔️',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 1.4,
      valuePerLevel: 0.015 // 1.5% more damage per level
    }
  },
  {
    id: 'spell_echo',
    name: 'Spell Echo Support',
    description: 'Supported spells repeat an additional time with reduced damage.',
    tags: ['Support', 'Spell'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'damage',
        value: -25,
        isPercentage: true,
        description: '-25% less damage'
      }
    ],
    icon: '🔄',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 25,
      valuePerLevel: 0.5 // Reduces damage penalty by 0.5% per level
    }
  },
  {
    id: 'concentrated_effect',
    name: 'Concentrated Effect Support',
    description: 'Reduces area of effect but increases area damage.',
    tags: ['Support', 'AoE'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'area',
        value: -30,
        isPercentage: true,
        description: '-30% reduced area of effect'
      },
      {
        type: 'damage',
        value: 60,
        isPercentage: true,
        description: '+60% more area damage'
      }
    ],
    icon: '🎯',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 60,
      valuePerLevel: 2 // +2% more damage per level
    }
  },
  {
    id: 'pierce',
    name: 'Pierce Support',
    description: 'Projectiles pierce through enemies, hitting multiple targets.',
    tags: ['Support', 'Projectile'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'damage',
        value: 10,
        isPercentage: true,
        description: '+10% more projectile damage'
      }
    ],
    icon: '🏹',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 10,
      valuePerLevel: 1 // +1% more damage per level
    }
  },
  {
    id: 'minion_damage',
    name: 'Minion Damage Support',
    description: 'Increases damage dealt by minions.',
    tags: ['Support', 'Minion'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'damage',
        value: 50,
        isPercentage: true,
        description: '+50% increased minion damage'
      }
    ],
    icon: '👥',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 50,
      valuePerLevel: 3 // +3% more damage per level
    }
  },
  {
    id: 'added_cold_damage',
    name: 'Added Cold Damage Support',
    description: 'Adds cold damage to supported skills.',
    tags: ['Support', 'Cold'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'added_damage',
        value: 8,
        damageType: 'cold',
        tags: ['Cold']
      }
    ],
    icon: '❄️',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 8,
      valuePerLevel: 1.5 // +1.5 cold damage per level
    }
  },
  {
    id: 'added_lightning_damage',
    name: 'Added Lightning Damage Support',
    description: 'Adds lightning damage to supported skills.',
    tags: ['Support', 'Lightning'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'added_damage',
        value: 12,
        damageType: 'lightning',
        tags: ['Lightning']
      }
    ],
    icon: '⚡',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 12,
      valuePerLevel: 2 // +2 lightning damage per level
    }
  },
  {
    id: 'increased_duration',
    name: 'Increased Duration Support',
    description: 'Increases the duration of supported skills.',
    tags: ['Support', 'Duration'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'duration',
        value: 40,
        isPercentage: true,
        description: '+40% increased skill duration'
      }
    ],
    icon: '⏳',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 40,
      valuePerLevel: 2 // +2% duration per level
    }
  },
  {
    id: 'critical_strike_multiplier',
    name: 'Critical Strike Multiplier Support',
    description: 'Increases critical strike multiplier of supported skills.',
    tags: ['Support', 'Critical'],
    maxLevel: 20,
    unlockLevel: 0,
    skillPointCost: 0,
    modifiers: [
      {
        type: 'critical_chance_multiplier',
        value: 1.5, // 50% more critical multiplier
        tags: []
      }
    ],
    icon: '💥',
    rarity: 'Normal',
    quality: 0,
    scaling: {
      baseValue: 1.5,
      valuePerLevel: 0.02 // +2% more critical multiplier per level
    }
  }
]

// Tag system utility functions
export function hasTag(skill: SkillGem | SupportGem, tag: SkillTag): boolean {
  return skill.tags.includes(tag)
}

export function hasAnyTag(skill: SkillGem | SupportGem, tags: SkillTag[]): boolean {
  return tags.some(tag => skill.tags.includes(tag))
}

export function hasAllTags(skill: SkillGem | SupportGem, tags: SkillTag[]): boolean {
  return tags.every(tag => skill.tags.includes(tag))
}

export function isCompatibleSupport(skill: SkillGem, support: SupportGem): boolean {
  // Support gems are compatible if they share at least one tag with the skill
  // or if the support gem has no specific tag requirements (empty tags array)
  if (support.tags.length === 0) return true
  return hasAnyTag(skill, support.tags)
}

export function filterSkillsByTag(skills: SkillGem[], tag: SkillTag): SkillGem[] {
  return skills.filter(skill => hasTag(skill, tag))
}

export function filterSkillsByTags(skills: SkillGem[], tags: SkillTag[], requireAll: boolean = false): SkillGem[] {
  if (requireAll) {
    return skills.filter(skill => hasAllTags(skill, tags))
  } else {
    return skills.filter(skill => hasAnyTag(skill, tags))
  }
}

export function getCompatibleSupports(skill: SkillGem, supports: SupportGem[]): SupportGem[] {
  return supports.filter(support => isCompatibleSupport(skill, support))
}

export function getSkillTagsDisplay(skill: SkillGem | SupportGem): string {
  return skill.tags.join(', ')
}

// Skill scaling calculation functions
export function getScaledSkillDamage(skill: SkillGem): number {
  if (!skill.scaling || !skill.scaling.baseDamage) return 0
  return Math.floor(skill.scaling.baseDamage + (skill.scaling.damagePerLevel || 0) * (skill.level - 1))
}

export function getScaledManaCost(skill: SkillGem): number {
  if (!skill.scaling) return skill.manaCost || 0
  const baseManaCost = skill.scaling.baseManaCost || skill.manaCost
  const manaCostPerLevel = skill.scaling.manaCostPerLevel || 0
  return Math.max(1, Math.floor(baseManaCost + manaCostPerLevel * (skill.level - 1)))
}

export function getScaledCooldown(skill: SkillGem): number {
  if (!skill.scaling) return skill.cooldown || 0
  const baseCooldown = skill.scaling.baseCooldown || skill.cooldown
  const cooldownReductionPerLevel = skill.scaling.cooldownReductionPerLevel || 0
  return Math.max(0, Math.floor(baseCooldown - cooldownReductionPerLevel * (skill.level - 1)))
}

export function getScaledArea(skill: SkillGem): number {
  if (!skill.scaling || !skill.scaling.baseArea) return 0
  return skill.scaling.baseArea + (skill.scaling.areaPerLevel || 0) * (skill.level - 1)
}

export function getScaledDuration(skill: SkillGem): number {
  if (!skill.scaling || !skill.scaling.baseDuration) return 0
  return (skill.scaling.baseDuration + (skill.scaling.durationPerLevel || 0) * (skill.level - 1)) / 1000
}

export function getScaledRange(skill: SkillGem): number {
  if (!skill.scaling || !skill.scaling.baseRange) return 0
  return skill.scaling.baseRange + (skill.scaling.rangePerLevel || 0) * (skill.level - 1)
}

export function getScaledSupportGemValue(supportGem: SupportGem): number {
  if (!supportGem.scaling) return supportGem.modifiers[0]?.value || 0
  return Math.floor(supportGem.scaling.baseValue + supportGem.scaling.valuePerLevel * (supportGem.level - 1))
}

export function getScaledSupportGemModifiers(supportGem: SupportGem): SkillModifier[] {
  if (!supportGem.scaling) return supportGem.modifiers
  
  const scaledValue = getScaledSupportGemValue(supportGem)
  return supportGem.modifiers.map(modifier => ({
    ...modifier,
    value: modifier.type === supportGem.modifiers[0].type ? 
      (modifier.value < 0 ? -scaledValue : scaledValue) : 
      modifier.value,
    description: modifier.type === supportGem.modifiers[0].type ?
      `${modifier.value < 0 ? '-' : '+'}${scaledValue}${modifier.isPercentage ? '%' : ''} ${modifier.description ? modifier.description.split(' ').slice(-2).join(' ') : ''}` :
      modifier.description
  }))
}

// Comprehensive modifier application system
export function applyModifiersToSkill(skill: SkillGem): {
  damage: number
  manaCost: number
  cooldown: number
  area: number
  duration: number
  projectileCount: number
} {
  // Defensive check for skill.scaling
  if (!skill || !skill.scaling) {
    console.warn('applyModifiersToSkill: skill or skill.scaling is undefined', skill)
    return {
      damage: 0,
      manaCost: 0,
      cooldown: 0,
      area: 1,
      duration: 0,
      projectileCount: 1
    }
  }

  // Start with base scaled values
  let damage = getScaledSkillDamage(skill)
  let manaCost = getScaledManaCost(skill)
  let cooldown = getScaledCooldown(skill)
  let area = getScaledArea(skill)
  let duration = getScaledDuration(skill)
  let projectileCount = 1

  // Apply rarity bonuses based on skill tags
  const rarityBonus = GEM_RARITY_BONUSES[skill.rarity]
  if (rarityBonus) {
    // Base damage bonus
    damage *= (1 + rarityBonus.damageBonus / 100)
    
    // Tag-specific bonuses
    if (skill.tags.includes('AoE')) {
      if (rarityBonus.areaOfEffectBonus) {
        area *= (1 + rarityBonus.areaOfEffectBonus / 100)
      }
      if (rarityBonus.areaDamageBonus) {
        damage *= (1 + rarityBonus.areaDamageBonus / 100)
      }
    }
    
    if (skill.tags.includes('Projectile') && rarityBonus.projectileDamageBonus) {
      damage *= (1 + rarityBonus.projectileDamageBonus / 100)
    }
    
    if (skill.tags.includes('Physical') && rarityBonus.physicalDamageBonus) {
      damage *= (1 + rarityBonus.physicalDamageBonus / 100)
    }
    
    if ((skill.tags.includes('Fire') || skill.tags.includes('Cold') || skill.tags.includes('Lightning')) && rarityBonus.elementalDamageBonus) {
      damage *= (1 + rarityBonus.elementalDamageBonus / 100)
    }
    
    if (skill.tags.includes('Critical') && rarityBonus.criticalChanceBonus) {
      // Critical bonus affects damage (simplified)
      damage *= (1 + rarityBonus.criticalChanceBonus / 100)
    }
    
    if (skill.tags.includes('Duration') && rarityBonus.durationBonus) {
      duration *= (1 + rarityBonus.durationBonus / 100)
    }
    
    // Mana cost reduction
    if (rarityBonus.manaCostReduction) {
      manaCost *= (1 - rarityBonus.manaCostReduction / 100)
    }
  }

  // Apply support gem modifiers (including their rarity bonuses)
  skill.supportGems.forEach(support => {
    // Apply support gem rarity bonuses first
    const supportRarityBonus = GEM_RARITY_BONUSES[support.rarity]
    if (supportRarityBonus) {
      // Support gems enhance their base modifier values based on rarity
      damage *= (1 + supportRarityBonus.damageBonus / 200) // Half effect for support gems
      
      // Tag-specific support bonuses (only if support gem has matching tags)
      if (support.tags.includes('AoE') && supportRarityBonus.areaOfEffectBonus) {
        area *= (1 + supportRarityBonus.areaOfEffectBonus / 200)
      }
      if (support.tags.includes('Projectile') && supportRarityBonus.projectileDamageBonus) {
        damage *= (1 + supportRarityBonus.projectileDamageBonus / 200)
      }
      if (supportRarityBonus.manaCostReduction) {
        manaCost *= (1 - supportRarityBonus.manaCostReduction / 200)
      }
    }
    
    const scaledModifiers = getScaledSupportGemModifiers(support)
    scaledModifiers.forEach(modifier => {
      switch (modifier.type) {
        case 'damage':
          if (modifier.isPercentage) {
            damage *= (1 + modifier.value / 100)
          } else {
            damage += modifier.value
          }
          break
        case 'manaCost':
          if (modifier.isPercentage) {
            manaCost *= (1 + modifier.value / 100)
          } else {
            manaCost += modifier.value
          }
          break
        case 'cooldown':
          if (modifier.isPercentage) {
            cooldown *= (1 + modifier.value / 100)
          } else {
            cooldown += modifier.value
          }
          break
        case 'area':
          if (modifier.isPercentage) {
            area *= (1 + modifier.value / 100)
          } else {
            area += modifier.value
          }
          break
        case 'duration':
          if (modifier.isPercentage) {
            duration *= (1 + modifier.value / 100)
          } else {
            duration += modifier.value
          }
          break
        case 'projectiles':
          projectileCount += modifier.value
          break
      }
    })
  })

  return {
    damage: Math.round(damage),
    manaCost: Math.round(manaCost),
    cooldown: Math.round(cooldown),
    area: Math.round(area * 100) / 100, // Round to 2 decimal places
    duration: Math.round(duration),
    projectileCount: Math.max(1, Math.round(projectileCount))
  }
}

// Legacy function for compatibility
export function calculateSkillDamage(skill: SkillGem, playerLevel: number, playerDps: number): number {
  const scaledDamage = getScaledSkillDamage(skill)
  const baseDamage = playerDps * (1 + skill.level * 0.1)
  return Math.floor(baseDamage + scaledDamage)
}

// New simplified damage calculation using the comprehensive system
export function getSkillFinalDamage(skill: SkillGem): number {
  return applyModifiersToSkill(skill).damage
}

// Comprehensive skill damage calculation that integrates character stats
export function calculateSkillDamageWithStats(skill: SkillGem, player: any): number {
  // Get base skill damage with support gem modifiers
  const modifiedSkill = applyModifiersToSkill(skill)
  let damage = modifiedSkill.damage
  
  // Get player attributes with defaults
  const attributes = player.attributes || {}
  const strength = attributes.strength || 10
  const intelligence = attributes.intelligence || 10
  const dexterity = attributes.dexterity || 10
  const luck = attributes.luck || 5
  
  // Get player's calculated stats (includes equipment and passive tree bonuses)
  const playerDps = player.dps || player.baseDps || 2
  const critChance = player.critChance || 0
  
  // Determine skill damage type based on skill tags and ID
  const isPhysicalSkill = skill.tags.includes('Physical') || 
                         ['power_strike', 'cleave', 'ground_slam', 'whirlwind'].includes(skill.id)
  const isElementalSkill = skill.tags.includes('Fire') || skill.tags.includes('Lightning') || 
                          skill.tags.includes('Cold') || 
                          ['fireball', 'lightning_bolt', 'ice_shard', 'chain_lightning', 'meteor', 'frost_nova'].includes(skill.id)
  const isProjectileSkill = skill.tags.includes('Projectile') || 
                           ['fireball', 'lightning_bolt', 'ice_shard', 'poison_arrow'].includes(skill.id)
  
  // Base damage scaling with player DPS (represents weapon damage contribution)
  const weaponDamageContribution = playerDps * 0.3 // 30% of player DPS contributes to skill damage
  damage += weaponDamageContribution
  
  // Attribute-based damage bonuses
  if (isPhysicalSkill) {
    // Strength heavily benefits physical skills
    const strengthBonus = Math.max(0, strength - 10) * 1.5
    damage += strengthBonus
    console.log(`Physical skill ${skill.name}: +${strengthBonus.toFixed(1)} damage from ${strength} strength`)
  }
  
  if (isElementalSkill) {
    // Intelligence heavily benefits elemental skills
    const intelligenceBonus = Math.max(0, intelligence - 10) * 1.8
    damage += intelligenceBonus
    console.log(`Elemental skill ${skill.name}: +${intelligenceBonus.toFixed(1)} damage from ${intelligence} intelligence`)
  }
  
  if (isProjectileSkill) {
    // Dexterity benefits projectile skills
    const dexterityBonus = Math.max(0, dexterity - 10) * 1.2
    damage += dexterityBonus
    console.log(`Projectile skill ${skill.name}: +${dexterityBonus.toFixed(1)} damage from ${dexterity} dexterity`)
  }
  
  // All skills get a small bonus from dexterity (general damage)
  const generalDexBonus = Math.max(0, dexterity - 10) * 0.5
  damage += generalDexBonus
  
  // Luck increases all skill damage slightly
  const luckBonus = Math.max(0, luck - 5) * 0.8
  damage += luckBonus
  
  // Apply equipment damage bonuses (already included in player.dps, but add direct damage bonuses)
  if (player.calculatedStats && player.calculatedStats.damage) {
    const equipmentDamageBonus = player.calculatedStats.damage * 0.4 // 40% of equipment damage applies to skills
    damage += equipmentDamageBonus
    console.log(`Skill ${skill.name}: +${equipmentDamageBonus.toFixed(1)} damage from equipment`)
  }
  
  // Apply passive tree damage bonuses
  if (player.passiveTreeData && player.passiveTreeState) {
    const passiveStats = calculatePassiveTreeStats(player.passiveTreeData, player.passiveTreeState)
    if (passiveStats.damage) {
      const passiveDamageBonus = passiveStats.damage * 0.5 // 50% of passive damage applies to skills
      damage += passiveDamageBonus
      console.log(`Skill ${skill.name}: +${passiveDamageBonus.toFixed(1)} damage from passive tree`)
    }
  }
  
  // Level scaling bonus (skills get stronger with player level)
  const levelBonus = (player.level || 1) * 0.5
  damage += levelBonus
  
  console.log(`Final damage calculation for ${skill.name}: ${Math.floor(damage)} (base: ${modifiedSkill.damage}, with stats: ${damage.toFixed(1)})`)
  
  return Math.floor(Math.max(1, damage)) // Ensure minimum 1 damage
}

export function calculateSkillManaCost(skill: SkillGem): number {
  return applyModifiersToSkill(skill).manaCost
}

export function calculateSkillCooldown(skill: SkillGem): number {
  return applyModifiersToSkill(skill).cooldown
}

export function createDefaultSkillGem(template: typeof MAIN_SKILL_GEMS[0]): SkillGem {
  // Auto-equip multiple skills by default to match skillBar initialization
  const autoEquippedSkills: string[] = ['fireball', 'lightning_bolt', 'ice_shard', 'whirlwind']
  
  return {
    ...template,
    level: 1,
    isUnlocked: true, // Auto-unlock all skill gems (unlockLevel is 0)
    isEquipped: autoEquippedSkills.includes(template.id), // Multiple skills equipped by default
    supportGems: []
  }
}

export function createDefaultSupportGem(template: typeof SUPPORT_GEMS[0]): SupportGem {
  return {
    ...template,
    level: 1,
    isUnlocked: true // Auto-unlock all support gems (unlockLevel is 0)
  }
}

export function createDefaultSkillBar(): SkillBar {
  // Create skill bar with multiple skills equipped for better auto-combat experience
  const slots = new Array(6).fill(null)
  
  // Auto-equip multiple skills for engaging combat
  const defaultSkillIds = ['fireball', 'lightning_bolt', 'ice_shard', 'whirlwind']
  
  defaultSkillIds.forEach((skillId, index) => {
    const skillTemplate = MAIN_SKILL_GEMS.find(template => template.id === skillId)
    if (skillTemplate && index < slots.length) {
      slots[index] = {
        ...createDefaultSkillGem(skillTemplate),
        isEquipped: true
      }
    }
  })
  
  return {
    slots,
    maxSlots: 6
  }
}

// Skill progression functions
export function getSkillLevelUpCost(currentLevel: number): number {
  return Math.floor(currentLevel * 1.5) + 1
}

export function canLevelUpSkill(skill: SkillGem | SupportGem, availableSkillPoints: number): boolean {
  if (skill.level >= skill.maxLevel) return false
  const cost = getSkillLevelUpCost(skill.level)
  return availableSkillPoints >= cost
}

export function getSkillUnlockCost(skill: SkillGem | SupportGem): number {
  return skill.skillPointCost
}