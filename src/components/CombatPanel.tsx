import React from 'react'
import { useGame } from '../systems/gameContext'

export default function CombatPanel() {
  const { state, dispatch } = useGame()
  const { player, enemies, log } = state

  const currentEnemy = enemies[0]
  
  const formatDamageType = (damageType?: string) => {
    if (!damageType || damageType === 'physical') return ''
    const colors = {
      fire: '🔥',
      ice: '❄️',
      lightning: '⚡',
      poison: '☠️'
    }
    return colors[damageType as keyof typeof colors] || ''
  }
  
  const formatSpecialAbility = (ability?: string) => {
    if (!ability) return ''
    const abilities = {
      berserker: '💢 Berserker',
      precise: '🎯 Precise',
      regeneration: '💚 Regeneration',
      shield: '🛡️ Shield',
      poison: '☠️ Poison',
      freeze: '❄️ Freeze',
      lightning: '⚡ Lightning',
      summon: '👥 Summon'
    }
    return abilities[ability as keyof typeof abilities] || ability
  }

  return (
    <div className="panel p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold mb-3">Combat</h2>
      
      {/* Enemy */}
      {currentEnemy && (
        <div className="mb-4 p-3 bg-red-900 rounded">
          <h3 className="font-bold text-red-200">
            {currentEnemy.isBoss && '👑 '}{currentEnemy.name} (Level {currentEnemy.level})
            {currentEnemy.isBoss && ' - BOSS'}
          </h3>
          <div className="text-sm">
            <div>HP: {currentEnemy.hp}/{currentEnemy.maxHp}</div>
            <div>DPS: {currentEnemy.dps} {formatDamageType(currentEnemy.damageType)}</div>
            <div>Type: {currentEnemy.type}</div>
            {currentEnemy.armor && <div>Armor: {currentEnemy.armor}</div>}
            {currentEnemy.specialAbility && (
              <div className="text-yellow-300">{formatSpecialAbility(currentEnemy.specialAbility)}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Player */}
      <div className="mb-4 p-3 bg-blue-900 rounded">
        <h3 className="font-bold text-blue-200">Player (Level {player.level})</h3>
        <div className="text-sm grid grid-cols-2 gap-1">
          <div>HP: {player.hp}/{player.maxHp}</div>
          <div>DPS: {player.dps}</div>
          <div>XP: {player.xp}/{player.nextLevelXp}</div>
          <div>Gold: {player.gold}</div>
          {player.armor && player.armor > 0 && <div>Armor: {player.armor}</div>}
          {player.critChance && player.critChance > 0 && <div>Crit: {(player.critChance * 100).toFixed(1)}%</div>}
          {player.dodgeChance && player.dodgeChance > 0 && <div>Dodge: {(player.dodgeChance * 100).toFixed(1)}%</div>}
          {player.lifeSteal && player.lifeSteal > 0 && <div>Life Steal: {(player.lifeSteal * 100).toFixed(1)}%</div>}
          {player.equipped && player.equipped.damageType && player.equipped.damageType !== 'physical' && (
            <div>Element: {formatDamageType(player.equipped.damageType)}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => dispatch({ type: 'SPAWN' })}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Spawn Enemy
        </button>
        {currentEnemy && (
          <button 
            onClick={() => dispatch({ type: 'TICK', payload: { enemyId: currentEnemy.id } })}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Combat Tick
          </button>
        )}
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_AUTO' })}
          className={`px-3 py-1 rounded text-sm ${
            state.autoCombat 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          Auto: {state.autoCombat ? 'ON' : 'OFF'}
        </button>
      </div>
      
      {/* Combat Log */}
      <div className="bg-gray-900 p-3 rounded h-32 overflow-y-auto">
        <h4 className="font-bold mb-2">Combat Log</h4>
        <div className="text-sm space-y-1">
          {log.slice(0, 10).map((entry, i) => (
            <div key={i} className="text-gray-300">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
