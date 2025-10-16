// Skill Gem System Types and Data

export type SkillGemType = 'active' | 'support'
export type SkillGemCategory = 'attack' | 'spell' | 'aura' | 'movement' | 'utility'
export type SupportGemCategory = 'damage' | 'area' | 'projectile' | 'duration' | 'utility'

// Path of Exile inspired skill tags
export type SkillTag = 
  // Core types
  | 'Attack' | 'Spell' | 'Aura' | 'Curse' | 'Warcry'
  // Damage types
  | 'Physical' | 'Fire' | 'Cold' | 'Lightning' | 'Chaos'
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
  unlockLevel: number // Player level required to unlock
  skillPointCost: number // Cost to unlock
  manaCost: number
  cooldown: number // in milliseconds
  isUnlocked: boolean
  isEquipped: boolean
  supportGems: SupportGem[] // Only for active skills
  icon: string // Icon identifier
  scaling: SkillScaling // Scaling mechanics
}

export interface SupportGem {
  id: string
  name: string
  description: string
  tags: SkillTag[] // Support gems can also have tags
  level: number
  maxLevel: number
  unlockLevel: number
  skillPointCost: number
  isUnlocked: boolean
  modifiers: SkillModifier[]
  icon: string
  scaling?: {
    baseValue: number
    valuePerLevel: number
  }
}

export interface SkillModifier {
  type: 'damage' | 'area' | 'projectiles' | 'speed' | 'duration' | 'manaCost' | 'cooldown'
  value: number
  isPercentage: boolean
  description: string
}

export interface SkillBar {
  slots: (SkillGem | null)[]
  maxSlots: number
}

// Main Skill Gems Database - Optimized for Whirlwind-only combat
export const MAIN_SKILL_GEMS: Omit<SkillGem, 'level' | 'isUnlocked' | 'isEquipped' | 'supportGems'>[] = [
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Continuous spinning attack that hits all nearby enemies. Inspired by Path of Exile\'s Cyclone skill - channels automatically during combat with area scaling and movement.',
    type: 'active',
    category: 'attack',
    tags: ['Attack', 'AoE', 'Channeling', 'Melee', 'Physical'], // Path of Exile style tags
    maxLevel: 20,
    unlockLevel: 1, // Available from start
    skillPointCost: 0, // Free to unlock
    manaCost: 8, // Reduced mana cost for continuous use
    cooldown: 0, // No cooldown for continuous channeling
    icon: '🌪️',
    scaling: {
      baseDamage: 12, // Increased base damage
      damagePerLevel: 2.5, // Better scaling per level
      baseManaCost: 8,
      manaCostPerLevel: 0.3, // Slower mana cost growth
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
    unlockLevel: 1, // Available from start for testing
    skillPointCost: 0, // Free to unlock for testing
    manaCost: 12,
    cooldown: 1000, // 1 second cooldown
    icon: '🔥',
    scaling: {
      baseDamage: 15,
      damagePerLevel: 3,
      baseManaCost: 12,
      manaCostPerLevel: 0.5,
      baseCooldown: 1000,
      cooldownReductionPerLevel: 20,
      baseArea: 1.5,
      areaPerLevel: 0.1
    }
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    description: 'Strikes a single enemy with a bolt of lightning, dealing high electrical damage.',
    type: 'active',
    category: 'spell',
    tags: ['Spell', 'Lightning'],
    maxLevel: 20,
    unlockLevel: 1, // Available from start for testing
    skillPointCost: 0, // Free to unlock for testing
    manaCost: 10,
    cooldown: 800, // 0.8 second cooldown
    icon: '⚡',
    scaling: {
      baseDamage: 20,
      damagePerLevel: 4,
      baseManaCost: 10,
      manaCostPerLevel: 0.4,
      baseCooldown: 800,
      cooldownReductionPerLevel: 15
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
    unlockLevel: 2,
    skillPointCost: 1,
    modifiers: [
      {
        type: 'damage',
        value: 15,
        isPercentage: true,
        description: '+15% more damage'
      }
    ],
    icon: '💪',
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
    unlockLevel: 3,
    skillPointCost: 1,
    modifiers: [
      {
        type: 'area',
        value: 25,
        isPercentage: true,
        description: '+25% increased area of effect'
      }
    ],
    icon: '📏',
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
    unlockLevel: 4,
    skillPointCost: 1,
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
    unlockLevel: 5,
    skillPointCost: 1,
    modifiers: [
      {
        type: 'cooldown',
        value: -25,
        isPercentage: true,
        description: '-25% reduced cooldown'
      }
    ],
    icon: '⏱️',
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
    unlockLevel: 6,
    skillPointCost: 1,
    modifiers: [
      {
        type: 'manaCost',
        value: -30,
        isPercentage: true,
        description: '-30% reduced mana cost'
      }
    ],
    icon: '💙',
    scaling: {
      baseValue: 30,
      valuePerLevel: 1
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
  if (!skill.scaling.baseDamage) return 0
  return Math.floor(skill.scaling.baseDamage + (skill.scaling.damagePerLevel || 0) * (skill.level - 1))
}

export function getScaledManaCost(skill: SkillGem): number {
  const baseManaCost = skill.scaling.baseManaCost || skill.manaCost
  const manaCostPerLevel = skill.scaling.manaCostPerLevel || 0
  return Math.max(1, Math.floor(baseManaCost + manaCostPerLevel * (skill.level - 1)))
}

export function getScaledCooldown(skill: SkillGem): number {
  const baseCooldown = skill.scaling.baseCooldown || skill.cooldown
  const cooldownReduction = skill.scaling.cooldownReductionPerLevel || 0
  return Math.max(100, Math.floor(baseCooldown - cooldownReduction * (skill.level - 1)))
}

export function getScaledArea(skill: SkillGem): number {
  const baseArea = skill.scaling.baseArea || 1.0
  const areaPerLevel = skill.scaling.areaPerLevel || 0
  return baseArea + areaPerLevel * (skill.level - 1)
}

export function getScaledDuration(skill: SkillGem): number {
  const baseDuration = skill.scaling.baseDuration || 0
  const durationPerLevel = skill.scaling.durationPerLevel || 0
  return Math.floor(baseDuration + durationPerLevel * (skill.level - 1))
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
      `${modifier.value < 0 ? '-' : '+'}${scaledValue}${modifier.isPercentage ? '%' : ''} ${modifier.description.split(' ').slice(-2).join(' ')}` :
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
  // Start with base scaled values
  let damage = getScaledSkillDamage(skill)
  let manaCost = getScaledManaCost(skill)
  let cooldown = getScaledCooldown(skill)
  let area = getScaledArea(skill)
  let duration = getScaledDuration(skill)
  let projectileCount = 1

  // Apply support gem modifiers
  skill.supportGems.forEach(support => {
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
    manaCost: Math.max(1, Math.round(manaCost)),
    cooldown: Math.max(100, Math.round(cooldown)),
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

export function calculateSkillManaCost(skill: SkillGem): number {
  return applyModifiersToSkill(skill).manaCost
}

export function calculateSkillCooldown(skill: SkillGem): number {
  return applyModifiersToSkill(skill).cooldown
}

export function createDefaultSkillGem(template: typeof MAIN_SKILL_GEMS[0]): SkillGem {
  return {
    ...template,
    level: 1,
    isUnlocked: template.id === 'whirlwind', // Unlock Whirlwind by default
    isEquipped: template.id === 'whirlwind', // Equip Whirlwind by default
    supportGems: []
  }
}

export function createDefaultSupportGem(template: typeof SUPPORT_GEMS[0]): SupportGem {
  return {
    ...template,
    level: 1,
    isUnlocked: false
  }
}

export function createDefaultSkillBar(): SkillBar {
  // Create the default Whirlwind skill for slot 0
  const whirlwindTemplate = MAIN_SKILL_GEMS.find(template => template.id === 'whirlwind')
  const defaultWhirlwind = whirlwindTemplate ? createDefaultSkillGem(whirlwindTemplate) : null
  
  // Initialize slots with Whirlwind in the first slot
  const slots = new Array(6).fill(null)
  if (defaultWhirlwind) {
    slots[0] = defaultWhirlwind
  }
  
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