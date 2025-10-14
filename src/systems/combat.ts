import { Player } from './player'
import { Enemy } from './enemy'

export type DamageType = 'physical' | 'fire' | 'ice' | 'lightning' | 'poison'

export type CombatResult = {
  player: Player
  enemy: Enemy
  enemyDefeated: boolean
  message: string
  didPlayerHit: boolean
  didEnemyHit: boolean
  playerDodged: boolean
  enemyDodged: boolean
  crit: boolean
  damage: number
  enemyDamage: number
  damageType: DamageType
  statusEffect?: string
}

function rarityCritChance(rarity: string): number {
  if (!rarity) return 0.05
  if (rarity === 'Common') return 0.05
  if (rarity === 'Magic') return 0.08
  if (rarity === 'Rare') return 0.12
  if (rarity === 'Unique') return 0.18
  if (rarity === 'Legendary') return 0.25
  return 0.05
}

function rarityDodgeChance(rarity: string): number {
  if (!rarity) return 0.02
  if (rarity === 'Common') return 0.02
  if (rarity === 'Magic') return 0.04
  if (rarity === 'Rare') return 0.06
  if (rarity === 'Unique') return 0.08
  if (rarity === 'Legendary') return 0.12
  return 0.02
}

function getElementalDamageType(weapon: any): DamageType {
  if (!weapon || !weapon.element) return 'physical'
  return weapon.element
}

function calculateDamageVariance(baseDamage: number): number {
  // Add 15% damage variance for more interesting combat
  const variance = 0.15
  const min = baseDamage * (1 - variance)
  const max = baseDamage * (1 + variance)
  return Math.floor(min + Math.random() * (max - min))
}

function applyElementalEffects(damage: number, damageType: DamageType, target: any): { damage: number, statusEffect?: string } {
  let finalDamage = damage
  let statusEffect: string | undefined

  switch (damageType) {
    case 'fire':
      // Fire does 10% more damage and has chance to burn
      finalDamage = Math.floor(damage * 1.1)
      if (Math.random() < 0.15) {
        statusEffect = 'burning'
      }
      break
    case 'ice':
      // Ice has chance to slow/freeze
      if (Math.random() < 0.2) {
        statusEffect = 'frozen'
      }
      break
    case 'lightning':
      // Lightning has high crit chance bonus (handled elsewhere) and chain damage
      finalDamage = Math.floor(damage * 1.05)
      if (Math.random() < 0.1) {
        statusEffect = 'stunned'
      }
      break
    case 'poison':
      // Poison does less immediate damage but applies DoT
      finalDamage = Math.floor(damage * 0.8)
      if (Math.random() < 0.25) {
        statusEffect = 'poisoned'
      }
      break
  }

  return { damage: finalDamage, statusEffect }
}

function getEnemyDodgeChance(enemy: Enemy): number {
  // Base dodge chance varies by enemy type
  let baseDodge = 0.02
  if (enemy.type === 'ranged') baseDodge = 0.05
  if (enemy.type === 'caster') baseDodge = 0.03
  
  // Higher level enemies are more agile
  const levelBonus = Math.min(0.08, enemy.level * 0.002)
  return baseDodge + levelBonus
}

export function simulateCombatTick(player: Player, enemy: Enemy): CombatResult {
  const p = {...player}
  const e = {...enemy}
  
  // Player attack phase
  const playerDodgeChance = rarityDodgeChance(p.equipped?.rarity) + (p.skills?.agility || 0) * 0.01
  const enemyDodgeChance = getEnemyDodgeChance(e)
  
  let didPlayerHit = true
  let playerDodged = false
  let enemyDodged = false
  let didEnemyHit = true
  let damage = 0
  let enemyDamage = 0
  let crit = false
  let statusEffect: string | undefined
  
  // Check if enemy dodges player attack
  if (Math.random() < enemyDodgeChance) {
    enemyDodged = true
    didPlayerHit = false
  }
  
  const damageType = getElementalDamageType(p.equipped)
  
  if (didPlayerHit) {
    // Calculate player damage
    const baseDmg = Math.max(1, Math.floor(p.dps))
    const varianceDamage = calculateDamageVariance(baseDmg)
    
    // Check for critical hit
    let critChance = rarityCritChance(p.equipped?.rarity)
    if (damageType === 'lightning') critChance += 0.05 // Lightning bonus
    crit = Math.random() < critChance
    
    damage = crit ? Math.floor(varianceDamage * 1.8) : varianceDamage
    
    // Apply elemental effects
    const elementalResult = applyElementalEffects(damage, damageType, e)
    damage = elementalResult.damage
    statusEffect = elementalResult.statusEffect
    
    e.hp -= damage
  }
  
  let msg = ''
  let enemyDefeated = false
  
  if (didPlayerHit) {
    const critText = crit ? ' (CRITICAL!)' : ''
    const elementText = damageType !== 'physical' ? ` [${damageType.toUpperCase()}]` : ''
    const statusText = statusEffect ? ` (${statusEffect})` : ''
    msg = `Player hits ${e.name} for ${damage}${elementText}${critText}${statusText}`
  } else {
    msg = `${e.name} dodged player's attack!`
  }

  if (e.hp <= 0) {
    enemyDefeated = true
    msg = didPlayerHit ? `Player dealt final blow to ${e.name}!` : msg
  } else if (didPlayerHit) {
    // Enemy retaliation phase
    if (Math.random() < playerDodgeChance) {
      playerDodged = true
      didEnemyHit = false
      msg += `. Player dodged ${e.name}'s attack!`
    } else {
      // Calculate enemy damage with variance
      const base = e.type === 'melee' ? 0.9 : e.type === 'ranged' ? 0.75 : 1.0
      const baseDamage = Math.max(0.5, base + e.level * 0.5)
      enemyDamage = calculateDamageVariance(baseDamage)
      
      // Apply enemy special abilities
      if (e.specialAbility) {
        switch (e.specialAbility) {
          case 'berserker':
            if (e.hp < e.maxHp * 0.3) {
              enemyDamage = Math.floor(enemyDamage * 1.5)
              msg += ` (BERSERKER RAGE!)`
            }
            break
          case 'precise':
            if (Math.random() < 0.15) {
              enemyDamage = Math.floor(enemyDamage * 1.3)
              msg += ` (PRECISE STRIKE!)`
            }
            break
        }
      }
      
      p.hp -= enemyDamage
      msg += `. ${e.name} hits back for ${enemyDamage}`
      
      if (p.hp <= 0) {
        p.hp = Math.max(1, Math.floor(p.maxHp * 0.6)) // Slightly less harsh death penalty
        p.gold = Math.max(0, p.gold - Math.min(10, Math.floor(p.level * 2))) // Scale penalty with level
        msg += `. Player was knocked out and revived!`
      }
    }
  }

  return { 
    player: p, 
    enemy: e, 
    enemyDefeated, 
    message: msg, 
    didPlayerHit, 
    didEnemyHit,
    playerDodged,
    enemyDodged,
    crit, 
    damage,
    enemyDamage,
    damageType,
    statusEffect
  }
}
