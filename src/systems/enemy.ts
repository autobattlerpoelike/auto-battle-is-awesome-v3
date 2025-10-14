export type EnemyType = 'melee' | 'ranged' | 'caster' | 'tank' | 'assassin' | 'boss'
export type SpecialAbility = 'berserker' | 'precise' | 'regeneration' | 'shield' | 'poison' | 'freeze' | 'lightning' | 'summon'

export type Enemy = {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  type: EnemyType
  specialAbility?: SpecialAbility
  isBoss?: boolean
  state?: 'alive' | 'dying'
  alpha?: number
  statusEffects?: string[]
  armor?: number
}

const enemyNames = {
  melee: ['Goblin', 'Orc Warrior', 'Skeleton Fighter', 'Bandit', 'Troll'],
  ranged: ['Goblin Archer', 'Orc Hunter', 'Skeleton Archer', 'Bandit Marksman', 'Dark Elf'],
  caster: ['Goblin Shaman', 'Orc Mage', 'Necromancer', 'Dark Wizard', 'Lich'],
  tank: ['Orc Guardian', 'Stone Golem', 'Armored Knight', 'Shield Bearer', 'Iron Colossus'],
  assassin: ['Shadow Rogue', 'Dark Assassin', 'Poison Blade', 'Night Stalker', 'Void Walker'],
  boss: ['Goblin King', 'Orc Chieftain', 'Lich Lord', 'Dragon', 'Demon Lord']
}

const specialAbilities: SpecialAbility[] = ['berserker', 'precise', 'regeneration', 'shield', 'poison', 'freeze', 'lightning']

let counter = 1

function getRandomName(type: EnemyType, level: number): string {
  const names = enemyNames[type] || enemyNames.melee
  const baseName = names[Math.floor(Math.random() * names.length)]
  return `${baseName} L${level}`
}

function shouldSpawnBoss(level: number): boolean {
  // Boss chance increases with level, every 10 levels has higher chance
  const baseChance = 0.02
  const levelBonus = Math.floor(level / 10) * 0.01
  return Math.random() < (baseChance + levelBonus)
}

function getSpecialAbility(type: EnemyType, isBoss: boolean): SpecialAbility | undefined {
  if (isBoss) {
    // Bosses always have special abilities
    return specialAbilities[Math.floor(Math.random() * specialAbilities.length)]
  }
  
  // Regular enemies have 20% chance for special ability
  if (Math.random() < 0.2) {
    // Some abilities are more common for certain types
    switch (type) {
      case 'melee':
        return Math.random() < 0.6 ? 'berserker' : 'precise'
      case 'ranged':
        return Math.random() < 0.7 ? 'precise' : 'poison'
      case 'caster':
        return Math.random() < 0.5 ? 'lightning' : 'freeze'
      case 'tank':
        return Math.random() < 0.8 ? 'shield' : 'regeneration'
      case 'assassin':
        return Math.random() < 0.6 ? 'poison' : 'precise'
      default:
        return specialAbilities[Math.floor(Math.random() * specialAbilities.length)]
    }
  }
  
  return undefined
}

export function spawnEnemyForLevel(level: number, kind?: EnemyType): Enemy {
  let type: EnemyType
  const isBoss = shouldSpawnBoss(level)
  
  if (isBoss) {
    type = 'boss'
  } else if (kind) {
    type = kind
  } else {
    const roll = Math.random()
    if (roll > 0.92) type = 'assassin'
    else if (roll > 0.85) type = 'tank'
    else if (roll > 0.75) type = 'caster'
    else if (roll > 0.55) type = 'ranged'
    else type = 'melee'
  }
  
  // Calculate HP based on type and boss status
  let baseHp = 25 + level * 12
  let armor = 0
  
  switch (type) {
    case 'tank':
      baseHp = Math.floor(baseHp * 1.8)
      armor = Math.floor(level * 0.3)
      break
    case 'boss':
      baseHp = Math.floor(baseHp * 3.5)
      armor = Math.floor(level * 0.5)
      break
    case 'assassin':
      baseHp = Math.floor(baseHp * 0.7)
      break
    case 'caster':
      baseHp = Math.floor(baseHp * 0.9)
      break
  }
  
  const specialAbility = getSpecialAbility(type, isBoss)
  const name = isBoss ? getRandomName('boss', level) : getRandomName(type, level)
  
  const enemy: Enemy = {
    id: 'e' + (counter++),
    name: isBoss ? `👑 ${name}` : name,
    level,
    maxHp: baseHp,
    hp: baseHp,
    type,
    specialAbility,
    isBoss,
    state: 'alive',
    alpha: 1,
    statusEffects: [],
    armor
  }
  
  return enemy
}

export function getEnemyTypeColor(type: EnemyType): string {
  switch (type) {
    case 'melee': return 'text-red-400'
    case 'ranged': return 'text-green-400'
    case 'caster': return 'text-blue-400'
    case 'tank': return 'text-gray-400'
    case 'assassin': return 'text-purple-400'
    case 'boss': return 'text-yellow-400'
    default: return 'text-white'
  }
}
