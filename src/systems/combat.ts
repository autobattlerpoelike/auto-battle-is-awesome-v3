import { Player } from './player'
import { Enemy } from './enemy'
import { EquipmentStats } from './equipment'
import { processAdvancedEnemyAbilities } from './advancedEnemyAbilities'

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
  armorPenetration?: number
  damageReduction?: number
  effectiveCritChance?: number
  effectiveCritMultiplier?: number
}

// Advanced damage calculation interface
export interface DamageCalculation {
  baseDamage: number
  attributeBonus: number
  elementalBonus: number
  criticalMultiplier: number
  armorPenetration: number
  finalDamage: number
  isCritical: boolean
  damageType: DamageType
}

// Defense calculation interface
export interface DefenseCalculation {
  baseArmor: number
  effectiveArmor: number
  damageReduction: number
  blockChance: number
  dodgeChance: number
  finalDamageReduction: number
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

// Advanced damage calculation system
export function calculateAdvancedDamage(player: Player, damageType: DamageType): DamageCalculation {
  // Base damage calculation with improved scaling
  let baseDamage = Math.max(1, Math.floor(player.dps || 1))
  
  // Add weapon base damage from equipment stats
  if (player.calculatedStats?.damage) {
    baseDamage += player.calculatedStats.damage
  }
  
  // Advanced attribute bonuses with diminishing returns
  let attributeBonus = 0
  if (player.attributes) {
    const str = player.attributes.strength || 0
    const int = player.attributes.intelligence || 0
    const dex = player.attributes.dexterity || 0
    const luck = player.attributes.luck || 0
    
    // Strength: Physical damage with diminishing returns
    if (damageType === 'physical') {
      attributeBonus += Math.floor(str * 0.6 + Math.sqrt(str) * 0.4)
    }
    
    // Intelligence: Elemental damage with scaling
    if (damageType !== 'physical') {
      attributeBonus += Math.floor(int * 0.8 + Math.sqrt(int) * 0.6)
    }
    
    // Dexterity: Universal damage bonus
    attributeBonus += Math.floor(dex * 0.4 + Math.sqrt(dex) * 0.2)
    
    // Luck: Small damage bonus with high scaling
    attributeBonus += Math.floor(luck * 0.2 + Math.sqrt(luck) * 0.3)
  }
  
  // Elemental damage bonuses with type-specific scaling
  let elementalBonus = 0
  if (player.calculatedStats) {
    switch (damageType) {
      case 'fire':
        elementalBonus = (player.calculatedStats.fireDamage || 0) * 1.1
        break
      case 'ice':
        elementalBonus = (player.calculatedStats.iceDamage || 0) * 1.0
        break
      case 'lightning':
        elementalBonus = (player.calculatedStats.lightningDamage || 0) * 1.2
        break
      case 'poison':
        elementalBonus = (player.calculatedStats.poisonDamage || 0) * 0.9
        break
    }
  }
  
  // Calculate critical hit chance with advanced formula
  let critChance = player.calculatedStats?.critChance || 0.05
  
  // Legacy equipment crit bonus
  if (player.equipped?.rarity) {
    critChance += rarityCritChance(player.equipped.rarity)
  }
  
  // Advanced attribute-based crit scaling
  if (player.attributes) {
    const dex = player.attributes.dexterity || 0
    const luck = player.attributes.luck || 0
    
    // Dexterity: Linear scaling with cap
    critChance += Math.min(0.25, dex * 0.003)
    
    // Luck: Exponential scaling for high investment
    critChance += Math.min(0.35, luck * 0.002 + Math.sqrt(luck) * 0.001)
  }
  
  // Damage type specific crit bonuses
  if (damageType === 'lightning') critChance += 0.08
  if (damageType === 'ice') critChance += 0.03
  
  // Calculate critical multiplier with advanced scaling
  let critMultiplier = 1.8
  if (player.calculatedStats?.critMultiplier) {
    critMultiplier += player.calculatedStats.critMultiplier
  }
  
  // Luck increases crit damage with diminishing returns
  if (player.attributes?.luck) {
    const luck = player.attributes.luck
    critMultiplier += Math.min(1.0, luck * 0.015 + Math.sqrt(luck) * 0.01)
  }
  
  // Determine if critical hit occurs
  const isCritical = Math.random() < critChance
  
  // Calculate armor penetration
  const armorPenetration = player.calculatedStats?.armorPenetration || 0
  
  // Apply damage multiplier from equipment
  let totalDamage = baseDamage + attributeBonus + elementalBonus
  if (player.calculatedStats?.damageMultiplier) {
    totalDamage = Math.floor(totalDamage * (1 + player.calculatedStats.damageMultiplier))
  }
  
  // Apply variance
  totalDamage = calculateDamageVariance(totalDamage)
  
  // Apply critical hit
  const finalDamage = isCritical ? Math.floor(totalDamage * critMultiplier) : totalDamage
  
  return {
    baseDamage,
    attributeBonus,
    elementalBonus,
    criticalMultiplier: isCritical ? critMultiplier : 1.0,
    armorPenetration,
    finalDamage,
    isCritical,
    damageType
  }
}

// Advanced defense calculation system
export function calculateAdvancedDefense(player: Player, incomingDamage: number): DefenseCalculation {
  const baseArmor = player.calculatedStats?.armor || 0
  
  // Calculate dodge chance with advanced formula
  let dodgeChance = (player.calculatedStats?.dodgeChance || 0) + (player.skills?.agility || 0) * 0.01
  
  // Legacy equipment dodge bonus
  if (player.equipped?.rarity) {
    dodgeChance += rarityDodgeChance(player.equipped.rarity)
  }
  
  // Attribute-based dodge scaling
  if (player.attributes?.dexterity) {
    const dex = player.attributes.dexterity
    dodgeChance += Math.min(0.3, dex * 0.002 + Math.sqrt(dex) * 0.001)
  }
  
  // Calculate block chance
  const blockChance = player.calculatedStats?.blockChance || 0
  
  // Advanced armor calculation with diminishing returns
  const armorEfficiency = Math.min(0.85, baseArmor * 0.012 + Math.sqrt(baseArmor) * 0.008)
  const effectiveArmor = baseArmor
  
  // Calculate damage reduction from equipment
  let damageReduction = player.calculatedStats?.damageReduction || 0
  
  // Vitality-based damage reduction with scaling
  if (player.attributes?.vitality) {
    const vit = player.attributes.vitality
    damageReduction += Math.min(0.4, vit * 0.006 + Math.sqrt(vit) * 0.004)
  }
  
  // Combine armor and damage reduction
  const finalDamageReduction = Math.min(0.9, armorEfficiency + damageReduction)
  
  return {
    baseArmor,
    effectiveArmor,
    damageReduction,
    blockChance,
    dodgeChance,
    finalDamageReduction
  }
}

export function simulateCombatTick(player: Player, enemy: Enemy): CombatResult {
  const p = {...player}
  const e = {...enemy}
  
  // Use the player's calculated stats (which include equipment and stone bonuses)
  const stats = p
  
  // Player attack phase - use new dodge calculation
  let playerDodgeChance = (p.calculatedStats?.dodgeChance || 0) + (p.skills?.agility || 0) * 0.01
  
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
  let abilityMessage = ''
  
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
    // Use new advanced damage calculation system
    const damageCalc = calculateAdvancedDamage(p, damageType)
    
    damage = damageCalc.finalDamage
    crit = damageCalc.isCritical
    
    console.log(`Combat: Advanced damage calculation - Base: ${damageCalc.baseDamage}, Final: ${damageCalc.finalDamage}, Crit: ${crit}`)
    
    // Apply elemental effects
    const elementalResult = applyElementalEffects(damage, damageType, e)
    damage = elementalResult.damage
    statusEffect = elementalResult.statusEffect
    
    // Apply life steal
    if (p.calculatedStats?.lifeSteal && damage > 0) {
      const healAmount = Math.floor(damage * p.calculatedStats.lifeSteal)
      p.hp = Math.min(p.maxHp, p.hp + healAmount)
    }
    
    // Apply mana steal
    if (p.calculatedStats?.manaSteal && damage > 0) {
      const manaAmount = Math.floor(damage * p.calculatedStats.manaSteal)
      p.mana = Math.min(p.maxMana || 100, (p.mana || 0) + manaAmount)
    }
    
    // Check for cleave chance (hit multiple enemies)
    if (p.calculatedStats?.cleaveChance && Math.random() < p.calculatedStats.cleaveChance) {
      statusEffect = statusEffect ? `${statusEffect}, cleave` : 'cleave'
    }
    
    // Check for stun chance
    if (p.calculatedStats?.stunChance && Math.random() < p.calculatedStats.stunChance) {
      statusEffect = statusEffect ? `${statusEffect}, stunned` : 'stunned'
    }
    
    e.hp -= damage
    
    // Process advanced enemy abilities after taking damage
    const abilityResult = processAdvancedEnemyAbilities(e, p, damage, damageType)
    if (abilityResult.message) {
      abilityMessage = abilityResult.message
    }
    if (abilityResult.statusEffect) {
      statusEffect = statusEffect ? `${statusEffect}, ${abilityResult.statusEffect}` : abilityResult.statusEffect
    }
  }
  
  let msg = ''
  let enemyDefeated = false
  
  if (didPlayerHit) {
    const critText = crit ? ' (CRITICAL!)' : ''
    const elementText = damageType !== 'physical' ? ` [${damageType.toUpperCase()}]` : ''
    const statusText = statusEffect ? ` (${statusEffect})` : ''
    msg = `Player hits ${e.name} for ${damage}${elementText}${critText}${statusText}`
    
    // Add ability message if present
    if (abilityMessage) {
      msg += `. ${abilityMessage}`
    }
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
      const blockChance = p.calculatedStats?.blockChance || 0
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
            case 'poison':
              if (Math.random() < 0.2) {
                statusEffect = statusEffect ? `${statusEffect}, poisoned` : 'poisoned'
                msg += ` (POISON ATTACK!)`
              }
              break
            case 'lightning':
              if (Math.random() < 0.15) {
                baseDamage = Math.floor(baseDamage * 1.2)
                statusEffect = statusEffect ? `${statusEffect}, stunned` : 'stunned'
                msg += ` (LIGHTNING STRIKE!)`
              }
              break
          }
        }
        
        enemyDamage = calculateDamageVariance(baseDamage)
        
        // Use new advanced defense calculation system
        const defenseCalc = calculateAdvancedDefense(p, enemyDamage)
        enemyDamage = Math.floor(enemyDamage * (1 - defenseCalc.finalDamageReduction))
        
        enemyDamage = Math.max(1, enemyDamage) // Minimum 1 damage
        
        console.log(`Combat: Advanced defense calculation - Incoming: ${baseDamage}, Final reduction: ${defenseCalc.finalDamageReduction}, Final damage: ${enemyDamage}`)
        
        // Apply thorns damage to enemy before taking damage
        if (p.calculatedStats?.thorns && p.calculatedStats.thorns > 0) {
          e.hp -= p.calculatedStats.thorns
          msg += `. Thorns deals ${p.calculatedStats.thorns} damage to ${e.name}`
        }
        
        // Apply reflect damage
        if (p.calculatedStats?.reflectDamage && p.calculatedStats.reflectDamage > 0) {
          const reflectedDamage = Math.floor(enemyDamage * p.calculatedStats.reflectDamage)
          e.hp -= reflectedDamage
          msg += `. Reflected ${reflectedDamage} damage to ${e.name}`
        }
        
        p.hp -= enemyDamage
        msg += `. ${e.name} hits back for ${enemyDamage}`
        
        if (p.hp <= 0) {
          p.hp = Math.max(1, Math.floor(p.maxHp * 0.6)) // Use player's max HP
          p.gold = Math.max(0, p.gold - Math.min(10, Math.floor(p.level * 2))) // Scale penalty with level
          msg += `. Player was knocked out and revived!`
        }
      }
    }
  }

  // Calculate advanced stats for result
  let armorPenetration = 0
  let damageReduction = 0
  let effectiveCritChance = 0
  let effectiveCritMultiplier = 0
  
  if (didPlayerHit) {
    const damageCalc = calculateAdvancedDamage(p, damageType)
    armorPenetration = damageCalc.armorPenetration
    effectiveCritChance = damageCalc.isCritical ? 1 : 0 // Simplified for result
    effectiveCritMultiplier = damageCalc.criticalMultiplier
  }
  
  if (didEnemyHit && !playerDodged) {
    const defenseCalc = calculateAdvancedDefense(p, enemyDamage)
    damageReduction = defenseCalc.finalDamageReduction
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
    statusEffect,
    armorPenetration,
    damageReduction,
    effectiveCritChance,
    effectiveCritMultiplier
  }
}
