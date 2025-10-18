import { DamageType } from './combat'
import { 
  Equipment, EquipmentSlot, WeaponType, ArmorType, AccessoryType,
  Affix, WEAPON_BASES, ARMOR_BASES, ACCESSORY_BASES,
  WEAPON_AFFIXES, ARMOR_AFFIXES, ACCESSORY_AFFIXES, RARITIES,
  EquipmentStats, Attribute
} from './equipment'
import { getMaxSockets } from './stoneGenerator'

// Optimized weighted random selection helper with caching
const weightCache = new Map<string, number>()

function weightedRandom<T extends { weight: number }>(items: T[], cacheKey?: string): T {
  let totalWeight: number
  
  if (cacheKey && weightCache.has(cacheKey)) {
    totalWeight = weightCache.get(cacheKey)!
  } else {
    totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    if (cacheKey) {
      weightCache.set(cacheKey, totalWeight)
    }
  }
  
  let random = Math.random() * totalWeight
  
  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }
  
  return items[items.length - 1]
}

// Cache for rarity calculations
const rarityCache = new Map<string, Array<{ item: string; weight: number }>>()

function chooseRarity(level: number, isBoss: boolean = false): string {
  const cacheKey = `${level}-${isBoss}`
  
  let adjustedWeights: Array<{ item: string; weight: number }>
  
  if (rarityCache.has(cacheKey)) {
    adjustedWeights = rarityCache.get(cacheKey)!
  } else {
    const baseWeights = [
      { item: 'Common', weight: 60 },
      { item: 'Magic', weight: 25 },
      { item: 'Rare', weight: 10 },
      { item: 'Legendary', weight: 4 },
      { item: 'Mythic', weight: 2 },
      { item: 'Divine', weight: 1 },
      { item: 'Unique', weight: 1 }
    ]
    
    // Adjust weights based on level and boss status
    adjustedWeights = baseWeights.map(({ item, weight }) => {
      let adjustedWeight = weight
      
      // Higher level = better loot
      if (item === 'Magic') adjustedWeight += Math.floor(level / 5)
      if (item === 'Rare') adjustedWeight += Math.floor(level / 10)
      if (item === 'Legendary') adjustedWeight += Math.floor(level / 20)
      if (item === 'Mythic') adjustedWeight += Math.floor(level / 40)
      if (item === 'Divine') adjustedWeight += Math.floor(level / 60)
      if (item === 'Unique') adjustedWeight += Math.floor(level / 50)
      
      // Boss bonus
      if (isBoss) {
        if (item === 'Rare') adjustedWeight += 5
        if (item === 'Legendary') adjustedWeight += 4
        if (item === 'Mythic') adjustedWeight += 3
        if (item === 'Divine') adjustedWeight += 2
        if (item === 'Unique') adjustedWeight += 3
      }
      
      return { item, weight: Math.max(1, adjustedWeight) }
    })
    
    // Cache the result for future use
    rarityCache.set(cacheKey, adjustedWeights)
  }
  
  return weightedRandom(adjustedWeights, cacheKey).item
}

// Choose equipment type based on level and preferences
function chooseEquipmentType(level: number): { category: 'weapon' | 'armor' | 'accessory', type: string } {
  // Early game focuses more on weapons, later game more variety
  const weaponChance = Math.max(0.3, 0.6 - level * 0.01)
  const armorChance = Math.min(0.5, 0.3 + level * 0.008)
  const accessoryChance = 1 - weaponChance - armorChance
  
  const random = Math.random()
  
  if (random < weaponChance) {
    const weaponTypes = Object.keys(WEAPON_BASES) as WeaponType[]
    return { category: 'weapon', type: weaponTypes[Math.floor(Math.random() * weaponTypes.length)] }
  } else if (random < weaponChance + armorChance) {
    const armorTypes = Object.keys(ARMOR_BASES) as ArmorType[]
    return { category: 'armor', type: armorTypes[Math.floor(Math.random() * armorTypes.length)] }
  } else {
    const accessoryTypes = Object.keys(ACCESSORY_BASES) as AccessoryType[]
    return { category: 'accessory', type: accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)] }
  }
}

// Choose damage type for weapons
function chooseDamageType(weaponType: WeaponType, rarity: string): DamageType {
  const base = WEAPON_BASES[weaponType]
  const availableTypes = base.damageTypes
  
  // Higher rarity items more likely to have elemental damage
  const elementalChance = {
    Common: 0.1,
    Magic: 0.3,
    Rare: 0.5,
    Legendary: 0.7,
    Mythic: 0.8,
    Divine: 0.9,
    Unique: 0.85
  }[rarity] || 0.1
  
  if (Math.random() < elementalChance && availableTypes.length > 1) {
    // Exclude physical for elemental weapons
    const elementalTypes = availableTypes.filter(type => type !== 'physical')
    return elementalTypes[Math.floor(Math.random() * elementalTypes.length)]
  }
  
  return 'physical'
}

// Generate affixes for equipment
function generateAffixes(category: 'weapon' | 'armor' | 'accessory', rarity: string, level: number): Affix[] {
  const rarityInfo = RARITIES[rarity as keyof typeof RARITIES]
  if (!rarityInfo) return []
  
  const [minAffixes, maxAffixes] = rarityInfo.affixCount
  const affixCount = Math.floor(Math.random() * (maxAffixes - minAffixes + 1)) + minAffixes
  
  if (affixCount === 0) return []
  
  // Get appropriate affix pool
  let affixPool: Affix[]
  switch (category) {
    case 'weapon': affixPool = WEAPON_AFFIXES; break
    case 'armor': affixPool = ARMOR_AFFIXES; break
    case 'accessory': affixPool = ACCESSORY_AFFIXES; break
  }
  
  // Filter affixes by tier (higher level = higher tier affixes available)
  const maxTier = Math.min(3, Math.floor(level / 10) + 1)
  const availableAffixes = affixPool.filter(affix => affix.tier <= maxTier)
  
  const selectedAffixes: Affix[] = []
  const usedStats = new Set<string>()
  
  // Pre-calculate multipliers to avoid repeated calculations
  const levelMultiplier = 1 + (level - 1) * 0.05
  const rarityMultiplier = rarityInfo.statMultiplier
  
  for (let i = 0; i < affixCount && availableAffixes.length > 0; i++) {
    // Filter out already used stats
    const unusedAffixes = availableAffixes.filter(affix => !usedStats.has(affix.stat))
    if (unusedAffixes.length === 0) break
    
    const selectedAffix = weightedRandom(unusedAffixes)
    
    // Scale affix value by level and rarity with random variation
    const baseScaledValue = selectedAffix.value * levelMultiplier * rarityMultiplier
    
    // Add random variation to affix values (±10% to ±30% based on rarity)
    const affixVariationRange = {
      'Common': 0.10,
      'Magic': 0.15,
      'Rare': 0.18,
      'Legendary': 0.22,
      'Mythic': 0.25,
      'Divine': 0.30,
      'Unique': 0.28
    }[rarity] || 0.10
    
    const affixRandomVariation = 1 + (Math.random() * 2 - 1) * affixVariationRange
    const finalAffixValue = baseScaledValue * affixRandomVariation
    
    selectedAffixes.push({
      ...selectedAffix,
      value: Math.max(1, Math.round(finalAffixValue * 100) / 100) // Ensure minimum value of 1
    })
    
    usedStats.add(selectedAffix.stat)
  }
  
  return selectedAffixes
}

// Generate equipment name
function generateEquipmentName(
  type: string, 
  rarity: string, 
  level: number, 
  damageType?: DamageType,
  affixes: Affix[] = []
): string {
  let baseName = ''
  
  // Get base name from equipment definitions
  if (type in WEAPON_BASES) {
    baseName = WEAPON_BASES[type as WeaponType].name
  } else if (type in ARMOR_BASES) {
    baseName = ARMOR_BASES[type as ArmorType].name
  } else if (type in ACCESSORY_BASES) {
    baseName = ACCESSORY_BASES[type as AccessoryType].name
  } else {
    baseName = 'Unknown Item' // Fallback name
  }
  
  // Add elemental prefix for weapons
  if (damageType && damageType !== 'physical') {
    const elementPrefixes = {
      fire: ['Burning', 'Flaming', 'Infernal', 'Phoenix'],
      ice: ['Frozen', 'Glacial', 'Frost', 'Winter'],
      lightning: ['Shocking', 'Storm', 'Thunder', 'Volt'],
      poison: ['Venomous', 'Toxic', 'Plague', 'Serpent']
    }
    const prefixes = elementPrefixes[damageType] || []
    if (prefixes.length > 0) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      baseName = `${prefix} ${baseName}`
    }
  }
  
  // Add suffix from most powerful affix
  if (affixes.length > 0 && rarity !== 'Common') {
    const strongestAffix = affixes.reduce((strongest, current) => 
      current.tier > strongest.tier ? current : strongest
    )
    baseName += ` ${strongestAffix.name}`
  }
  
  // Add rarity and level
  const elementText = damageType && damageType !== 'physical' ? ` [${damageType.toUpperCase()}]` : ''
  const finalName = `${rarity} ${baseName}${elementText} (L${level})`
  return finalName
}

// Calculate equipment value
function calculateValue(
  baseStats: EquipmentStats, 
  affixes: Affix[], 
  rarity: string, 
  level: number
): number {
  const rarityMultiplier = RARITIES[rarity as keyof typeof RARITIES]?.statMultiplier || 1
  
  // Base value from primary stats
  let baseValue = 0
  if (baseStats.damage) baseValue += baseStats.damage * 5
  if (baseStats.armor) baseValue += baseStats.armor * 3
  if (baseStats.health) baseValue += baseStats.health * 0.5
  
  // Add value from affixes
  const affixValue = affixes.reduce((total, affix) => {
    const statValues = {
      damage: 5, armor: 3, health: 0.5, mana: 0.3,
      critChance: 100, dodgeChance: 80, attackSpeed: 20,
      strength: 2, dexterity: 2, intelligence: 2, vitality: 2, luck: 3
    }
    const multiplier = statValues[affix.stat as keyof typeof statValues] || 1
    return total + (affix.value * multiplier)
  }, 0)
  
  const totalValue = (baseValue + affixValue) * level * rarityMultiplier
  return Math.max(1, Math.floor(totalValue))
}

// Main equipment generation function
export function generateEquipment(level: number, fromBoss: boolean = false): Equipment {
  const rarity = chooseRarity(level, fromBoss)
  const { category, type } = chooseEquipmentType(level)
  
  let baseStats: EquipmentStats = {}
  let slot: EquipmentSlot
  let requirements: Partial<Record<Attribute, number>> = {}
  let damageType: DamageType | undefined
  
  // Get base equipment data
  let visual: any = undefined
  if (category === 'weapon') {
    const weaponBase = WEAPON_BASES[type as WeaponType]
    baseStats = { ...weaponBase.baseStats }
    slot = weaponBase.slot
    requirements = { ...weaponBase.requirements }
    visual = { ...weaponBase.visual }
    damageType = chooseDamageType(type as WeaponType, rarity)
  } else if (category === 'armor') {
    const armorBase = ARMOR_BASES[type as ArmorType]
    baseStats = { ...armorBase.baseStats }
    slot = armorBase.slot
    requirements = { ...armorBase.requirements }
    visual = { ...armorBase.visual }
  } else {
    const accessoryBase = ACCESSORY_BASES[type as AccessoryType]
    baseStats = { ...accessoryBase.baseStats }
    slot = accessoryBase.slot
    requirements = { ...accessoryBase.requirements }
    // Accessories don't have visual data by default
  }
  
  // Scale base stats by level and rarity with random variation
  const rarityInfo = RARITIES[rarity as keyof typeof RARITIES]
  if (!rarityInfo) {
    console.warn('Invalid rarity:', rarity, 'defaulting to Common')
    return generateEquipment(level, false)
  }
  const levelMultiplier = 1 + (level - 1) * 0.1
  const rarityMultiplier = rarityInfo.statMultiplier
  
  Object.keys(baseStats).forEach(stat => {
    if (typeof (baseStats as any)[stat] === 'number') {
      // Add random variation to base stats (±15% for Common, up to ±40% for Divine)
      const variationRange = {
        'Common': 0.15,
        'Magic': 0.20,
        'Rare': 0.25,
        'Legendary': 0.30,
        'Mythic': 0.35,
        'Divine': 0.40,
        'Unique': 0.38
      }[rarity] || 0.15
      
      // Generate random multiplier between (1 - variation) and (1 + variation)
      const randomVariation = 1 + (Math.random() * 2 - 1) * variationRange
      
      const finalValue = (baseStats as any)[stat] * levelMultiplier * rarityMultiplier * randomVariation
      ;(baseStats as any)[stat] = Math.round(finalValue * 100) / 100
    }
  })
  
  // Generate affixes
  const affixes = generateAffixes(category, rarity, level)
  
  // Generate name
  const name = generateEquipmentName(type, rarity, level, damageType, affixes)
  
  // Calculate value
  const value = calculateValue(baseStats, affixes, rarity, level)
  
  // Generate sockets based on rarity
  const maxSockets = getMaxSockets(rarity)
  const sockets = maxSockets > 0 ? {
    stones: new Array(maxSockets).fill(null),
    maxSockets
  } : undefined

  // Update visual data based on rarity and level
  if (visual) {
    // Update sprite ID based on rarity for better visual progression
    const rarityTiers = ['Common', 'Magic', 'Rare', 'Legendary', 'Mythic', 'Divine', 'Unique']
    const tierIndex = rarityTiers.indexOf(rarity)
    
    if (category === 'weapon' && type === 'sword') {
      visual.spriteId = tierIndex >= 1 ? 'steel_sword' : 'iron_sword'
    } else if (category === 'armor' && type === 'chest') {
      visual.spriteId = tierIndex >= 1 ? 'chain_chest' : 'leather_chest'
    }
    
    // Add color tint based on rarity
    if (tierIndex >= 2) {
      visual.color = RARITIES[rarity as keyof typeof RARITIES]?.color
    }
  }
  
  return {
    id: 'eq_' + Math.random().toString(36).substr(2, 9),
    name,
    type: type as WeaponType | ArmorType | AccessoryType,
    slot,
    category,
    rarity,
    level,
    baseStats,
    affixes,
    damageType,
    requirements,
    value,
    sockets,
    visual
  }
}

// Helper function to check if player meets equipment requirements
export function canEquip(equipment: Equipment, playerAttributes: Record<string, number>): boolean {
  if (!equipment.requirements) return true
  
  return Object.entries(equipment.requirements).every(([attr, required]) => {
    return (playerAttributes[attr] || 0) >= required
  })
}

// Helper function to get equipment color by rarity
export function getEquipmentColor(rarity: string): string {
  return RARITIES[rarity as keyof typeof RARITIES]?.color || '#9CA3AF'
}