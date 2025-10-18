import React from 'react'
import { useGame } from '../systems/gameContext'
import { calculatePassiveTreeStats, getSkillModifiersFromTree } from '../systems/passiveTree'

export default function PassiveTreeBonusesPanel() {
  const { state } = useGame()
  const { player } = state
  
  // Calculate passive tree bonuses
  const passiveStats = calculatePassiveTreeStats(player.passiveTreeData, player.passiveTreeState)
  const skillModifiers = getSkillModifiersFromTree(player.passiveTreeData, player.passiveTreeState)
  
  // Count allocated nodes
  const allocatedNodes = Object.values(player.passiveTreeState.allocatedNodes).reduce((sum, rank) => sum + rank, 0)
  const totalNodes = Object.keys(player.passiveTreeData.nodes).length
  
  // Group stats for display
  const statGroups = [
    {
      title: 'Combat Stats',
      stats: [
        { key: 'damage', label: 'Damage', value: passiveStats.damage || 0, suffix: '' },
        { key: 'critChance', label: 'Critical Chance', value: passiveStats.critChance || 0, suffix: '%' },
        { key: 'attackSpeed', label: 'Attack Speed', value: passiveStats.attackSpeed || 0, suffix: '%' },
        { key: 'lifeSteal', label: 'Life Steal', value: passiveStats.lifeSteal || 0, suffix: '%' }
      ]
    },
    {
      title: 'Defensive Stats',
      stats: [
        { key: 'health', label: 'Health', value: passiveStats.health || 0, suffix: '' },
        { key: 'armor', label: 'Armor', value: passiveStats.armor || 0, suffix: '' },
        { key: 'dodgeChance', label: 'Dodge Chance', value: passiveStats.dodgeChance || 0, suffix: '%' },
        { key: 'blockChance', label: 'Block Chance', value: passiveStats.blockChance || 0, suffix: '%' }
      ]
    },
    {
      title: 'Resource Stats',
      stats: [
        { key: 'mana', label: 'Mana', value: passiveStats.mana || 0, suffix: '' },
        { key: 'healthRegen', label: 'Health Regen', value: passiveStats.healthRegen || 0, suffix: '/s' },
        { key: 'manaRegen', label: 'Mana Regen', value: passiveStats.manaRegen || 0, suffix: '/s' }
      ]
    },
    {
      title: 'Attributes',
      stats: [
        { key: 'strength', label: 'Strength', value: passiveStats.strength || 0, suffix: '' },
        { key: 'dexterity', label: 'Dexterity', value: passiveStats.dexterity || 0, suffix: '' },
        { key: 'intelligence', label: 'Intelligence', value: passiveStats.intelligence || 0, suffix: '' },
        { key: 'vitality', label: 'Vitality', value: passiveStats.vitality || 0, suffix: '' },
        { key: 'luck', label: 'Luck', value: passiveStats.luck || 0, suffix: '' }
      ]
    }
  ]

  return (
    <div className="panel p-4 h-full flex flex-col">
      <h2 className="text-lg font-bold mb-3 text-green-400">Passive Tree Bonuses</h2>
      
      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-medium">Allocated Nodes</span>
          <span className="text-green-400 font-bold">{allocatedNodes} / {totalNodes}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Available Points</span>
          <span className="text-yellow-400 font-bold">{player.passiveTreeState.availablePoints}</span>
        </div>
      </div>

      {/* Stats Groups */}
      <div className="space-y-4 flex-1 scrollable-panel">
        {statGroups.map(group => {
          const hasActiveStats = group.stats.some(stat => stat.value > 0)
          
          return (
            <div key={group.title} className="bg-gray-700 p-3 rounded border border-gray-600">
              <h3 className="font-bold text-white mb-2">{group.title}</h3>
              <div className="space-y-1">
                {group.stats.map(stat => (
                  <div key={stat.key} className="flex justify-between items-center text-sm">
                    <span className={stat.value > 0 ? 'text-white' : 'text-gray-400'}>
                      {stat.label}
                    </span>
                    <span className={stat.value > 0 ? 'text-green-400 font-medium' : 'text-gray-500'}>
                      {stat.value > 0 ? '+' : ''}{stat.value}{stat.suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Skill Modifiers */}
        {skillModifiers.length > 0 && (
          <div className="bg-gray-700 p-3 rounded border border-gray-600">
            <h3 className="font-bold text-white mb-2">Skill Modifiers</h3>
            <div className="space-y-1">
              {skillModifiers.map((modifier, index) => (
                <div key={index} className="text-sm">
                  <div className="text-blue-400 font-medium">{modifier.skillId}</div>
                  <div className="text-gray-300 ml-2">
                    {modifier.property}: {modifier.type === 'multiplicative' ? '×' : '+'}{modifier.value}
                    {modifier.type === 'multiplicative' && '%'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No bonuses message */}
        {allocatedNodes <= 1 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🌳</div>
            <div className="text-lg font-medium mb-1">No Passive Bonuses</div>
            <div className="text-sm">Allocate nodes in the Passive Tree to gain bonuses</div>
          </div>
        )}
      </div>
    </div>
  )
}