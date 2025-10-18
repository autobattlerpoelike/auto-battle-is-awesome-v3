// Stone Generation System
import { 
  Stone, StoneType, StoneRarity, StoneAffix,
  STONE_BASES, STONE_RARITIES, STONE_AFFIXES
} from './stones'
import { EquipmentStats } from './equipment'

// Optimized weighted random selection
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }
  
  return items[items.length - 1]
}

// Choose stone rarity based on level
function chooseStoneRarity(level: number, isBoss: boolean = false): StoneRarity {
  const baseWeights = [
    { item: 'Common' as StoneRarity, weight: 60 },
    { item: 'Rare' as StoneRarity, weight: 25 },
    { item: 'Mythical' as StoneRarity, weight: 12 },
    { item: 'Divine' as StoneRarity, weight: 3 }
  ]
  
  // Adjust weights based on level and boss status
  const adjustedWeights = baseWeights.map(({ item, weight }) => {
    let adjustedWeight = weight
    
    // Higher level = better stones
    if (item === 'Rare') adjustedWeight += Math.floor(level / 10)
    if (item === 'Mythical') adjustedWeight += Math.floor(level / 20)
    if (item === 'Divine') adjustedWeight += Math.floor(level / 40)
    
    // Boss bonus
    if (isBoss) {
      if (item === 'Rare') adjustedWeight += 10
      if (item === 'Mythical') adjustedWeight += 8
      if (item === 'Divine') adjustedWeight += 5
    }
    
    return { item, weight: Math.max(1, adjustedWeight) }
  })
  
  return weightedRandom(adjustedWeights).item
}

// Choose stone type
function chooseStoneType(level: number): StoneType {
  const stoneTypes = Object.keys(STONE_BASES) as StoneType[]
  
  // All stone types are equally likely for now
  // Could add level-based unlocking later
  return stoneTypes[Math.floor(Math.random() * stoneTypes.length)]
}

// Generate affixes for stones
function generateStoneAffixes(stoneType: StoneType, rarity: StoneRarity, level: number): StoneAffix[] {
  const rarityInfo = STONE_RARITIES[rarity]
  if (!rarityInfo) return []
  
  const [minAffixes, maxAffixes] = rarityInfo.affixCount
  const affixCount = Math.floor(Math.random() * (maxAffixes - minAffixes + 1)) + minAffixes
  
  if (affixCount === 0) return []
  
  // Filter affixes by tier (higher level = higher tier affixes available)
  const maxTier = Math.min(4, Math.floor(level / 15) + 1)
  const availableAffixes = STONE_AFFIXES.filter(affix => affix.tier <= maxTier)
  
  const selectedAffixes: StoneAffix[] = []
  const usedStats = new Set<string>()
  
  // Pre-calculate multipliers
  const levelMultiplier = 1 + (level - 1) * 0.03 // Stones scale slower than equipment
  const rarityMultiplier = rarityInfo.statMultiplier
  
  for (let i = 0; i < affixCount && availableAffixes.length > 0; i++) {
    // Filter out already used stats
    const unusedAffixes = availableAffixes.filter(affix => !usedStats.has(affix.stat))
    if (unusedAffixes.length === 0) break
    
    const selectedAffix = weightedRandom(unusedAffixes)
    
    // Scale affix value by level and rarity with random variation
    const baseScaledValue = selectedAffix.value * levelMultiplier * rarityMultiplier
    
    // Add random variation (±10% to ±20% based on rarity)
    const variationRange = {
      'Common': 0.10,
      'Rare': 0.15,
      'Mythical': 0.18,
      'Divine': 0.20
    }[rarity] || 0.10
    
    const randomVariation = 1 + (Math.random() * 2 - 1) * variationRange
    const finalAffixValue = baseScaledValue * randomVariation
    
    selectedAffixes.push({
      ...selectedAffix,
      value: Math.max(0.01, Math.round(finalAffixValue * 100) / 100)
    })
    
    usedStats.add(selectedAffix.stat)
  }
  
  return selectedAffixes
}

// Generate stone name
function generateStoneName(type: StoneType, rarity: StoneRarity, level: number, affixes: StoneAffix[]): string {
  const base = STONE_BASES[type]
  const rarityName = rarity !== 'Common' ? rarity : ''
  
  // Add affix names for higher rarity stones
  let affixNames = ''
  if (affixes.length > 0 && rarity !== 'Common') {
    const primaryAffix = affixes[0]
    affixNames = ` ${primaryAffix.name}`
  }
  
  return `${rarityName} ${base.name}${affixNames}`.trim()
}

// Calculate stone value
function calculateStoneValue(
  baseStats: EquipmentStats,
  affixes: StoneAffix[],
  rarity: StoneRarity,
  level: number
): number {
  const rarityMultiplier = STONE_RARITIES[rarity]?.statMultiplier || 1
  
  // Base value from primary stats
  let baseValue = 0
  if (baseStats.damage) baseValue += baseStats.damage * 8
  if (baseStats.health) baseValue += baseStats.health * 0.3
  if (baseStats.mana) baseValue += baseStats.mana * 0.2
  if (baseStats.armor) baseValue += baseStats.armor * 4
  
  // Add value from affixes
  const affixValue = affixes.reduce((total, affix) => {
    const statValues = {
      damage: 8, armor: 4, health: 0.3, mana: 0.2,
      critChance: 150, dodgeChance: 120, attackSpeed: 30,
      strength: 3, dexterity: 3, intelligence: 3, vitality: 3, luck: 5,
      goldFind: 50, magicFind: 80, experienceBonus: 60
    }
    const multiplier = statValues[affix.stat as keyof typeof statValues] || 1
    return total + (affix.value * multiplier)
  }, 0)
  
  const totalValue = (baseValue + affixValue) * level * rarityMultiplier * 0.5 // Stones worth less than equipment
  return Math.max(1, Math.floor(totalValue))
}

// Main stone generation function
export function generateStone(level: number, fromBoss: boolean = false): Stone {
  const rarity = chooseStoneRarity(level, fromBoss)
  const type = chooseStoneType(level)
  
  const stoneBase = STONE_BASES[type]
  const rarityInfo = STONE_RARITIES[rarity]
  
  // Scale base stats by level and rarity
  const levelMultiplier = 1 + (level - 1) * 0.05
  const rarityMultiplier = rarityInfo.statMultiplier
  
  const baseStats: EquipmentStats = {}
  Object.keys(stoneBase.baseStats).forEach(stat => {
    const value = (stoneBase.baseStats as any)[stat]
    if (typeof value === 'number') {
      // Add random variation (±10% to ±25% based on rarity)
      const variationRange = {
        'Common': 0.10,
        'Rare': 0.15,
        'Mythical': 0.22,
        'Divine': 0.25
      }[rarity] || 0.10
      
      const randomVariation = 1 + (Math.random() * 2 - 1) * variationRange
      const finalValue = value * levelMultiplier * rarityMultiplier * randomVariation
      ;(baseStats as any)[stat] = Math.round(finalValue * 100) / 100
    }
  })
  
  // Generate affixes
  const affixes = generateStoneAffixes(type, rarity, level)
  
  // Generate name
  const name = generateStoneName(type, rarity, level, affixes)
  
  // Calculate value
  const value = calculateStoneValue(baseStats, affixes, rarity, level)
  
  // Generate unique ID
  const uniqueId = generateUniqueStoneId()
  
  return {
    id: uniqueId,
    name,
    type,
    rarity,
    level,
    baseStats,
    affixes,
    socketTypes: stoneBase.socketTypes,
    value
  }
}

// Helper function to check if stone can be socketed into equipment
export function canSocketStone(stone: Stone, equipmentSlot: string): boolean {
  return stone.socketTypes.includes(equipmentSlot)
}

// Helper function to generate a unique stone ID
export function generateUniqueStoneId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substr(2, 5)
  return `stone_${timestamp}_${randomPart}`
}

// Helper function to migrate old stone IDs to new format
export function migrateStoneId(oldId: string): string {
  // If already in new format, return as is
  if (oldId.includes('_') && oldId.startsWith('stone_')) {
    return oldId
  }
  
  // Generate new ID for old stones
  return generateUniqueStoneId()
}

// Function to migrate all stones and ensure unique IDs
export function migratePlayerStones(stones: any[]): any[] {
  const usedIds = new Set<string>()
  
  return stones.map(stone => {
    let newId = stone.id
    
    // If ID is already used or in old format, generate a new one
    if (usedIds.has(newId) || !newId.includes('_') || !newId.startsWith('stone_')) {
      newId = generateUniqueStoneId()
      
      // Ensure the new ID is truly unique
      while (usedIds.has(newId)) {
        newId = generateUniqueStoneId()
      }
    }
    
    usedIds.add(newId)
    
    return {
      ...stone,
      id: newId
    }
  })
}

export function forceMigrateAllStones(stones: Stone[]): void {
  // Force regenerate all stone IDs to ensure uniqueness
  stones.forEach(stone => {
    stone.id = generateUniqueStoneId()
  })
}

// Helper function to get maximum sockets for equipment based on rarity
export function getMaxSockets(equipmentRarity: string): number {
  const socketCounts = {
    'Common': 0,
    'Magic': 1,
    'Rare': 1,
    'Legendary': 2,
    'Mythic': 2,
    'Divine': 3,
    'Unique': 2
  }
  return socketCounts[equipmentRarity as keyof typeof socketCounts] || 0
}