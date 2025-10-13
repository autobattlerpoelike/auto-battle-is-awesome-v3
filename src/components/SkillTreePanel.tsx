import React from 'react'
import { useGame } from '../systems/gameContext'

const SKILLS = [
  { key: 'power', name: 'Power Strike', desc: '+5% base DPS per rank', max: 10 },
  { key: 'endurance', name: 'Endurance', desc: '+10 HP per rank', max: 10 },
  { key: 'quick', name: 'Quick Reflexes', desc: '+5% attack speed per rank', max: 10 },
  { key: 'arcane', name: 'Arcane Focus', desc: '+10% projectile speed per rank', max: 10 }
]

export default function SkillTreePanel() {
  const { state, actions } = useGame()
  const skills = state.skills || {}

  function buy(key) {
    if (state.player.skillPoints <= 0) return
    actions.upgradeSkill(key)
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Skill Tree</h2>
      <div className="mt-2 small">Skill Points: {state.player.skillPoints}</div>
      <div className="mt-2 space-y-2">
        {SKILLS.map(s => {
          const rank = skills[s.key] ?? 0
          return (
            <div key={s.key} className="flex items-center justify-between p-2" style={{border: '1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
              <div>
                <div style={{fontWeight:700}}>{s.name} <span className="small">({rank}/{s.max})</span></div>
                <div className="small" title={s.desc}>{s.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="button" onClick={() => buy(s.key)} disabled={state.player.skillPoints <= 0 || rank >= s.max}>{rank >= s.max ? 'MAX' : '+'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
