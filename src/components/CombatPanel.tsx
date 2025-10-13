import React from 'react'
import { useGame } from '../systems/gameContext'

export default function CombatPanel() {
  const { state, actions } = useGame()
  const e = state.enemy
  const p = state.player

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Combat</h2>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <div className="small">Enemy</div>
          <div className="mt-1">{e.name}</div>
          <div className="small">HP: {Math.max(0, Math.floor(e.hp))} / {e.maxHp}</div>
          <div className="small">Level: {e.level}</div>
        </div>
        <div>
          <div className="small">Player DPS</div>
          <div className="mt-1">{p.dps.toFixed(1)}</div>
          <div className="small">HP: {Math.floor(p.hp)} / {p.maxHp}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="small">Combat Log</div>
        <div className="mt-2 h-40 overflow-y-auto bg-slate-900 p-2 rounded">{state.log.map((l, i) => <div key={i} className="text-sm">{l}</div>)}</div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="button" onClick={() => actions.spawnEnemy()}>Spawn Enemy</button>
        <button className="button" onClick={() => actions.simulateTick()}>Tick</button>
        <button className="button" onClick={() => actions.toggleAutoCombat()}>{state.autoCombat ? 'Stop' : 'Auto'}</button>
      </div>
    </div>
  )
}
