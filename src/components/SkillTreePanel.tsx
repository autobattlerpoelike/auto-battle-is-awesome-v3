import React from 'react'
import { useGame } from '../systems/gameContext'
import { skillDescriptions } from '../systems/player'

const SKILLS = [
  { key: 'strength', name: 'Strength', desc: skillDescriptions.strength, max: 10 },
  { key: 'endurance', name: 'Endurance', desc: skillDescriptions.endurance, max: 10 },
  { key: 'agility', name: 'Agility', desc: skillDescriptions.agility, max: 10 },
  { key: 'precision', name: 'Precision', desc: skillDescriptions.precision, max: 10 },
  { key: 'quick', name: 'Quick Reflexes', desc: skillDescriptions.quick, max: 10 },
  { key: 'vitality', name: 'Vitality', desc: skillDescriptions.vitality, max: 10 },
  { key: 'fortune', name: 'Fortune', desc: skillDescriptions.fortune, max: 10 },
  { key: 'resilience', name: 'Resilience', desc: skillDescriptions.resilience, max: 10 }
]

export default function SkillTreePanel() {
  const { state, dispatch } = useGame()
  const skills = state.skills || {}

  function buy(key: string) {
    if (state.player.skillPoints <= 0) return
    dispatch({ type: 'UPGRADE_SKILL', payload: key })
  }

  return (
    <div className="panel p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold mb-3">Skill Tree</h2>
      <div className="mb-3 text-yellow-400 text-sm">Skill Points: {state.player.skillPoints}</div>
      <div className="space-y-2 flex-1 scrollable-panel">
        {SKILLS.map(s => {
          const rank = skills[s.key] ?? 0
          const isMaxed = rank >= s.max
          const canUpgrade = state.player.skillPoints > 0 && !isMaxed
          
          return (
            <div key={s.key} className="bg-gray-700 p-3 rounded border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-white">
                    {s.name} 
                    <span className="ml-2 text-sm text-gray-400">({rank}/{s.max})</span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">{s.desc}</div>
                </div>
                <button 
                  className={`ml-3 px-3 py-1 rounded text-sm font-medium ${
                    isMaxed 
                      ? 'bg-green-600 text-white cursor-default' 
                      : canUpgrade 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => buy(s.key)} 
                  disabled={!canUpgrade}
                >
                  {isMaxed ? 'MAX' : '+'}
                </button>
              </div>
              {rank > 0 && (
                <div className="mt-2 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(rank / s.max) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
