import { DamageType } from './combat'

const rarities = ['Common', 'Magic', 'Rare', 'Unique', 'Legendary']
const elements: DamageType[] = ['physical', 'fire', 'ice', 'lightning', 'poison']

const weaponNames = {
  melee: {
    physical: ['Sword', 'Axe', 'Mace', 'Dagger', 'Hammer'],
    fire: ['Flame Blade', 'Inferno Sword', 'Burning Axe', 'Phoenix Dagger', 'Molten Hammer'],
    ice: ['Frost Sword', 'Ice Blade', 'Frozen Axe', 'Glacial Dagger', 'Winter Hammer'],
    lightning: ['Thunder Sword', 'Storm Blade', 'Lightning Axe', 'Spark Dagger', 'Volt Hammer'],
    poison: ['Venom Blade', 'Toxic Sword', 'Poison Axe', 'Serpent Dagger', 'Plague Hammer']
  },
  ranged: {
    physical: ['Bow', 'Crossbow', 'Longbow', 'Shortbow', 'Composite Bow'],
    fire: ['Flame Bow', 'Inferno Crossbow', 'Phoenix Longbow', 'Burning Shortbow', 'Molten Bow'],
    ice: ['Frost Bow', 'Ice Crossbow', 'Glacial Longbow', 'Winter Shortbow', 'Frozen Bow'],
    lightning: ['Storm Bow', 'Thunder Crossbow', 'Lightning Longbow', 'Spark Shortbow', 'Volt Bow'],
    poison: ['Venom Bow', 'Toxic Crossbow', 'Serpent Longbow', 'Poison Shortbow', 'Plague Bow']
  }
}

function chooseRarity(level: number): string {
  const r = Math.random()
  // Higher levels have slightly better chances for rare items
  const levelBonus = Math.min(0.05, level * 0.001)
  
  if (r > (0.999 - levelBonus)) return 'Legendary'
  if (r > (0.995 - levelBonus)) return 'Unique'
  if (r > (0.92 - levelBonus)) return 'Rare'
  if (r > (0.6 - levelBonus)) return 'Magic'
  return 'Common'
}

function chooseElement(rarity: string): DamageType {
  if (rarity === 'Common') return 'physical'
  
  const elementChance = {
    'Magic': 0.3,
    'Rare': 0.5,
    'Unique': 0.7,
    'Legendary': 0.9
  }
  
  if (Math.random() < (elementChance[rarity] || 0)) {
    // Exclude physical for elemental weapons
    const elementalTypes = elements.filter(e => e !== 'physical')
    return elementalTypes[Math.floor(Math.random() * elementalTypes.length)]
  }
  
  return 'physical'
}

function getWeaponName(type: string, element: DamageType, rarity: string): string {
  const names = weaponNames[type]?.[element] || weaponNames.melee.physical
  const baseName = names[Math.floor(Math.random() * names.length)]
  
  if (rarity === 'Legendary') {
    const legendaryPrefixes = ['Godslayer', 'Worldbreaker', 'Eternal', 'Divine', 'Mythical']
    const prefix = legendaryPrefixes[Math.floor(Math.random() * legendaryPrefixes.length)]
    return `${prefix} ${baseName}`
  }
  
  return baseName
}

function makeExtras(rarity: string, element: DamageType) {
  const extras = []
  
  if (rarity === 'Common') return extras
  
  if (rarity === 'Magic') {
    extras.push({key:'hp', val: 10 + Math.floor(Math.random()*10)})
    if (element !== 'physical') {
      extras.push({key:'elementalDamage', val: 2 + Math.floor(Math.random()*3)})
    }
  }
  
  if (rarity === 'Rare') {
    extras.push({key:'hp', val: 15 + Math.floor(Math.random()*20)})
    extras.push({key:'dps', val: 1 + Math.floor(Math.random()*3)})
    if (element !== 'physical') {
      extras.push({key:'elementalDamage', val: 3 + Math.floor(Math.random()*5)})
    }
  }
  
  if (rarity === 'Unique') {
    extras.push({key:'hp', val: 30 + Math.floor(Math.random()*40)})
    extras.push({key:'dps', val: 3 + Math.floor(Math.random()*5)})
    extras.push({key:'projectileSpeed', val: 0.5 + Math.random()*1.5})
    if (element !== 'physical') {
      extras.push({key:'elementalDamage', val: 5 + Math.floor(Math.random()*8)})
    }
    // Add special bonuses
    if (Math.random() < 0.3) {
      extras.push({key:'critChance', val: 0.02 + Math.random()*0.03})
    }
  }
  
  if (rarity === 'Legendary') {
    extras.push({key:'hp', val: 50 + Math.floor(Math.random()*60)})
    extras.push({key:'dps', val: 8 + Math.floor(Math.random()*12)})
    extras.push({key:'projectileSpeed', val: 1.0 + Math.random()*2.0})
    extras.push({key:'critChance', val: 0.05 + Math.random()*0.05})
    extras.push({key:'dodgeChance', val: 0.03 + Math.random()*0.04})
    if (element !== 'physical') {
      extras.push({key:'elementalDamage', val: 10 + Math.floor(Math.random()*15)})
    }
    // Legendary items get multiple special bonuses
    if (Math.random() < 0.5) {
      extras.push({key:'lifeSteal', val: 0.05 + Math.random()*0.1})
    }
    if (Math.random() < 0.3) {
      extras.push({key:'armor', val: 2 + Math.floor(Math.random()*5)})
    }
  }
  
  return extras
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

export function generateLoot(level: number, fromBoss: boolean = false) {
  let rarity = chooseRarity(level)
  
  // Bosses have much better loot chances
  if (fromBoss) {
    const bossRoll = Math.random()
    if (bossRoll > 0.7) rarity = 'Legendary'
    else if (bossRoll > 0.4) rarity = 'Unique'
    else if (bossRoll > 0.1) rarity = 'Rare'
    else rarity = 'Magic'
  }
  
  const type = Math.random() > 0.6 ? 'ranged' : 'melee'
  const element = chooseElement(rarity)
  const weaponName = getWeaponName(type, element, rarity)
  
  const powerBase = Math.max(1, Math.floor(level * (1 + Math.random()*1.6)))
  const multiplier = {
    'Common': 1,
    'Magic': 1.3,
    'Rare': 1.8,
    'Unique': 2.5,
    'Legendary': 4.0
  }[rarity] || 1
  
  const power = Math.max(1, Math.floor(powerBase * multiplier))
  const extras = makeExtras(rarity, element)
  
  const elementText = element !== 'physical' ? ` [${element.toUpperCase()}]` : ''
  const name = `${rarity} ${weaponName}${elementText} (L${level})`
  
  return {
    id: 'it' + Math.floor(Math.random()*1000000),
    name,
    rarity,
    power,
    type,
    element,
    extras,
    value: Math.max(1, Math.floor(level * power * (multiplier/1.5))),
    rarityColor: getRarityColor(rarity),
    elementColor: getElementColor(element)
  }
}
