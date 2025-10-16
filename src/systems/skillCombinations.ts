// Skill Gem Combinations and Synergy System

import type { SkillGem, SupportGem, SkillTag } from './skillGems'

export interface SkillCombination {
  id: string
  name: string
  description: string
  requiredSkills?: string[] // Skill gem IDs that must be equipped
  requiredTags?: SkillTag[] // Alternative: require certain tags
  bonuses: CombinationBonus[]
  unlockLevel: number
  icon: string
}

export interface CombinationBonus {
  type: 'damage' | 'area' | 'speed' | 'manaCost' | 'cooldown' | 'special'
  value: number
  isPercentage: boolean
  description: string
  appliesTo?: string[] // Specific skill IDs, if empty applies to all
}

export interface SkillSynergy {
  id: string
  name: string
  description: string
  triggerSkill: string // Skill that triggers the synergy
  targetSkill: string // Skill that gets the bonus
  condition: 'onUse' | 'onKill' | 'onCrit' | 'onHit'
  bonus: SynergyBonus
  duration?: number // Duration in milliseconds, if applicable
  cooldown?: number // Cooldown between synergy triggers
}

export interface SynergyBonus {
  type: 'damage' | 'area' | 'speed' | 'heal' | 'mana' | 'cooldown' | 'special'
  value: number
  isPercentage: boolean
  description: string
}

// Skill Combinations Database
export const SKILL_COMBINATIONS: SkillCombination[] = [
  {
    id: 'elemental_mastery',
    name: 'Elemental Mastery',
    description: 'Having both Fire and Lightning skills equipped grants elemental damage bonus',
    requiredTags: ['Fire', 'Lightning'],
    bonuses: [
      {
        type: 'damage',
        value: 20,
        isPercentage: true,
        description: '+20% elemental damage'
      },
      {
        type: 'special',
        value: 10,
        isPercentage: false,
        description: '10% chance to trigger elemental explosion on kill'
      }
    ],
    unlockLevel: 5,
    icon: '🌟'
  },
  {
    id: 'melee_caster',
    name: 'Spellsword',
    description: 'Combining melee attacks with spells creates unique combat synergies',
    requiredTags: ['Melee', 'Spell'],
    bonuses: [
      {
        type: 'manaCost',
        value: -15,
        isPercentage: true,
        description: '-15% mana cost for spells'
      },
      {
        type: 'speed',
        value: 10,
        isPercentage: true,
        description: '+10% attack and cast speed'
      }
    ],
    unlockLevel: 3,
    icon: '⚔️'
  },
  {
    id: 'aoe_specialist',
    name: 'Area Specialist',
    description: 'Multiple AoE skills create devastating area control',
    requiredTags: ['AoE', 'AoE'], // Requires at least 2 AoE skills
    bonuses: [
      {
        type: 'area',
        value: 30,
        isPercentage: true,
        description: '+30% area of effect'
      },
      {
        type: 'damage',
        value: 15,
        isPercentage: true,
        description: '+15% area damage',
        appliesTo: [] // Applies to all AoE skills
      }
    ],
    unlockLevel: 4,
    icon: '💥'
  },
  {
    id: 'channeling_master',
    name: 'Channeling Master',
    description: 'Mastery of channeling skills grants sustained combat bonuses',
    requiredTags: ['Channeling'],
    bonuses: [
      {
        type: 'damage',
        value: 5,
        isPercentage: true,
        description: '+5% damage per second of channeling (max 50%)'
      },
      {
        type: 'special',
        value: 2,
        isPercentage: false,
        description: '+2% life and mana regeneration while channeling'
      }
    ],
    unlockLevel: 6,
    icon: '🔄'
  }
]

// Skill Synergies Database
export const SKILL_SYNERGIES: SkillSynergy[] = [
  {
    id: 'fire_lightning_chain',
    name: 'Elemental Chain',
    description: 'Lightning Bolt has a chance to trigger Fireball on critical hits',
    triggerSkill: 'lightning_bolt',
    targetSkill: 'fireball',
    condition: 'onCrit',
    bonus: {
      type: 'special',
      value: 25,
      isPercentage: false,
      description: '25% chance to cast Fireball on Lightning Bolt critical hit'
    },
    cooldown: 2000 // 2 second cooldown
  },
  {
    id: 'whirlwind_spell_synergy',
    name: 'Spell Weaving',
    description: 'Whirlwind hits reduce spell cooldowns',
    triggerSkill: 'whirlwind',
    targetSkill: 'all_spells',
    condition: 'onHit',
    bonus: {
      type: 'cooldown',
      value: -50,
      isPercentage: false,
      description: 'Reduces spell cooldowns by 50ms per enemy hit'
    }
  },
  {
    id: 'spell_kill_heal',
    name: 'Arcane Recovery',
    description: 'Spell kills restore mana and health',
    triggerSkill: 'all_spells',
    targetSkill: 'player',
    condition: 'onKill',
    bonus: {
      type: 'heal',
      value: 5,
      isPercentage: true,
      description: 'Restore 5% health and mana on spell kill'
    }
  },
  {
    id: 'melee_spell_momentum',
    name: 'Combat Momentum',
    description: 'Alternating between melee and spells builds momentum',
    triggerSkill: 'whirlwind',
    targetSkill: 'all_spells',
    condition: 'onUse',
    bonus: {
      type: 'damage',
      value: 10,
      isPercentage: true,
      description: '+10% spell damage for 3 seconds after using melee skill'
    },
    duration: 3000 // 3 seconds
  }
]

// Utility functions for skill combinations
export function getActiveCombinations(equippedSkills: SkillGem[]): SkillCombination[] {
  const activeCombinations: SkillCombination[] = []
  
  for (const combination of SKILL_COMBINATIONS) {
    if (isCombinationActive(combination, equippedSkills)) {
      activeCombinations.push(combination)
    }
  }
  
  return activeCombinations
}

export function isCombinationActive(combination: SkillCombination, equippedSkills: SkillGem[]): boolean {
  // Check if required skills are equipped
  if (combination.requiredSkills) {
    const equippedSkillIds = equippedSkills.map(skill => skill.id)
    return combination.requiredSkills.every(requiredId => 
      equippedSkillIds.includes(requiredId)
    )
  }
  
  // Check if required tags are present
  if (combination.requiredTags) {
    const equippedTags = equippedSkills.flatMap(skill => skill.tags)
    const tagCounts = new Map<string, number>()
    
    // Count occurrences of each tag
    equippedTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
    
    // Check if we have enough of each required tag
    const requiredTagCounts = new Map<string, number>()
    combination.requiredTags.forEach(tag => {
      requiredTagCounts.set(tag, (requiredTagCounts.get(tag) || 0) + 1)
    })
    
    for (const [tag, requiredCount] of requiredTagCounts) {
      if ((tagCounts.get(tag) || 0) < requiredCount) {
        return false
      }
    }
    
    return true
  }
  
  return false
}

export function getActiveSynergies(equippedSkills: SkillGem[]): SkillSynergy[] {
  const activeSynergies: SkillSynergy[] = []
  const equippedSkillIds = equippedSkills.map(skill => skill.id)
  
  for (const synergy of SKILL_SYNERGIES) {
    // Check if both trigger and target skills are equipped (or if target is 'all_spells'/'player')
    const hasTrigger = equippedSkillIds.includes(synergy.triggerSkill) || synergy.triggerSkill === 'all_spells'
    const hasTarget = synergy.targetSkill === 'all_spells' || 
                     synergy.targetSkill === 'player' || 
                     equippedSkillIds.includes(synergy.targetSkill)
    
    if (hasTrigger && hasTarget) {
      activeSynergies.push(synergy)
    }
  }
  
  return activeSynergies
}

export function calculateCombinationBonuses(combinations: SkillCombination[], skillId?: string): {
  damageMultiplier: number
  areaMultiplier: number
  speedMultiplier: number
  manaCostMultiplier: number
  cooldownMultiplier: number
  specialEffects: string[]
} {
  let damageMultiplier = 1
  let areaMultiplier = 1
  let speedMultiplier = 1
  let manaCostMultiplier = 1
  let cooldownMultiplier = 1
  const specialEffects: string[] = []
  
  for (const combination of combinations) {
    for (const bonus of combination.bonuses) {
      // Check if bonus applies to this skill (if skillId is provided)
      if (skillId && bonus.appliesTo && bonus.appliesTo.length > 0) {
        if (!bonus.appliesTo.includes(skillId)) {
          continue
        }
      }
      
      const value = bonus.isPercentage ? bonus.value / 100 : bonus.value
      
      switch (bonus.type) {
        case 'damage':
          damageMultiplier *= bonus.isPercentage ? (1 + value) : (1 + value / 100)
          break
        case 'area':
          areaMultiplier *= bonus.isPercentage ? (1 + value) : (1 + value / 100)
          break
        case 'speed':
          speedMultiplier *= bonus.isPercentage ? (1 + value) : (1 + value / 100)
          break
        case 'manaCost':
          manaCostMultiplier *= bonus.isPercentage ? (1 + value) : (1 + value / 100)
          break
        case 'cooldown':
          cooldownMultiplier *= bonus.isPercentage ? (1 + value) : (1 + value / 100)
          break
        case 'special':
          specialEffects.push(bonus.description)
          break
      }
    }
  }
  
  return {
    damageMultiplier,
    areaMultiplier,
    speedMultiplier,
    manaCostMultiplier,
    cooldownMultiplier,
    specialEffects
  }
}