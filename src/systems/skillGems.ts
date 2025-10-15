// Skill Gem System Types and Data

export type SkillGemType = 'active' | 'support'
export type SkillGemCategory = 'attack' | 'spell' | 'aura' | 'movement' | 'utility'
export type SupportGemCategory = 'damage' | 'area' | 'projectile' | 'duration' | 'utility'

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

// Main Skill Gems Database
export const MAIN_SKILL_GEMS: Omit<SkillGem, 'level' | 'isUnlocked' | 'isEquipped' | 'supportGems'>[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a fiery projectile that explodes on impact',
    type: 'active',
    category: 'spell',
    maxLevel: 20,
    unlockLevel: 1,
    skillPointCost: 1,
    manaCost: 8,
    cooldown: 1000,
    icon: '🔥',
    scaling: {
      baseDamage: 15,
      damagePerLevel: 3,
      baseManaCost: 8,
      manaCostPerLevel: 0.5,
      baseCooldown: 1000,
      cooldownReductionPerLevel: 20,
      baseArea: 1.0,
      areaPerLevel: 0.05
    }
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    description: 'Strikes enemies with a bolt of lightning',
    type: 'active',
    category: 'spell',
    maxLevel: 20,
    unlockLevel: 3,
    skillPointCost: 1,
    manaCost: 6,
    cooldown: 800,
    icon: '⚡',
    scaling: {
      baseDamage: 12,
      damagePerLevel: 2.5,
      baseManaCost: 6,
      manaCostPerLevel: 0.3,
      baseCooldown: 800,
      cooldownReductionPerLevel: 15
    }
  },
  {
    id: 'ice_shard',
    name: 'Ice Shard',
    description: 'Fires sharp ice projectiles that slow enemies',
    type: 'active',
    category: 'spell',
    maxLevel: 20,
    unlockLevel: 5,
    skillPointCost: 1,
    manaCost: 7,
    cooldown: 900,
    icon: '❄️',
    scaling: {
      baseDamage: 10,
      damagePerLevel: 2,
      baseManaCost: 7,
      manaCostPerLevel: 0.4,
      baseCooldown: 900,
      cooldownReductionPerLevel: 18,
      baseDuration: 3000,
      durationPerLevel: 100
    }
  },
  {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A powerful melee attack that deals increased damage',
    type: 'active',
    category: 'attack',
    maxLevel: 20,
    unlockLevel: 2,
    skillPointCost: 1,
    manaCost: 4,
    cooldown: 1200,
    icon: '⚔️',
    scaling: {
      baseDamage: 20,
      damagePerLevel: 4,
      baseManaCost: 4,
      manaCostPerLevel: 0.2,
      baseCooldown: 1200,
      cooldownReductionPerLevel: 25
    }
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'Spin attack that hits all nearby enemies',
    type: 'active',
    category: 'attack',
    maxLevel: 20,
    unlockLevel: 8,
    skillPointCost: 2,
    manaCost: 12,
    cooldown: 2000,
    icon: '🌪️',
    scaling: {
      baseDamage: 8,
      damagePerLevel: 1.5,
      baseManaCost: 12,
      manaCostPerLevel: 0.6,
      baseCooldown: 2000,
      cooldownReductionPerLevel: 40,
      baseArea: 2.0,
      areaPerLevel: 0.1
    }
  },
  {
    id: 'teleport',
    name: 'Teleport',
    description: 'Instantly move to target location',
    type: 'active',
    category: 'movement',
    maxLevel: 20,
    unlockLevel: 6,
    skillPointCost: 1,
    manaCost: 15,
    cooldown: 3000,
    icon: '✨',
    scaling: {
      baseManaCost: 15,
      manaCostPerLevel: -0.3,
      baseCooldown: 3000,
      cooldownReductionPerLevel: 60
    }
  },
  {
    id: 'heal',
    name: 'Heal',
    description: 'Restore health over time',
    type: 'active',
    category: 'utility',
    maxLevel: 20,
    unlockLevel: 4,
    skillPointCost: 1,
    manaCost: 10,
    cooldown: 5000,
    icon: '💚',
    scaling: {
      baseDamage: 25, // Healing amount
      damagePerLevel: 5,
      baseManaCost: 10,
      manaCostPerLevel: 0.3,
      baseCooldown: 5000,
      cooldownReductionPerLevel: 100,
      baseDuration: 5000,
      durationPerLevel: 200
    }
  },
  {
    id: 'shield',
    name: 'Magic Shield',
    description: 'Creates a protective barrier that absorbs damage',
    type: 'active',
    category: 'utility',
    maxLevel: 20,
    unlockLevel: 7,
    skillPointCost: 2,
    manaCost: 20,
    cooldown: 8000,
    icon: '🛡️',
    scaling: {
      baseDamage: 50, // Shield amount
      damagePerLevel: 10,
      baseManaCost: 20,
      manaCostPerLevel: 0.5,
      baseCooldown: 8000,
      cooldownReductionPerLevel: 150,
      baseDuration: 10000,
      durationPerLevel: 300
    }
  }
]

// Support Gems Database
export const SUPPORT_GEMS: Omit<SupportGem, 'level' | 'isUnlocked'>[] = [
  {
    id: 'increased_damage',
    name: 'Increased Damage',
    description: 'Increases damage of supported skills',
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
    isUnlocked: template.id === 'fireball', // Unlock Fireball by default for testing
    isEquipped: false,
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
  return {
    slots: new Array(6).fill(null),
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