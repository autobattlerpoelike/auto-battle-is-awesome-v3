import { Player } from './player'
import { Enemy } from './enemy'

export type CombatResult = {
  player: Player
  enemy: Enemy
  enemyDefeated: boolean
  message: string
  didPlayerHit: boolean
  crit: boolean
  damage: number
}

function rarityCritChance(rarity) {
  if (!rarity) return 0.05
  if (rarity === 'Common') return 0.05
  if (rarity === 'Magic') return 0.08
  if (rarity === 'Rare') return 0.10
  if (rarity === 'Unique') return 0.15
  return 0.05
}

export function simulateCombatTick(player: Player, enemy: Enemy): CombatResult {
  const p = {...player}
  const e = {...enemy}
  // player attack
  const baseDmg = Math.max(1, Math.floor(p.dps))
  const critChance = rarityCritChance(p.equipped?.rarity)
  const isCrit = Math.random() < critChance
  const damage = isCrit ? Math.max(1, Math.floor(baseDmg * 1.5)) : baseDmg
  e.hp -= damage
  let msg = `Player hits ${e.name} for ${damage}`
  let enemyDefeated = false
  let didPlayerHit = true

  if (e.hp <= 0) {
    enemyDefeated = true
    msg = `Player dealt final blow to ${e.name}.`
  } else {
    // enemy retaliation
    const base = e.type === 'melee' ? 0.8 : e.type === 'ranged' ? 0.7 : 0.9
    const edmg = Math.max(0.5, Math.floor(base + e.level * 0.45))
    p.hp -= edmg
    msg += `. ${e.name} hits back for ${edmg}`
    if (p.hp <= 0) {
      p.hp = Math.max(1, Math.floor(p.maxHp / 2))
      p.gold = Math.max(0, p.gold - 5)
      msg += `. Player was knocked out and revived.`
    }
  }

  return { player: p, enemy: e, enemyDefeated, message: msg, didPlayerHit, crit: isCrit, damage }
}
