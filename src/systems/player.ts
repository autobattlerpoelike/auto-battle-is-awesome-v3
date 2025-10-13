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
    skills: {}
  }
}
