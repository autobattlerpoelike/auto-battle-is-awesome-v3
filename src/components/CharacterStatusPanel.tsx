import React from 'react'
import { useGame } from '../systems/gameContext'

function rarityCrit(r) {
  if (!r) return 0.05
  if (r === 'Common') return 0.05
  if (r === 'Magic') return 0.08
  if (r === 'Rare') return 0.10
  if (r === 'Unique') return 0.15
  return 0.05
}

export default function CharacterStatusPanel() {
  const { state, actions } = useGame()
  const p = state.player
  const skills = state.skills || {}
  const powerMultiplier = Math.pow(1.05, (skills['power']||0))
  const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
  const projectileSpeed = (p.projectileSpeed || 1) * (1 + (skills['arcane']||0)*0.1)
  const totalDps = (p.baseDps + (p.equipped?.power||0)) * powerMultiplier + (p.dps - p.baseDps)
  const estimatedDps = (totalDps * attackSpeed).toFixed(1)
  const crit = rarityCrit(p.equipped?.rarity) * 100

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Character Status</h2>
      <div className="mt-2 space-y-2 small">
        <div>Level: <strong>{p.level}</strong></div>
        <div>XP: <strong>{Math.floor(p.xp)}</strong> / {p.nextLevelXp} (Next: <strong>{p.nextLevelXp - Math.floor(p.xp)}</strong>)</div>
        <div>HP: <strong style={{color:'#10b981'}}>{Math.floor(p.hp)}</strong> / {Math.floor(p.maxHp)}</div>
        <div>DPS (base): <strong style={{color:'#f97316'}}>{(p.baseDps).toFixed(1)}</strong></div>
        <div>Total DPS: <strong style={{color:'#f97316'}}>{totalDps.toFixed(1)}</strong></div>
        <div>Attack Speed: <strong style={{color:'#06b6d4'}}>{attackSpeed.toFixed(2)}</strong> /sec</div>
        <div>Projectile Speed: <strong style={{color:'#06b6d4'}}>{projectileSpeed.toFixed(2)}</strong></div>
        <div>Estimated DPS (with attack speed): <strong>{estimatedDps}</strong></div>
        <div>Crit Chance: <strong>{crit.toFixed(0)}%</strong></div>
        <div>Gold: <strong>{Math.floor(p.gold)}</strong></div>
        <div>Skill Points: <strong>{p.skillPoints}</strong></div>
        <div>Equipped: <strong>{p.equipped ? p.equipped.name + ' ('+p.equipped.rarity+')' : 'None'}</strong></div>
        <div className="mt-2">
          <button className="button" onClick={() => { if (confirm('Reset ALL progress?')) actions.resetAll() }}>Reset Character</button>
        </div>
      </div>
    </div>
)
}
