import { DamageType } from './combat'
import { 
  Equipment, EquipmentSlot, WeaponType, ArmorType, AccessoryType,
  Affix, WEAPON_BASES, ARMOR_BASES, ACCESSORY_BASES,
  WEAPON_AFFIXES, ARMOR_AFFIXES, ACCESSORY_AFFIXES, RARITIES,
  EquipmentStats, Attribute
} from './equipment'

// Weighted random selection
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }
  
  return items[items.length - 1]
}

// Choose rarity based on level and boss status
function chooseRarity(level: number, fromBoss: boolean = false): string {
  const rarityChances = fromBoss ? {
    Common: Math.max(0, 0.1 - level * 0.01),
    Magic: Math.max(0, 0.3 - level * 0.015),
    Rare: Math.max(0.2, 0.4 - level * 0.01),
    Unique: Math.min(0.3, 0.15 + level * 0.01),
    Legendary: Math.min(0.2, level * 0.005)
  } : {
    Common: Math.max(0.3, 0.7 - level * 0.02),
    Magic: Math.max(0.2, 0.25 - level * 0.005),
    Rare: Math.min(0.3, level * 0.01),
    Unique: Math.min(0.15, level * 0.003),
    Legendary: Math.min(0.05, level * 0.001)
  }

  const random = Math.random()
  let cumulative = 0
  
  for (const [rarity, chance] of Object.entries(rarityChances)) {
    cumulative += chance
    if (random <= cumulative) return rarity
  }
  
  return 'Common'
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
    Unique: 0.7,
    Legendary: 0.9
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
  
  for (let i = 0; i < affixCount && availableAffixes.length > 0; i++) {
    // Filter out already used stats
    const unusedAffixes = availableAffixes.filter(affix => !usedStats.has(affix.stat))
    if (unusedAffixes.length === 0) break
    
    const selectedAffix = weightedRandom(unusedAffixes)
    
    // Scale affix value by level and rarity
    const levelMultiplier = 1 + (level - 1) * 0.05
    const rarityMultiplier = rarityInfo.statMultiplier
    const scaledValue = selectedAffix.value * levelMultiplier * rarityMultiplier
    
    selectedAffixes.push({
      ...selectedAffix,
      value: Math.round(scaledValue * 100) / 100 // Round to 2 decimal places
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
  if (category === 'weapon') {
    const weaponBase = WEAPON_BASES[type as WeaponType]
    baseStats = { ...weaponBase.baseStats }
    slot = weaponBase.slot
    requirements = { ...weaponBase.requirements }
    damageType = chooseDamageType(type as WeaponType, rarity)
  } else if (category === 'armor') {
    const armorBase = ARMOR_BASES[type as ArmorType]
    baseStats = { ...armorBase.baseStats }
    slot = armorBase.slot
    requirements = { ...armorBase.requirements }
  } else {
    const accessoryBase = ACCESSORY_BASES[type as AccessoryType]
    baseStats = { ...accessoryBase.baseStats }
    slot = accessoryBase.slot
    requirements = { ...accessoryBase.requirements }
  }
  
  // Scale base stats by level and rarity
  const rarityInfo = RARITIES[rarity as keyof typeof RARITIES]
  const levelMultiplier = 1 + (level - 1) * 0.1
  const rarityMultiplier = rarityInfo.statMultiplier
  
  Object.keys(baseStats).forEach(stat => {
    if (typeof (baseStats as any)[stat] === 'number') {
      (baseStats as any)[stat] = Math.round((baseStats as any)[stat] * levelMultiplier * rarityMultiplier * 100) / 100
    }
  })
  
  // Generate affixes
  const affixes = generateAffixes(category, rarity, level)
  
  // Generate name
  const name = generateEquipmentName(type, rarity, level, damageType, affixes)
  
  // Calculate value
  const value = calculateValue(baseStats, affixes, rarity, level)
  
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
    value
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