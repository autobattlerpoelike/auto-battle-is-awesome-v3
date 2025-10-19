import { Enemy, EnemyType, SpecialAbility } from './enemy'
import { Player } from './player'
import { DamageType } from './combat'

// Advanced enemy ability system for new monster types
export interface AbilityResult {
  damage?: number
  statusEffect?: string
  spawnedEnemies?: Enemy[]
  modifiedStats?: Partial<Enemy>
  playerEffects?: {
    manaDrain?: number
    hpDrain?: number
    statusEffect?: string
  }
}

// Handle swarm split ability - creates smaller enemies when killed
export function handleSwarmSplit(enemy: Enemy): Enemy[] {
  if (enemy.specialAbility !== 'split' || !enemy.splitCount || enemy.hp > 0) {
    return []
  }

  const splitEnemies: Enemy[] = []
  const splitCount = Math.min(enemy.splitCount, 4) // Max 4 splits

  for (let i = 0; i < splitCount; i++) {
    const splitEnemy: Enemy = {
      ...enemy,
      id: `${enemy.id}_split_${i}`,
      name: `Small ${enemy.name}`,
      level: Math.max(1, enemy.level - 2), // Splits are 2 levels lower
      maxHp: Math.floor(enemy.maxHp * 0.3), // 30% of original HP
      hp: Math.floor(enemy.maxHp * 0.3),
      splitCount: undefined, // Splits don't split further
      specialAbility: undefined // Splits lose special abilities
    }
    splitEnemies.push(splitEnemy)
  }

  return splitEnemies
}

// Handle mimic equipment copying
export function handleMimicEquipment(enemy: Enemy, player: Player): Partial<Enemy> {
  if (enemy.specialAbility !== 'mimic_equipment' || enemy.mimickedEquipment) {
    return {}
  }

  // Copy player's equipment stats
  const mimickedStats = {
    armor: (enemy.armor || 0) + (player.calculatedStats?.armor || 0) * 0.5,
    mimickedEquipment: {
      weapon: player.equipment?.weapon,
      armor: player.equipment?.chest, // Use 'chest' instead of 'armor'
      accessory: player.equipment?.amulet // Use 'amulet' instead of 'accessory'
    }
  }

  return mimickedStats
}

// Handle phase beast intangibility
export function handlePhaseShift(enemy: Enemy): { isIntangible: boolean, phaseTimer: number } {
  if (enemy.specialAbility !== 'phase_shift') {
    return { isIntangible: false, phaseTimer: 0 }
  }

  const currentTime = Date.now()
  const phaseTimer = enemy.phaseTimer || 0
  
  // Phase cycle: 3 seconds tangible, 2 seconds intangible
  const cycleTime = 5000 // 5 second cycle
  const phasePosition = (currentTime - phaseTimer) % cycleTime
  const isIntangible = phasePosition > 3000 // Intangible for last 2 seconds of cycle

  return { isIntangible, phaseTimer: phaseTimer || currentTime }
}

// Handle necromancer minion summoning
export function handleRaiseDead(enemy: Enemy, defeatedEnemies: Enemy[]): Enemy[] {
  if (enemy.specialAbility !== 'raise_dead' || enemy.hp <= 0) {
    return []
  }

  // 20% chance per combat tick to raise a minion
  if (Math.random() > 0.2) {
    return []
  }

  // Find recently defeated enemies to raise
  const recentlyDefeated = defeatedEnemies.filter(e => 
    e.hp <= 0 && 
    e.type !== 'necromancer' && 
    !e.id.includes('minion')
  ).slice(0, 2) // Max 2 minions at once

  const raisedMinions: Enemy[] = []
  
  recentlyDefeated.forEach((deadEnemy, index) => {
    const minion: Enemy = {
      ...deadEnemy,
      id: `${enemy.id}_minion_${index}`,
      name: `Undead ${deadEnemy.name}`,
      hp: Math.floor(deadEnemy.maxHp * 0.4), // 40% of original HP
      maxHp: Math.floor(deadEnemy.maxHp * 0.4),
      level: Math.max(1, deadEnemy.level - 1),
      specialAbility: undefined, // Minions lose special abilities
      state: 'alive',
      alpha: 0.7 // Slightly transparent to show they're undead
    }
    raisedMinions.push(minion)
  })

  return raisedMinions
}

// Handle void spawn resource drain
export function handleVoidDrain(enemy: Enemy, player: Player): AbilityResult {
  if (enemy.specialAbility !== 'void_drain' || enemy.hp <= 0) {
    return {}
  }

  // 15% chance per combat tick to drain resources
  if (Math.random() > 0.15) {
    return {}
  }

  const manaDrain = Math.floor(player.maxMana * 0.1) // Drain 10% of max mana
  const hpDrain = Math.floor(player.maxHp * 0.02) // Drain 2% of max HP

  return {
    playerEffects: {
      manaDrain,
      hpDrain,
      statusEffect: 'void drained'
    },
    damage: hpDrain // Void spawn heals for the HP drained
  }
}

// Handle crystal guardian adaptive armor
export function handleCrystalArmor(enemy: Enemy, damageType: DamageType, damage: number): number {
  if (enemy.specialAbility !== 'crystal_armor') {
    return damage
  }

  // Initialize resistances if not present
  if (!enemy.resistances) {
    enemy.resistances = {}
  }

  // Build resistance to damage types over time
  const currentResistance = enemy.resistances[damageType] || 0
  const newResistance = Math.min(0.7, currentResistance + 0.1) // Max 70% resistance
  enemy.resistances[damageType] = newResistance

  // Apply resistance to incoming damage
  const reducedDamage = Math.floor(damage * (1 - newResistance))
  
  return reducedDamage
}

// Handle adaptive resistance (learns from damage types)
export function handleAdaptiveResistance(enemy: Enemy, damageType: DamageType): number {
  if (enemy.specialAbility !== 'adaptive_resistance') {
    return 1.0 // No resistance
  }

  // Initialize resistances if not present
  if (!enemy.resistances) {
    enemy.resistances = {}
  }

  // If this is the same damage type as last time, increase resistance
  if (enemy.lastDamageType === damageType) {
    const currentResistance = enemy.resistances[damageType] || 0
    const newResistance = Math.min(0.5, currentResistance + 0.15) // Max 50% resistance, builds faster
    enemy.resistances[damageType] = newResistance
  }

  enemy.lastDamageType = damageType
  return 1 - (enemy.resistances[damageType] || 0)
}

// Handle life link ability (damage shared between linked enemies)
export function handleLifeLink(enemy: Enemy, allEnemies: Enemy[], damage: number): { [enemyId: string]: number } {
  if (enemy.specialAbility !== 'life_link' || !enemy.linkedEnemies) {
    return { [enemy.id]: damage }
  }

  const linkedAliveEnemies = allEnemies.filter(e => 
    enemy.linkedEnemies!.includes(e.id) && e.hp > 0
  )

  if (linkedAliveEnemies.length === 0) {
    return { [enemy.id]: damage }
  }

  // Distribute damage among linked enemies
  const totalLinked = linkedAliveEnemies.length + 1 // +1 for the original enemy
  const sharedDamage = Math.floor(damage / totalLinked)
  
  const damageDistribution: { [enemyId: string]: number } = {}
  damageDistribution[enemy.id] = sharedDamage
  
  linkedAliveEnemies.forEach(linkedEnemy => {
    damageDistribution[linkedEnemy.id] = sharedDamage
  })

  return damageDistribution
}

// Handle temporal shift (brief invulnerability)
export function handleTemporalShift(enemy: Enemy): boolean {
  if (enemy.specialAbility !== 'temporal_shift') {
    return false // Not invulnerable
  }

  const currentTime = Date.now()
  const cooldown = enemy.temporalShiftCooldown || 0

  // 10% chance to activate temporal shift if not on cooldown
  if (currentTime - cooldown > 8000 && Math.random() < 0.1) { // 8 second cooldown
    enemy.temporalShiftCooldown = currentTime
    return true // Invulnerable for this attack
  }

  // Check if currently in temporal shift (lasts 1 second)
  if (currentTime - cooldown < 1000) {
    return true // Still invulnerable
  }

  return false // Not invulnerable
}

// Main function to process all advanced enemy abilities
export function processAdvancedEnemyAbilities(
  enemy: Enemy, 
  player: Player, 
  incomingDamage: number,
  damageType: DamageType
): {
  message?: string
  statusEffect?: string
  spawnedEnemies?: Enemy[]
} {
  let finalDamage = incomingDamage
  let message = ''
  let statusEffect = ''
  let spawnedEnemies: Enemy[] = []

  // Process abilities based on enemy special ability
  switch (enemy.specialAbility) {
    case 'split':
      if (enemy.hp <= 0) {
        spawnedEnemies = handleSwarmSplit(enemy)
        if (spawnedEnemies.length > 0) {
          message = `${enemy.name} splits into ${spawnedEnemies.length} smaller enemies!`
        }
      }
      break

    case 'mimic_equipment':
      const mimicStats = handleMimicEquipment(enemy, player)
      if (Object.keys(mimicStats).length > 0) {
        Object.assign(enemy, mimicStats)
        message = `${enemy.name} mimics your equipment!`
      }
      break

    case 'phase_shift':
      const phaseResult = handlePhaseShift(enemy)
      if (phaseResult.isIntangible) {
        finalDamage = 0
        message = `${enemy.name} phases out, becoming intangible!`
      }
      enemy.phaseTimer = phaseResult.phaseTimer
      break

    case 'void_drain':
      const voidResult = handleVoidDrain(enemy, player)
      if (voidResult.playerEffects?.manaDrain) {
        player.mana = Math.max(0, (player.mana || 0) - voidResult.playerEffects.manaDrain)
        message = `${enemy.name} drains ${voidResult.playerEffects.manaDrain} mana!`
      }
      break

    case 'crystal_armor':
      finalDamage = handleCrystalArmor(enemy, damageType, finalDamage)
      if (finalDamage < incomingDamage) {
        message = `${enemy.name}'s crystal armor reduces damage!`
      }
      break

    case 'adaptive_resistance':
      const resistanceReduction = handleAdaptiveResistance(enemy, damageType)
      finalDamage = Math.floor(finalDamage * (1 - resistanceReduction))
      if (resistanceReduction > 0) {
        message = `${enemy.name} adapts to ${damageType} damage!`
      }
      break

    case 'temporal_shift':
      const canShift = handleTemporalShift(enemy)
      if (canShift) {
        finalDamage = 0
        message = `${enemy.name} shifts through time, avoiding damage!`
        enemy.temporalShiftCooldown = Date.now() + 10000 // 10 second cooldown
      }
      break
  }

  return {
    message: message || undefined,
    statusEffect: statusEffect || undefined,
    spawnedEnemies: spawnedEnemies.length > 0 ? spawnedEnemies : undefined
  }
}