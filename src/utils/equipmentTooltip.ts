// Equipment Tooltip Utilities
import { Equipment, EquipmentStats } from '../systems/equipment'
import { Stone } from '../systems/stones'

// Calculate total stats from socketed stones
export function calculateStoneStats(equipment: Equipment, stones: Stone[]): EquipmentStats {
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

// Calculate total equipment stats including base, affixes, and stones
export function calculateTotalEquipmentStats(equipment: Equipment, stones: Stone[]): EquipmentStats {
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