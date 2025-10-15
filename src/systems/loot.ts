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

// Test function to debug equipment generation
export function testEquipmentGeneration() {
  console.log('=== TESTING EQUIPMENT GENERATION ===')
  const equipment = generateEquipment(1, false)
  console.log('Raw equipment object:', equipment)
  console.log('Equipment name:', equipment.name)
  console.log('Equipment name type:', typeof equipment.name)
  console.log('Equipment name length:', equipment.name?.length)
  
  const converted = convertEquipmentToLegacyFormat(equipment)
  console.log('Converted equipment:', converted)
  console.log('Converted name:', converted.name)
  console.log('Converted name type:', typeof converted.name)
  console.log('=== END TEST ===')
  return converted
}

export function generateLoot(level: number, fromBoss: boolean = false): any[] {
  const loot = []
  
  // Test equipment generation first
  console.log('Testing equipment generation...')
  testEquipmentGeneration()
  
  // Generate multiple equipment pieces to increase chance of getting different types
  for (let i = 0; i < 3; i++) {
    const equipment = generateEquipment(level, fromBoss)
    console.log(`Generated equipment ${i + 1}:`, equipment)
    console.log('Equipment name:', equipment.name)
    console.log('Equipment name type:', typeof equipment.name)
    console.log('Equipment slot:', equipment.slot)
    console.log('Equipment category:', equipment.category)
    
    const convertedEquipment = convertEquipmentToLegacyFormat(equipment)
    console.log('Converted equipment:', convertedEquipment)
    console.log('Converted equipment name:', convertedEquipment.name)
    console.log('Converted equipment name type:', typeof convertedEquipment.name)
    
    loot.push(convertedEquipment)
  }
  
  return loot
}
