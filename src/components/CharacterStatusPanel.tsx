import React, { useMemo, useCallback, useState } from 'react'
import { useGame } from '../systems/gameContext'
import { StatTooltip, calculateStatBreakdown, STAT_DESCRIPTIONS } from './StatTooltip'

// Utility functions for rarity and element formatting
function rarityColor(r: string | undefined): string {
  const colors: Record<string, string> = {
    'Common': 'text-gray-400',
    'Uncommon': 'text-green-400',
    'Rare': 'text-blue-400',
    'Epic': 'text-purple-400',
    'Legendary': 'text-yellow-400'
  }
  return colors[r || 'Common'] || 'text-gray-400'
}

function elementColor(element: string | undefined): string {
  const colors: Record<string, string> = {
    'fire': 'text-red-400',
    'ice': 'text-blue-300',
    'lightning': 'text-yellow-300',
    'poison': 'text-green-300',
    'physical': 'text-gray-300'
  }
  return colors[element || 'physical'] || 'text-gray-300'
}

function formatElement(element: string | undefined): string {
  const symbols: Record<string, string> = {
    'fire': '🔥',
    'ice': '❄️',
    'lightning': '⚡',
    'poison': '☠️',
    'physical': '⚔️'
  }
  return symbols[element || 'physical'] || '⚔️'
}

function rarityCrit(rarity: string | undefined): number {
  const critChances: Record<string, number> = {
    'Common': 0.05,
    'Uncommon': 0.08,
    'Rare': 0.12,
    'Epic': 0.18,
    'Legendary': 0.25
  }
  return critChances[rarity || 'Common'] || 0.05
}

const CharacterStatusPanel = React.memo(function CharacterStatusPanel() {
  const { state, actions } = useGame()
  const p = state.player
  const skills = state.skills || {}
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    statName: string
    statType: string
    position: { x: number; y: number }
  }>({
    visible: false,
    statName: '',
    statType: '',
    position: { x: 0, y: 0 }
  })

  // Handle stat hover
  const handleStatHover = useCallback((event: React.MouseEvent, statName: string, statType: string) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      statName,
      statType,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    })
  }, [])

  const handleStatLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  // Enhanced stat component with tooltip
  const StatRow = useCallback(({ 
    label, 
    value, 
    color, 
    statType, 
    suffix = '' 
  }: { 
    label: string
    value: number | string
    color: string
    statType: string
    suffix?: string
  }) => (
    <div 
      className="flex justify-between cursor-help hover:bg-gray-700/30 px-1 py-0.5 rounded transition-colors"
      onMouseEnter={(e) => handleStatHover(e, label, statType)}
      onMouseLeave={handleStatLeave}
    >
      <span>{label}:</span>
      <span className={color}>
        {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </span>
    </div>
  ), [handleStatHover, handleStatLeave])

  // Memoize expensive calculations
  const derivedStats = useMemo(() => {
    const powerMultiplier = Math.pow(1.05, (skills['power']||0))
    const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
    const projectileSpeed = (p.projectileSpeed || 1) * (1 + (skills['arcane']||0)*0.1)
    const totalDps = (p.baseDps + (p.equipped?.power||0)) * powerMultiplier + (p.dps - p.baseDps)
    const estimatedDps = (totalDps * attackSpeed).toFixed(2)
    
    return {
      powerMultiplier,
      attackSpeed,
      projectileSpeed,
      totalDps,
      estimatedDps
    }
  }, [p.attackSpeed, p.baseDps, p.dps, p.equipped?.power, skills])
  
  // Memoize equipment power calculation
  const equipmentPower = useMemo(() => {
    let power = 0
    if (p.equipment) {
      Object.values(p.equipment).forEach(equipment => {
        if (equipment?.baseStats?.damage) {
          power += equipment.baseStats.damage
        }
        equipment?.affixes?.forEach(affix => {
          if (affix.stat === 'damage') {
            power += affix.value
          }
        })
      })
    }
    // Add legacy equipment power
    if (p.equipped?.power) {
      power += p.equipped.power
    }
    return power
  }, [p.equipment, p.equipped?.power])
  
  // Memoize total character power
  const totalPower = useMemo(() => {
    const basePower = p.baseDps || 0
    const skillPowerBonus = (skills['power'] || 0) * 5
    return Math.floor((basePower + equipmentPower + skillPowerBonus) * derivedStats.powerMultiplier)
  }, [p.baseDps, skills, equipmentPower, derivedStats.powerMultiplier])
  
  // Memoize combat stats
  const combatStats = useMemo(() => ({
    totalCritChance: ((p.critChance || 0) + rarityCrit(p.equipped?.rarity)) * 100,
    dodgeChance: (p.dodgeChance || 0) * 100,
    blockChance: (p.blockChance || 0) * 100,
    lifeSteal: (p.lifeSteal || 0) * 100,
    armor: p.armor || 0,
    healthRegen: p.healthRegen || 0,
    manaRegen: p.manaRegen || 0
  }), [p.critChance, p.equipped?.rarity, p.dodgeChance, p.blockChance, p.lifeSteal, p.armor, p.healthRegen, p.manaRegen])
  
  // Memoize reset callback
  const handleReset = useCallback(() => {
    actions.resetAll()
  }, [actions])

  return (
    <div className="h-full flex flex-col bg-gray-900/95 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-600">
        <h2 className="text-lg font-bold text-center">👤 Character Stats</h2>
      </div>
      
      {/* Character Stats */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs">
        {/* Basic Info */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-blue-300 mb-1">📊 Basic Info</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Level:</span>
              <strong className="text-blue-400">{p.level}</strong>
            </div>
            <div className="flex justify-between">
              <span>XP:</span>
              <span className="text-green-400">{p.xp}/{p.nextLevelXp}</span>
            </div>
            <StatRow 
              label="HP" 
              value={`${p.hp.toFixed(2)}/${p.maxHp.toFixed(2)}`} 
              color="text-red-400" 
              statType="health"
            />
            <StatRow 
              label="Mana" 
              value={`${(p.mana || 0).toFixed(2)}/${(p.maxMana || 50).toFixed(2)}`} 
              color="text-blue-400" 
              statType="mana"
            />
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-purple-300 mb-1">💪 Attributes</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <StatRow 
              label="Strength" 
              value={(p.attributes?.strength || 10) + (p.calculatedStats?.strength || 0)} 
              color="text-red-400" 
              statType="strength"
            />
            <StatRow 
              label="Dexterity" 
              value={(p.attributes?.dexterity || 10) + (p.calculatedStats?.dexterity || 0)} 
              color="text-green-400" 
              statType="dexterity"
            />
            <StatRow 
              label="Intelligence" 
              value={(p.attributes?.intelligence || 10) + (p.calculatedStats?.intelligence || 0)} 
              color="text-blue-400" 
              statType="intelligence"
            />
            <StatRow 
              label="Vitality" 
              value={(p.attributes?.vitality || 10) + (p.calculatedStats?.vitality || 0)} 
              color="text-orange-400" 
              statType="vitality"
            />
            <StatRow 
              label="Luck" 
              value={(p.attributes?.luck || 5) + (p.calculatedStats?.luck || 0)} 
              color="text-yellow-400" 
              statType="luck"
            />
            <div className="flex justify-between">
              <span>Attr Points:</span>
              <span className="text-purple-400">{p.attributePoints || 0}</span>
            </div>
          </div>
        </div>

        {/* Offensive Stats */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-red-300 mb-1">⚔️ Offensive</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <StatRow 
              label="Base DPS" 
              value={p.baseDps || 0} 
              color="text-orange-400" 
              statType="damage"
            />
            <StatRow 
              label="Total DPS" 
              value={p.dps || 0} 
              color="text-orange-300" 
              statType="damage"
            />
            <StatRow 
              label="Attack Speed" 
              value={derivedStats.attackSpeed} 
              color="text-yellow-300" 
              statType="attackSpeed"
              suffix="x"
            />
            <StatRow 
              label="Crit Chance" 
              value={combatStats.totalCritChance} 
              color="text-red-400" 
              statType="critChance"
              suffix="%"
            />
            <StatRow 
              label="Life Steal" 
              value={combatStats.lifeSteal} 
              color="text-pink-400" 
              statType="lifeSteal"
              suffix="%"
            />
          </div>
        </div>

        {/* Defensive Stats */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-blue-300 mb-1">🛡️ Defensive</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <StatRow 
              label="Armor" 
              value={combatStats.armor} 
              color="text-gray-300" 
              statType="armor"
            />
            <StatRow 
              label="Dodge" 
              value={combatStats.dodgeChance} 
              color="text-green-400" 
              statType="dodgeChance"
              suffix="%"
            />
            <StatRow 
              label="Block" 
              value={combatStats.blockChance} 
              color="text-blue-400" 
              statType="blockChance"
              suffix="%"
            />
            <StatRow 
              label="HP Regen" 
              value={combatStats.healthRegen} 
              color="text-red-300" 
              statType="healthRegen"
              suffix="/s"
            />
            <StatRow 
              label="MP Regen" 
              value={combatStats.manaRegen} 
              color="text-blue-300" 
              statType="manaRegen"
              suffix="/s"
            />
            <div className="flex justify-between">
              <span>Proj Speed:</span>
              <span className="text-cyan-400">{derivedStats.projectileSpeed.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Equipment Summary */}
        {(() => {
          // Check new equipment system first, then legacy
          const equippedWeapon = p.equipment?.weapon || p.equipped
          
          if (equippedWeapon) {
            return (
              <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                <h3 className="text-xs font-semibold text-yellow-300 mb-1">🗡️ Equipped Weapon</h3>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-gray-300">{equippedWeapon.type || equippedWeapon.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rarity:</span>
                    <span className={rarityColor(equippedWeapon.rarity)}>{equippedWeapon.rarity || 'Common'}</span>
                  </div>
                  {equippedWeapon.element && (
                    <div className="flex justify-between">
                      <span>Element:</span>
                      <span className={elementColor(equippedWeapon.element)}>
                        {formatElement(equippedWeapon.element)} {equippedWeapon.element}
                      </span>
                    </div>
                  )}
                  {(equippedWeapon.power || equippedWeapon.baseStats?.damage) && (
                    <div className="flex justify-between">
                      <span>Power:</span>
                      <span className="text-orange-400">+{equippedWeapon.power || equippedWeapon.baseStats?.damage || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          }
          
          return (
            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
              <h3 className="text-xs font-semibold text-yellow-300 mb-1">🗡️ Equipped Weapon</h3>
              <div className="text-xs">
                <span className="text-gray-500">No weapon equipped</span>
              </div>
            </div>
          )
        })()}

        {/* Resources */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-yellow-300 mb-1">💰 Resources</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>💰 Gold:</span>
              <span className="text-yellow-400">{p.gold}</span>
            </div>
            <div className="flex justify-between">
              <span>🔮 Skill Points:</span>
              <span className="text-purple-400">{p.skillPoints}</span>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button 
          onClick={handleReset}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
        >
          🔄 Reset Character
        </button>
      </div>

      {/* Stat Tooltip */}
      {tooltip.visible && (
        <StatTooltip
          statName={tooltip.statName}
          breakdown={calculateStatBreakdown(p, tooltip.statType)}
          description={STAT_DESCRIPTIONS[tooltip.statType]}
          position={tooltip.position}
          visible={tooltip.visible}
        />
      )}
    </div>
  )
})

export default CharacterStatusPanel
