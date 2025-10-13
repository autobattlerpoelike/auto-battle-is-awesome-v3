import React from 'react'
import { useGame } from '../systems/gameContext'
import BuildInfoBadge from './BuildInfoBadge'

export default function Header() {
  const { state } = useGame()
  const p = state.player
  const skills = state.skills || {}
  const powerMultiplier = Math.pow(1.05, (skills['power']||0))
  const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
  const totalDps = (p.baseDps + (p.equipped?.power||0)) * powerMultiplier + (p.dps - p.baseDps)
  return (
    <div className="card flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Auto Battle Is Awesome</h1>
        <BuildInfoBadge />
      </div>
      <div className="flex items-center gap-6">
        <div className="small">Gold: {Math.floor(p.gold)}</div>
        <div className="small">Enemies: {state.enemies.length}</div>
        <div className="small">DPS: {(totalDps).toFixed(1)}</div>
        <div className="small">Atk Spd: {attackSpeed.toFixed(2)}/s</div>
        <div className="small">Level {p.level} — XP {Math.floor(p.xp)} / {p.nextLevelXp}</div>
      </div>
    </div>
  )
}
