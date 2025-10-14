export type Player = {
  level: number
  xp: number
  nextLevelXp: number
  hp: number
  maxHp: number
  dps: number
  baseDps: number
  gold: number
  skillPoints: number
  equipped?: any
  attackSpeed?: number
  projectileSpeed?: number
  skills?: Record<string, number>
  armor?: number
  critChance?: number
  dodgeChance?: number
  lifeSteal?: number
}

export const skillDescriptions = {
  endurance: 'Increases maximum HP by 10 per level',
  quick: 'Reduces combat tick interval (faster attacks)',
  agility: 'Increases dodge chance by 1% per level',
  strength: 'Increases base damage by 1 per level',
  vitality: 'Increases HP regeneration and reduces death penalty',
  precision: 'Increases critical hit chance by 1% per level',
  fortune: 'Increases gold gain and improves loot quality',
  resilience: 'Increases armor and status effect resistance'
}

export function defaultPlayer(): Player {
  return {
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    hp: 120,
    maxHp: 120,
    dps: 2,
    baseDps: 2,
    gold: 0,
    skillPoints: 0,
    equipped: undefined,
    attackSpeed: 1,
    projectileSpeed: 1,
    skills: {},
    armor: 0,
    critChance: 0,
    dodgeChance: 0,
    lifeSteal: 0
  }
}

export function calculatePlayerStats(basePlayer: Player): Player {
  const player = { ...basePlayer }
  
  // Apply skill bonuses
  const skills = player.skills || {}
  
  // Strength increases base DPS
  if (skills.strength) {
    player.baseDps += skills.strength
  }
  
  // Precision increases crit chance
  if (skills.precision) {
    player.critChance = (player.critChance || 0) + (skills.precision * 0.01)
  }
  
  // Agility increases dodge chance
  if (skills.agility) {
    player.dodgeChance = (player.dodgeChance || 0) + (skills.agility * 0.01)
  }
  
  // Resilience increases armor
  if (skills.resilience) {
    player.armor = (player.armor || 0) + skills.resilience
  }
  
  // Apply equipment bonuses
  if (player.equipped) {
    player.dps = player.baseDps + (player.equipped.power || 0)
    
    if (player.equipped.extras) {
      for (const extra of player.equipped.extras) {
        switch (extra.key) {
          case 'hp':
            player.maxHp += extra.val
            break
          case 'dps':
            player.dps += extra.val
            break
          case 'critChance':
            player.critChance = (player.critChance || 0) + extra.val
            break
          case 'dodgeChance':
            player.dodgeChance = (player.dodgeChance || 0) + extra.val
            break
          case 'lifeSteal':
            player.lifeSteal = (player.lifeSteal || 0) + extra.val
            break
          case 'armor':
            player.armor = (player.armor || 0) + extra.val
            break
          case 'projectileSpeed':
            player.projectileSpeed = (player.projectileSpeed || 1) + extra.val
            break
        }
      }
    }
  } else {
    player.dps = player.baseDps
  }
  
  return player
}
