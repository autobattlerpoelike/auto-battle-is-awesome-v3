import { DamageType } from './combat'
import { generateEquipment, getEquipmentColor } from './equipmentGenerator'
import { Equipment, RARITIES } from './equipment'

// Object pool for equipment items to reduce garbage collection
const equipmentPool: any[] = []
const maxPoolSize = 100

function getPooledEquipment(): any {
  return equipmentPool.pop() || {}
}

function returnToPool(equipment: any): void {
  if (equipmentPool.length < maxPoolSize) {
    // Clear the object and return to pool
    Object.keys(equipment).forEach(key => delete equipment[key])
    equipmentPool.push(equipment)
  }
}

// Legacy support - convert new equipment to old format for compatibility
function convertEquipmentToLegacyFormat(equipment: Equipment) {
  const legacyItem = getPooledEquipment()
  
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
  
  // Populate pooled object
  Object.assign(legacyItem, {
    // Preserve all new equipment properties at the top level
    ...equipment,
    // Add legacy properties for backward compatibility
    power,
    type: legacyType, // Legacy type for old systems
    element: equipment.damageType || 'physical',
    extras,
    rarityColor: getEquipmentColor(equipment.rarity),
    elementColor: getElementColor(equipment.damageType || 'physical')
  })
  
  return legacyItem
}

// Helper functions for UI - cached for performance
const rarityColorCache = new Map<string, string>()
const elementColorCache = new Map<string, string>()

function getRarityColor(rarity: string): string {
  if (!rarity) return 'text-white'
  
  if (rarityColorCache.has(rarity)) {
    return rarityColorCache.get(rarity)!
  }
  
  let color: string
  switch (rarity) {
    case 'Common': color = 'text-gray-400'; break
    case 'Magic': color = 'text-blue-400'; break
    case 'Rare': color = 'text-yellow-400'; break
    case 'Unique': color = 'text-purple-400'; break
    case 'Legendary': color = 'text-orange-400'; break
    default: color = 'text-white'
  }
  
  rarityColorCache.set(rarity, color)
  return color
}

function getElementColor(element: DamageType): string {
  if (!element) return 'text-gray-300'
  
  if (elementColorCache.has(element)) {
    return elementColorCache.get(element)!
  }
  
  let color: string
  switch (element) {
    case 'fire': color = 'text-red-500'; break
    case 'ice': color = 'text-cyan-400'; break
    case 'lightning': color = 'text-yellow-300'; break
    case 'poison': color = 'text-green-500'; break
    default: color = 'text-gray-300'
  }
  
  elementColorCache.set(element, color)
  return color
}

// Optimized loot generation with reduced allocations
export function generateLoot(level: number, fromBoss: boolean = false): any[] {
  const numItems = fromBoss ? Math.floor(Math.random() * 3) + 2 : 3 // 2-4 items for bosses, 3 for normal enemies
  
  if (numItems === 1) {
    // Fast path for single item
    const equipment = generateEquipment(level, fromBoss)
    return [convertEquipmentToLegacyFormat(equipment)]
  }
  
  // Multiple items path
  const loot = []
  for (let i = 0; i < numItems; i++) {
    const equipment = generateEquipment(level, fromBoss)
    const convertedEquipment = convertEquipmentToLegacyFormat(equipment)
    loot.push(convertedEquipment)
  }
  
  return loot
}

// Cleanup function to manage memory
export function cleanupLootSystem(): void {
  rarityColorCache.clear()
  elementColorCache.clear()
  equipmentPool.length = 0
}
