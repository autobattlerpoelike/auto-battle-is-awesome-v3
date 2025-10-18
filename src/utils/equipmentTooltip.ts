// Equipment Tooltip Utilities
import { Equipment, EquipmentStats } from '../systems/equipment'
import { Stone } from '../systems/stones'

// Equipment calculation cache
interface EquipmentCache {
  stoneStats: Map<string, { result: EquipmentStats; timestamp: number }>
  totalStats: Map<string, { result: EquipmentStats; timestamp: number }>
}

const equipmentCache: EquipmentCache = {
  stoneStats: new Map(),
  totalStats: new Map()
}

const EQUIPMENT_CACHE_TTL = 30000 // 30 seconds cache TTL

// Generate cache key for stone stats calculation
function generateStoneStatsCacheKey(equipment: Equipment, stones: Stone[]): string {
  const socketedStoneIds = equipment.sockets?.stones?.filter(id => id !== null) || []
  const relevantStones = stones.filter(stone => socketedStoneIds.includes(stone.id))
  return JSON.stringify({
    equipmentId: equipment.id,
    socketedStones: relevantStones.map(stone => ({
      id: stone.id,
      baseStats: stone.baseStats,
      affixes: stone.affixes
    }))
  })
}

// Generate cache key for total equipment stats calculation
function generateTotalStatsCacheKey(equipment: Equipment, stones: Stone[]): string {
  return JSON.stringify({
    equipmentId: equipment.id,
    baseStats: equipment.baseStats,
    affixes: equipment.affixes,
    stoneKey: generateStoneStatsCacheKey(equipment, stones)
  })
}

// Memoized version of calculateStoneStats
function calculateStoneStatsMemoized(equipment: Equipment, stones: Stone[]): EquipmentStats {
  const cacheKey = generateStoneStatsCacheKey(equipment, stones)
  const now = Date.now()
  
  // Check cache
  const cached = equipmentCache.stoneStats.get(cacheKey)
  if (cached && (now - cached.timestamp) < EQUIPMENT_CACHE_TTL) {
    return cached.result
  }
  
  // Calculate and cache result
  const result = calculateStoneStatsInternal(equipment, stones)
  equipmentCache.stoneStats.set(cacheKey, { result, timestamp: now })
  
  // Clean old cache entries periodically
  if (equipmentCache.stoneStats.size > 50) {
    for (const [key, value] of equipmentCache.stoneStats.entries()) {
      if ((now - value.timestamp) > EQUIPMENT_CACHE_TTL) {
        equipmentCache.stoneStats.delete(key)
      }
    }
  }
  
  return result
}

// Internal implementation of stone stats calculation
function calculateStoneStatsInternal(equipment: Equipment, stones: Stone[]): EquipmentStats {
  const stoneStats: EquipmentStats = {}
  
  if (!equipment.sockets?.stones) {
    return stoneStats
  }
  
  // Get all socketed stones for this equipment
  const socketedStones = equipment.sockets.stones
    .filter(stoneId => stoneId !== null)
    .map(stoneId => stones.find(stone => stone.id === stoneId))
    .filter(stone => stone !== undefined) as Stone[]
  
  // Accumulate stats from all socketed stones
  socketedStones.forEach(stone => {
    // Add base stats from stone
    Object.entries(stone.baseStats).forEach(([stat, value]) => {
      if (typeof value === 'number') {
        const current = stoneStats[stat as keyof EquipmentStats]
        if (typeof current === 'number' && typeof value === 'number') {
          stoneStats[stat as keyof EquipmentStats] = current + value
        } else if (typeof value === 'number') {
          stoneStats[stat as keyof EquipmentStats] = value
        }
      }
    })
    
    // Add affix stats from stone
    stone.affixes.forEach(affix => {
      const stat = affix.stat as keyof EquipmentStats
      const value = affix.value
      if (typeof value === 'number') {
        const current = stoneStats[stat]
        if (typeof current === 'number' && typeof value === 'number') {
          stoneStats[stat] = current + value
        } else if (typeof value === 'number') {
          stoneStats[stat] = value
        }
      }
    })
  })
  
  return stoneStats
}

// Calculate total stats from socketed stones (now uses memoized version)
export function calculateStoneStats(equipment: Equipment, stones: Stone[]): EquipmentStats {
  return calculateStoneStatsMemoized(equipment, stones)
}

// Memoized version of calculateTotalEquipmentStats
function calculateTotalEquipmentStatsMemoized(equipment: Equipment, stones: Stone[]): EquipmentStats {
  const cacheKey = generateTotalStatsCacheKey(equipment, stones)
  const now = Date.now()
  
  // Check cache
  const cached = equipmentCache.totalStats.get(cacheKey)
  if (cached && (now - cached.timestamp) < EQUIPMENT_CACHE_TTL) {
    return cached.result
  }
  
  // Calculate and cache result
  const result = calculateTotalEquipmentStatsInternal(equipment, stones)
  equipmentCache.totalStats.set(cacheKey, { result, timestamp: now })
  
  // Clean old cache entries periodically
  if (equipmentCache.totalStats.size > 50) {
    for (const [key, value] of equipmentCache.totalStats.entries()) {
      if ((now - value.timestamp) > EQUIPMENT_CACHE_TTL) {
        equipmentCache.totalStats.delete(key)
      }
    }
  }
  
  return result
}

// Internal implementation of total equipment stats calculation
function calculateTotalEquipmentStatsInternal(equipment: Equipment, stones: Stone[]): EquipmentStats {
  const totalStats: EquipmentStats = {}
  
  // Add base stats
  Object.entries(equipment.baseStats).forEach(([stat, value]) => {
    if (typeof value === 'number') {
      totalStats[stat as keyof EquipmentStats] = value
    }
  })
  
  // Add affix stats
  equipment.affixes.forEach(affix => {
    const stat = affix.stat as keyof EquipmentStats
    const value = affix.value
    if (typeof value === 'number') {
      const current = totalStats[stat]
      if (typeof current === 'number') {
        totalStats[stat] = current + value
      } else {
        totalStats[stat] = value
      }
    }
  })
  
  // Add stone stats
  const stoneStats = calculateStoneStats(equipment, stones)
  Object.entries(stoneStats).forEach(([stat, value]) => {
    if (typeof value === 'number') {
      const current = totalStats[stat as keyof EquipmentStats]
      if (typeof current === 'number' && typeof value === 'number') {
        totalStats[stat as keyof EquipmentStats] = current + value
      } else if (typeof value === 'number') {
        totalStats[stat as keyof EquipmentStats] = value
      }
    }
  })
  
  return totalStats
}

// Calculate total equipment stats including base, affixes, and stones (now uses memoized version)
export function calculateTotalEquipmentStats(equipment: Equipment, stones: Stone[]): EquipmentStats {
  return calculateTotalEquipmentStatsMemoized(equipment, stones)
}

// Format stat value for display
export function formatStatValue(stat: string, value: number): string {
  // Handle percentage stats
  const percentageStats = [
    'critChance', 'dodgeChance', 'blockChance', 'lifeSteal', 'manaSteal',
    'fireResistance', 'coldResistance', 'lightningResistance', 'chaosResistance',
    'iceResistance', 'poisonResistance', 'spellResistance', 'stunResistance',
    'increasedDamage', 'increasedAttackSpeed', 'increasedCastSpeed',
    'increasedMovementSpeed', 'increasedCritMultiplier', 'attackSpeed',
    'goldFind', 'magicFind', 'experienceBonus', 'armorPenetration',
    'damageMultiplier', 'stunChance', 'damageReduction', 'movementSpeed',
    'reflectDamage', 'doubleDropChance', 'cleaveChance', 'cooldownReduction'
  ]
  
  if (percentageStats.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`
  }
  
  // Handle flat stats
  return Math.round(value * 100) / 100 + ''
}

// Get stat display name
export function getStatDisplayName(stat: string): string {
  const statNames: Record<string, string> = {
    // Primary Stats
    damage: 'Damage',
    armor: 'Armor',
    health: 'Health',
    mana: 'Mana',
    
    // Attribute Stats
    strength: 'Strength',
    dexterity: 'Dexterity',
    intelligence: 'Intelligence',
    vitality: 'Vitality',
    
    // Combat Stats
    critChance: 'Critical Strike Chance',
    critMultiplier: 'Critical Strike Multiplier',
    increasedCritMultiplier: 'Increased Critical Strike Multiplier',
    attackSpeed: 'Attack Speed',
    increasedAttackSpeed: 'Increased Attack Speed',
    castSpeed: 'Cast Speed',
    increasedCastSpeed: 'Increased Cast Speed',
    increasedDamage: 'Increased Damage',
    
    // Defensive Stats
    dodgeChance: 'Dodge Chance',
    blockChance: 'Block Chance',
    fireResistance: 'Fire Resistance',
    coldResistance: 'Cold Resistance',
    lightningResistance: 'Lightning Resistance',
    chaosResistance: 'Chaos Resistance',
    iceResistance: 'Ice Resistance',
    poisonResistance: 'Poison Resistance',
    spellResistance: 'Spell Resistance',
    stunResistance: 'Stun Resistance',
    damageReduction: 'Damage Reduction',
    reflectDamage: 'Reflect Damage',
    
    // Elemental Damage
    fireDamage: 'Fire Damage',
    iceDamage: 'Ice Damage',
    lightningDamage: 'Lightning Damage',
    poisonDamage: 'Poison Damage',
    
    // Advanced Combat Stats
    armorPenetration: 'Armor Penetration',
    damageMultiplier: 'Damage Multiplier',
    stunChance: 'Stun Chance',
    
    // Utility Stats
    lifeSteal: 'Life Steal',
    manaSteal: 'Mana Steal',
    movementSpeed: 'Movement Speed',
    increasedMovementSpeed: 'Increased Movement Speed',
    doubleDropChance: 'Double Drop Chance',
    cleaveChance: 'Cleave Chance',
    cooldownReduction: 'Cooldown Reduction',
    thorns: 'Thorns Damage',
    
    // Health and Mana Stats
    maxHp: 'Maximum Life',
    maxMana: 'Maximum Mana',
    hpRegen: 'Life Regeneration',
    manaRegen: 'Mana Regeneration',
    healthRegen: 'Health Regeneration'
  }
  
  return statNames[stat] || stat.charAt(0).toUpperCase() + stat.slice(1)
}