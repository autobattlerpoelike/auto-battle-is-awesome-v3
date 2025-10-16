import { DamageType } from './combat'
import { generateEquipment, getEquipmentColor } from './equipmentGenerator'
import { Equipment, RARITIES } from './equipment'

// Legacy support - convert new equipment to old format for compatibility
function convertEquipmentToLegacyFormat(equipment: Equipment) {
  // Calculate total power from base stats and affixes
  let power = 0
  
  // Add base damage if it exists
  if (equipment.baseStats.damage) {
    power += equipment.baseStats.damage
  }
  
  // Add affix bonuses to power calculation
  equipment.affixes.forEach(affix => {
    if (affix.stat === 'damage' || affix.stat === 'health' || affix.stat === 'armor') {
      power += affix.value * 0.5 // Scale affix contribution
    }
  })
  
  power = Math.max(1, Math.floor(power))
  
  // Convert affixes to legacy extras format
  const extras = equipment.affixes.map(affix => ({
    key: affix.stat === 'health' ? 'hp' : 
         affix.stat === 'critChance' ? 'critChance' :
         affix.stat === 'dodgeChance' ? 'dodgeChance' :
         affix.stat === 'attackSpeed' ? 'projectileSpeed' :
         affix.stat === 'lifeSteal' ? 'lifeSteal' :
         affix.stat === 'damage' ? 'dps' :
         affix.stat,
    val: affix.value
  }))
  
  // Determine type for legacy compatibility
  const isRanged = ['bow', 'crossbow'].includes(equipment.type as string)
  const legacyType = isRanged ? 'ranged' : 'melee'
  
  return {
    // Preserve all new equipment properties at the top level
    ...equipment,
    // Add legacy properties for backward compatibility
    power,
    type: legacyType, // Legacy type for old systems
    element: equipment.damageType || 'physical',
    extras,
    rarityColor: getEquipmentColor(equipment.rarity),
    elementColor: getElementColor(equipment.damageType || 'physical')
  }
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'Common': return 'text-gray-400'
    case 'Magic': return 'text-blue-400'
    case 'Rare': return 'text-yellow-400'
    case 'Unique': return 'text-purple-400'
    case 'Legendary': return 'text-orange-400'
    default: return 'text-white'
  }
}

function getElementColor(element: DamageType): string {
  switch (element) {
    case 'fire': return 'text-red-500'
    case 'ice': return 'text-cyan-400'
    case 'lightning': return 'text-yellow-300'
    case 'poison': return 'text-green-500'
    default: return 'text-gray-300'
  }
}

export function generateLoot(level: number, fromBoss: boolean = false): any[] {
  const loot = []
  
  // Generate multiple equipment pieces to increase chance of getting different types
  for (let i = 0; i < 3; i++) {
    const equipment = generateEquipment(level, fromBoss)
    const convertedEquipment = convertEquipmentToLegacyFormat(equipment)
    loot.push(convertedEquipment)
  }
  
  return loot
}
