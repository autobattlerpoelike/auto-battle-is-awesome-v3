import { Equipment, EquipmentSlot, Attribute, EquipmentStats } from './equipment'
import { SkillGem, SupportGem, SkillBar, MAIN_SKILL_GEMS, SUPPORT_GEMS, createDefaultSkillGem, createDefaultSupportGem, createDefaultSkillBar } from './skillGems'
import { MapDevice, createDefaultMapDevice } from './mapping'
import { PassiveTreeState, PassiveTreeData, generatePassiveTree, calculatePassiveTreeStats, getSkillModifiersFromTree } from './passiveTree'
import { Stone } from './stones'
import { calculateStoneStats } from '../utils/equipmentTooltip'

export type Player = {
  id: string
  level: number
  xp: number
  nextLevelXp: number
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  dps: number
  baseDps: number
  gold: number
  skillPoints: number
  attributePoints: number
  
  // Character Attributes
  attributes: Record<Attribute, number>
  
  // Character Appearance
  characterModel?: string // Character sprite model ID (e.g., 'human_male', 'knight_1', etc.)
  gender?: 'male' | 'female'
  race?: 'human' | 'elf' | 'dwarf' | 'orc'
  cosmetics?: Record<string, any>
  
  // Equipment slots
  equipment: Partial<Record<EquipmentSlot, Equipment>>
  
  // Legacy support
  equipped?: any
  
  // Calculated stats (derived from equipment and attributes)
  calculatedStats: EquipmentStats
  
  // Skill Gem System
  skillGems: SkillGem[]
  supportGems: SupportGem[]
  skillBar: SkillBar
  skillCooldowns?: Record<string, number> // Track last usage time for each skill
  
  // Endgame Mapping System
  mapDevice: MapDevice
  
  // Passive Skill Tree System
  passiveTreeState: PassiveTreeState
  passiveTreeData: PassiveTreeData
  
  // Stone Inventory System
  stones: Stone[]
  
  // Base stats
  attackSpeed?: number
  projectileSpeed?: number
  skills?: Record<string, number>
  armor?: number
  critChance?: number
  dodgeChance?: number
  lifeSteal?: number
  blockChance?: number
  healthRegen?: number
  manaRegen?: number
}

export const skillDescriptions = {
  endurance: 'Increases maximum HP by 10 per level',
  quick: 'Reduces combat tick interval (faster attacks)',
  agility: 'Increases dodge chance by 1% per level',
  strength: 'Increases base damage by 1 per level',
  vitality: 'Increases HP regeneration and reduces death penalty',
  precision: 'Increases critical hit chance by 1% per level',
  fortune: 'Increases gold gain and improves loot quality',
  resilience: 'Increases armor and status effect resistance'
}

export function defaultPlayer(): Player {
  // Create skill gems and support gems first
  const skillGems = MAIN_SKILL_GEMS.map(template => createDefaultSkillGem(template))
  const supportGems = SUPPORT_GEMS.map(template => createDefaultSupportGem(template))
  
  // Create empty skill bar - no skills equipped by default
  const skillBar = createDefaultSkillBar()
  
  return {
    level: 10,
    xp: 0,
    nextLevelXp: 100,
    hp: 120,
    maxHp: 120,
    mana: 50,
    maxMana: 50,
    dps: 2,
    baseDps: 2,
    gold: 0,
    skillPoints: 20, // Starting with skill points for testing
    attributePoints: 5, // Starting attribute points
    
    // Starting attributes
    attributes: {
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      vitality: 10,
      luck: 5
    },
    
    // Character Appearance
    characterModel: 'human_male', // Default character model
    gender: 'male',
    race: 'human',
    cosmetics: {},
    
    // Empty equipment slots
    equipment: {},
    
    // Legacy support
    equipped: undefined,
    
    // Calculated stats (will be computed)
    calculatedStats: {},
    
    // Skill Gem System - Use the created skill gems and skill bar
    skillGems,
    supportGems,
    skillBar,
    
    // Endgame Mapping System
    mapDevice: createDefaultMapDevice(),
    
    // Passive Skill Tree System
    passiveTreeState: {
      allocatedNodes: { 'start': 1 }, // Start with the origin node allocated
      availablePoints: 10 // Starting passive points
    },
    passiveTreeData: generatePassiveTree(),
    
    // Stone Inventory System
    stones: [],
    
    // Base stats
    attackSpeed: 1,
    projectileSpeed: 1,
    skills: {},
    armor: 0,
    critChance: 0,
    dodgeChance: 0,
    lifeSteal: 0,
    blockChance: 0,
    healthRegen: 1,
    manaRegen: 2
  }
}

export function calculatePlayerStats(basePlayer: Player): Player {
  if (!basePlayer) {
    return defaultPlayer()
  }
  const player = { ...basePlayer }
  
  // Ensure gold is always a valid number
  if (typeof player.gold !== 'number' || isNaN(player.gold)) {
    console.warn('Player gold was invalid:', player.gold, 'resetting to 0')
    player.gold = 0
  }
  
  // Ensure equipment is always properly initialized
  if (!player.equipment || typeof player.equipment !== 'object') {
    console.warn('Player equipment was invalid:', player.equipment, 'resetting to empty object')
    player.equipment = {}
  }
  
  // Initialize calculated stats
  player.calculatedStats = {}
  
  // Reset to base values to prevent infinite accumulation
  player.baseDps = 2 // Original base DPS
  player.maxHp = 120 // Original base HP
  player.maxMana = 50 // Original base mana
  player.dps = 2 // Will be calculated from baseDps + equipment
  player.armor = 0
  player.critChance = 0
  player.dodgeChance = 0
  player.blockChance = 0
  player.lifeSteal = 0
  player.attackSpeed = 1
  player.healthRegen = 0
  player.manaRegen = 0
  player.projectileSpeed = 1
  
  // Apply attribute bonuses to base stats
  const attrs = player.attributes ?? {}
  
  // Strength: +1 damage per point, +2 HP per point
  const strBonus = (attrs.strength ?? 10) - 10 // Base is 10
  player.baseDps += Math.max(0, strBonus)
  player.maxHp += strBonus * 2
  
  // Dexterity: +0.5% crit chance per point, +0.3% dodge per point
  const dexBonus = (attrs.dexterity ?? 10) - 10
  player.critChance += (dexBonus * 0.005)
  player.dodgeChance += (dexBonus * 0.003)
  
  // Intelligence: +1 mana per point, +0.2 mana regen per point
  const intBonus = (attrs.intelligence ?? 10) - 10
  player.maxMana += intBonus
  player.manaRegen += (intBonus * 0.2)
  
  // Vitality: +3 HP per point, +0.1 HP regen per point
  const vitBonus = (attrs.vitality ?? 10) - 10
  player.maxHp += vitBonus * 3
  player.healthRegen += (vitBonus * 0.1)
  
  // Luck: +0.5% crit chance per point, affects loot quality
  const luckBonus = (attrs.luck ?? 5) - 5 // Base is 5
  player.critChance += (luckBonus * 0.005)
  
  // Apply skill bonuses (legacy system)
  const skills = player.skills ?? {}
  
  if (skills.strength) {
    player.baseDps += skills.strength
  }
  if (skills.precision) {
    player.critChance = (player.critChance ?? 0) + (skills.precision * 0.01)
  }
  if (skills.agility) {
    player.dodgeChance = (player.dodgeChance ?? 0) + (skills.agility * 0.01)
  }
  if (skills.resilience) {
    player.armor = (player.armor ?? 0) + skills.resilience
  }
  
  // Apply equipment bonuses from new system with optimized calculation
  let totalEquipmentStats: EquipmentStats = {}
  
  // Ensure equipment exists before processing
  if (player.equipment) {
    // Pre-allocate stats object for better performance
    const statsAccumulator: Record<string, number> = {}
    
    Object.values(player.equipment).forEach(equipment => {
      if (equipment) {
        // Apply base stats efficiently
        for (const [stat, value] of Object.entries(equipment.baseStats)) {
          if (typeof value === 'number' && stat !== 'resistance') {
            statsAccumulator[stat] = (statsAccumulator[stat] ?? 0) + value
          }
        }
        
        // Apply affix stats efficiently
        for (const affix of equipment.affixes) {
          if (affix.stat !== 'resistance') {
            statsAccumulator[affix.stat] = (statsAccumulator[affix.stat] ?? 0) + affix.value
          }
        }
        
        // Add socketed stone stats
        if (equipment.sockets && player.stones) {
          const stoneStats = calculateStoneStats(equipment, player.stones)
          for (const [stat, value] of Object.entries(stoneStats)) {
            if (typeof value === 'number' && stat !== 'resistance') {
              statsAccumulator[stat] = (statsAccumulator[stat] ?? 0) + value
            }
          }
        }
      }
    })
    
    // Convert accumulator to typed stats object
    totalEquipmentStats = statsAccumulator as EquipmentStats
  }
  
  // Calculate passive tree stats
  let passiveTreeStats: EquipmentStats = {}
  if (player.passiveTreeData && player.passiveTreeState) {
    passiveTreeStats = calculatePassiveTreeStats(player.passiveTreeData, player.passiveTreeState)
  }

  // Apply equipment stats to player
  const equipmentDamage = totalEquipmentStats.damage ?? 0
  const passiveDamage = passiveTreeStats.damage ?? 0
  player.dps = player.baseDps + equipmentDamage + passiveDamage
  
  player.armor += (totalEquipmentStats.armor ?? 0) + (passiveTreeStats.armor ?? 0)
  player.maxHp += (totalEquipmentStats.health ?? 0) + (passiveTreeStats.health ?? 0)
  player.maxMana += (totalEquipmentStats.mana ?? 0) + (passiveTreeStats.mana ?? 0)
  player.critChance += (totalEquipmentStats.critChance ?? 0) + (passiveTreeStats.critChance ?? 0)
  player.dodgeChance += (totalEquipmentStats.dodgeChance ?? 0) + (passiveTreeStats.dodgeChance ?? 0)
  player.blockChance += (totalEquipmentStats.blockChance ?? 0) + (passiveTreeStats.blockChance ?? 0)
  player.lifeSteal += (totalEquipmentStats.lifeSteal ?? 0) + (passiveTreeStats.lifeSteal ?? 0)
  player.attackSpeed += (totalEquipmentStats.attackSpeed ?? 0) + (passiveTreeStats.attackSpeed ?? 0)
  player.healthRegen += (totalEquipmentStats.healthRegen ?? 0) + (passiveTreeStats.healthRegen ?? 0)
  player.manaRegen += (totalEquipmentStats.manaRegen ?? 0) + (passiveTreeStats.manaRegen ?? 0)
  
  // Apply attribute bonuses from base attributes, equipment, and passive tree
  const totalStrBonus = (player.attributes.strength ?? 0) + (totalEquipmentStats.strength ?? 0) + (passiveTreeStats.strength ?? 0)
  const totalDexBonus = (player.attributes.dexterity ?? 0) + (totalEquipmentStats.dexterity ?? 0) + (passiveTreeStats.dexterity ?? 0)
  const totalIntBonus = (player.attributes.intelligence ?? 0) + (totalEquipmentStats.intelligence ?? 0) + (passiveTreeStats.intelligence ?? 0)
  const totalVitBonus = (player.attributes.vitality ?? 0) + (totalEquipmentStats.vitality ?? 0) + (passiveTreeStats.vitality ?? 0)
  const totalLuckBonus = (player.attributes.luck ?? 0) + (totalEquipmentStats.luck ?? 0) + (passiveTreeStats.luck ?? 0)
  
  if (totalStrBonus) {
    player.baseDps += totalStrBonus
    player.maxHp += totalStrBonus * 2
  }
  if (totalDexBonus) {
    player.critChance += totalDexBonus * 0.005
    player.dodgeChance += totalDexBonus * 0.003
  }
  if (totalIntBonus) {
    player.maxMana += totalIntBonus
    player.manaRegen += totalIntBonus * 0.2
  }
  if (totalVitBonus) {
    player.maxHp += totalVitBonus * 3
    player.healthRegen += totalVitBonus * 0.1
  }
  if (totalLuckBonus) {
    player.critChance += totalLuckBonus * 0.005
  }
  
  // Store calculated stats for reference (equipment + passive tree stats)
  player.calculatedStats = {
    ...totalEquipmentStats
  }
  
  // Merge passive tree stats into calculatedStats
  if (passiveTreeStats) {
    Object.entries(passiveTreeStats).forEach(([stat, value]) => {
      if (typeof value === 'number') {
        const currentValue = player.calculatedStats[stat as keyof EquipmentStats] as number || 0
        player.calculatedStats[stat as keyof EquipmentStats] = currentValue + value
      }
    })
  }
  
  // Legacy equipment support
  if (player.equipped) {
    player.dps += (player.equipped.power ?? 0)
    
    if (player.equipped.extras) {
      for (const extra of player.equipped.extras) {
        switch (extra.key) {
          case 'hp':
            player.maxHp += extra.val
            break
          case 'dps':
            player.dps += extra.val
            break
          case 'critChance':
            player.critChance += extra.val
            break
          case 'dodgeChance':
            player.dodgeChance += extra.val
            break
          case 'lifeSteal':
            player.lifeSteal += extra.val
            break
          case 'armor':
            player.armor += extra.val
            break
          case 'projectileSpeed':
            player.projectileSpeed += extra.val
            break
        }
      }
    }
  }
  
  // Ensure HP and mana don't exceed maximums
  player.hp = Math.min(player.hp, player.maxHp)
  player.mana = Math.min(player.mana, player.maxMana)
  
  // Ensure stats don't go below minimums
  player.critChance = Math.max(0, Math.min(1, player.critChance ?? 0))
  player.dodgeChance = Math.max(0, Math.min(0.95, player.dodgeChance ?? 0))
  player.blockChance = Math.max(0, Math.min(0.75, player.blockChance ?? 0))
  player.lifeSteal = Math.max(0, Math.min(1, player.lifeSteal ?? 0))
  
  return player
}

// Test function to verify stone stats integration
export function testStoneStatsIntegration(player: Player): void {
  console.log('=== Stone Stats Integration Test ===')
  console.log('Player stones:', player.stones?.length || 0)
  
  if (player.equipment) {
    Object.entries(player.equipment).forEach(([slot, equipment]) => {
      if (equipment?.sockets?.stones) {
        const socketedStones = equipment.sockets.stones.filter(id => id !== null)
        console.log(`${slot}: ${equipment.name} has ${socketedStones.length} socketed stones`)
        
        if (socketedStones.length > 0 && player.stones) {
          const stoneStats = calculateStoneStats(equipment, player.stones)
          console.log(`  Stone stats:`, stoneStats)
        }
      }
    })
  }
  
  console.log('Final player stats:')
  console.log(`  DPS: ${player.dps}`)
  console.log(`  Armor: ${player.armor}`)
  console.log(`  Max HP: ${player.maxHp}`)
  console.log(`  Crit Chance: ${player.critChance}`)
  console.log('=== End Test ===')
}

// Make test function available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testStoneStats = testStoneStatsIntegration
}
