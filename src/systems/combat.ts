import { Player } from './player'
import { Enemy } from './enemy'
import { EquipmentStats } from './equipment'

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
  if (rarity === 'Magic') return 0.03
  if (rarity === 'Rare') return 0.06
  if (rarity === 'Unique') return 0.10
  if (rarity === 'Legendary') return 0.15
  return 0
}

function rarityDodgeChance(rarity: string): number {
  if (rarity === 'Magic') return 0.02
  if (rarity === 'Rare') return 0.04
  if (rarity === 'Unique') return 0.07
  if (rarity === 'Legendary') return 0.10
  return 0
}

function getElementalDamageType(weapon: any): DamageType {
  return weapon?.damageType || 'physical'
}

function calculateDamageVariance(baseDamage: number): number {
  // Add 10% variance to damage
  const variance = 0.1
  const min = baseDamage * (1 - variance)
  const max = baseDamage * (1 + variance)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function applyElementalEffects(damage: number, damageType: DamageType, target: any): { damage: number, statusEffect?: string } {
  let finalDamage = damage
  let statusEffect: string | undefined

  switch (damageType) {
    case 'fire':
      // Fire does 10% more damage and can cause burning
      finalDamage = Math.floor(damage * 1.1)
      if (Math.random() < 0.15) {
        statusEffect = 'burning'
      }
      break
    case 'ice':
      // Ice can slow enemies
      if (Math.random() < 0.20) {
        statusEffect = 'slowed'
      }
      break
    case 'lightning':
      // Lightning can stun and has high crit chance (handled elsewhere)
      if (Math.random() < 0.10) {
        statusEffect = 'stunned'
      }
      break
    case 'poison':
      // Poison does less immediate damage but causes DoT
      finalDamage = Math.floor(damage * 0.8)
      if (Math.random() < 0.25) {
        statusEffect = 'poisoned'
      }
      break
    case 'physical':
    default:
      // Physical damage has no special effects
      break
  }

  return { damage: finalDamage, statusEffect }
}

function getEnemyDodgeChance(enemy: Enemy): number {
  const baseDodge = 0.05 // 5% base dodge
  const levelBonus = Math.min(0.15, enemy.level * 0.005) // Up to 15% bonus at level 30
  return baseDodge + levelBonus
}

export function simulateCombatTick(player: Player, enemy: Enemy): CombatResult {
  const p = {...player}
  const e = {...enemy}
  
  // Use calculated stats from the new system, with fallback to player stats
  const stats: EquipmentStats & Player = { ...p, ...p.calculatedStats }
  
  // Player attack phase - use new dodge calculation
  let playerDodgeChance = (stats.dodgeChance || 0) + (p.skills?.agility || 0) * 0.01
  
  // Legacy equipment dodge bonus
  if (p.equipped?.rarity) {
    playerDodgeChance += rarityDodgeChance(p.equipped.rarity)
  }
  
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
  
  // Determine damage type from equipped weapon
  let damageType: DamageType = 'physical'
  if (p.equipment?.weapon?.damageType) {
    damageType = p.equipment.weapon.damageType as DamageType
  } else if (p.equipped) {
    damageType = getElementalDamageType(p.equipped)
  }
  
  if (didPlayerHit) {
    // Calculate player damage using new system
    let baseDmg = Math.max(1, Math.floor(stats.dps || p.dps || 1))
    
    // Add attribute bonuses
    if (p.attributes) {
      // Strength increases physical damage
      if (damageType === 'physical') {
        baseDmg += Math.floor((p.attributes.strength || 0) * 0.5)
      }
      // Intelligence increases elemental damage
      if (damageType !== 'physical') {
        baseDmg += Math.floor((p.attributes.intelligence || 0) * 0.6)
      }
      // Dexterity increases all damage slightly
      baseDmg += Math.floor((p.attributes.dexterity || 0) * 0.3)
    }
    
    const varianceDamage = calculateDamageVariance(baseDmg)
    
    // Calculate critical hit chance
    let critChance = stats.critChance || 0.05
    
    // Legacy equipment crit bonus
    if (p.equipped?.rarity) {
      critChance += rarityCritChance(p.equipped.rarity)
    }
    
    // Dexterity increases crit chance
    if (p.attributes?.dexterity) {
      critChance += ((p.attributes.dexterity || 0) * 0.002)
    }
    
    // Lightning damage type bonus
    if (damageType === 'lightning') critChance += 0.05
    
    crit = Math.random() < critChance
    
    // Apply critical multiplier
    let critMultiplier = 1.8
    if (p.attributes?.luck) {
      critMultiplier += ((p.attributes.luck || 0) * 0.01) // Luck increases crit damage
    }
    
    damage = crit ? Math.floor(varianceDamage * critMultiplier) : varianceDamage
    
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
      // Check for block
      const blockChance = stats.blockChance || 0
      const blocked = Math.random() < blockChance
      
      if (blocked) {
        didEnemyHit = false
        msg += `. Player blocked ${e.name}'s attack!`
      } else {
        // Calculate enemy damage with variance
        const base = e.type === 'melee' ? 0.9 : e.type === 'ranged' ? 0.75 : 1.0
        let baseDamage = Math.max(0.5, base + e.level * 0.5)
        
        // Apply enemy special abilities
        if (e.specialAbility) {
          switch (e.specialAbility) {
            case 'berserker':
              if (e.hp < e.maxHp * 0.3) {
                baseDamage = Math.floor(baseDamage * 1.5)
                msg += ` (BERSERKER RAGE!)`
              }
              break
            case 'precise':
              if (Math.random() < 0.15) {
                baseDamage = Math.floor(baseDamage * 1.3)
                msg += ` (PRECISE STRIKE!)`
              }
              break
          }
        }
        
        enemyDamage = calculateDamageVariance(baseDamage)
        
        // Apply armor reduction
        const armor = stats.armor || 0
        const armorReduction = Math.min(0.8, armor * 0.01) // Max 80% damage reduction
        enemyDamage = Math.floor(enemyDamage * (1 - armorReduction))
        
        // Vitality reduces damage taken
        if (p.attributes?.vitality) {
          const vitalityReduction = Math.min(0.3, ((p.attributes.vitality || 0) * 0.005))
          enemyDamage = Math.floor(enemyDamage * (1 - vitalityReduction))
        }
        
        enemyDamage = Math.max(1, enemyDamage) // Minimum 1 damage
        
        p.hp -= enemyDamage
        msg += `. ${e.name} hits back for ${enemyDamage}`
        
        if (p.hp <= 0) {
          p.hp = Math.max(1, Math.floor((stats.maxHp || p.maxHp) * 0.6)) // Use calculated max HP
          p.gold = Math.max(0, p.gold - Math.min(10, Math.floor(p.level * 2))) // Scale penalty with level
          msg += `. Player was knocked out and revived!`
        }
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
