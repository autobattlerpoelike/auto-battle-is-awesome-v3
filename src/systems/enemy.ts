export type Enemy = {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  type: 'melee'|'ranged'|'caster'
  state?: 'alive'|'dying'
  alpha?: number
}

let counter = 1
export function spawnEnemyForLevel(level:number, kind?: 'melee'|'ranged'|'caster'): Enemy {
  const roll = Math.random()
  let type: 'melee'|'ranged'|'caster' = 'melee'
  if (kind) type = kind
  else if (roll > 0.85) type = 'caster'
  else if (roll > 0.6) type = 'ranged'
  else type = 'melee'
  const baseHp = 25 + level * 12
  const enemy = {
    id: 'e' + (counter++),
    name: type === 'melee' ? `Goblin L${level}` : type === 'ranged' ? `Archer L${level}` : `Mage L${level}`,
    level,
    maxHp: baseHp,
    hp: baseHp,
    type,
    state: 'alive',
    alpha: 1
  }
  return enemy
}
