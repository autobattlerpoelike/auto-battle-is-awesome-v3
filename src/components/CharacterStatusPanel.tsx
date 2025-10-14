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

function rarityColor(r) {
  if (!r) return '#9ca3af'
  if (r === 'Common') return '#9ca3af'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  if (r === 'Legendary') return '#ff6b6b'
  return '#9ca3af'
}

function elementColor(element) {
  if (!element || element === 'physical') return ''
  const colors = {
    fire: '#ff6b6b',
    ice: '#74c0fc',
    lightning: '#ffd43b',
    poison: '#51cf66'
  }
  return colors[element] || ''
}

function formatElement(element) {
  if (!element || element === 'physical') return ''
  const symbols = {
    fire: '🔥',
    ice: '❄️',
    lightning: '⚡',
    poison: '☠️'
  }
  return symbols[element] || ''
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
    <div className="h-full flex flex-col bg-gray-900/95 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <h2 className="text-xl font-bold text-center">👤 Character</h2>
      </div>
      
      {/* Character Stats */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Basic Info */}
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Basic Info</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Level:</span>
              <strong className="text-blue-400">{p.level}</strong>
            </div>
            <div className="flex justify-between">
              <span>XP:</span>
              <strong className="text-purple-400">{Math.floor(p.xp)} / {p.nextLevelXp}</strong>
            </div>
            <div className="flex justify-between">
              <span>Next Level:</span>
              <strong className="text-yellow-400">{p.nextLevelXp - Math.floor(p.xp)}</strong>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Combat</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>HP:</span>
              <strong style={{color:'#10b981'}}>{Math.floor(p.hp)} / {Math.floor(p.maxHp)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Base DPS:</span>
              <strong style={{color:'#f97316'}}>{(p.baseDps).toFixed(1)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total DPS:</span>
              <strong style={{color:'#f97316'}}>{totalDps.toFixed(1)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Est. DPS:</span>
              <strong className="text-red-400">{estimatedDps}</strong>
            </div>
            <div className="flex justify-between">
              <span>Attack Speed:</span>
              <strong style={{color:'#06b6d4'}}>{attackSpeed.toFixed(2)}/s</strong>
            </div>
            <div className="flex justify-between">
              <span>Crit Chance:</span>
              <strong className="text-orange-400">{crit.toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Resources</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>💰 Gold:</span>
              <strong className="text-yellow-400">{Math.floor(p.gold).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span>⭐ Skill Points:</span>
              <strong className="text-cyan-400">{p.skillPoints}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="p-4 border-t border-gray-600">
        <button 
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
          onClick={() => { if (confirm('Reset ALL progress?')) actions.resetAll() }}
        >
          🔄 Reset Character
        </button>
      </div>
    </div>
  )
}
