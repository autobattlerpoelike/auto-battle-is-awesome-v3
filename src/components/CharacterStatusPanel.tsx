import React, { useMemo, useCallback, useState } from 'react'
import { useGame } from '../systems/gameContext'
import { StatTooltip, calculateStatBreakdown, STAT_DESCRIPTIONS } from './StatTooltip'
import { calculatePassiveTreeStats, getSkillModifiersFromTree } from '../systems/passiveTree'

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
  }) => {
    return (
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
    )
  }, [handleStatHover, handleStatLeave])

  // Memoize expensive calculations
  const derivedStats = useMemo(() => {
    const powerMultiplier = Math.pow(1.05, (skills['power']||0))
    const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
    const projectileSpeed = (p.projectileSpeed || 1) * (1 + (skills['arcane']||0)*0.1)
    // Use the correctly calculated DPS from player stats
    const totalDps = (p.dps || 0) * powerMultiplier
    const estimatedDps = (totalDps * attackSpeed).toFixed(2)
    
    return {
      powerMultiplier,
      attackSpeed,
      projectileSpeed,
      totalDps,
      estimatedDps
    }
  }, [p.attackSpeed, p.baseDps, p.dps, p.projectileSpeed, skills])
  
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

  // Memoize passive tree stats
  const passiveTreeStats = useMemo(() => {
    if (!p.passiveTreeData || !p.passiveTreeState) return null
    return calculatePassiveTreeStats(p.passiveTreeData, p.passiveTreeState)
  }, [p.passiveTreeData, p.passiveTreeState])
  
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

        {/* Elemental Damage */}
        {(p.calculatedStats?.fireDamage || p.calculatedStats?.iceDamage || p.calculatedStats?.lightningDamage || p.calculatedStats?.poisonDamage) && (
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <h3 className="text-xs font-semibold text-orange-300 mb-1">🔥 Elemental Damage</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(p.calculatedStats?.fireDamage || 0) > 0 && (
                <StatRow 
                  label="🔥 Fire" 
                  value={p.calculatedStats?.fireDamage || 0} 
                  color="text-red-400" 
                  statType="fireDamage"
                />
              )}
              {(p.calculatedStats?.iceDamage || 0) > 0 && (
                <StatRow 
                  label="❄️ Ice" 
                  value={p.calculatedStats?.iceDamage || 0} 
                  color="text-blue-300" 
                  statType="iceDamage"
                />
              )}
              {(p.calculatedStats?.lightningDamage || 0) > 0 && (
                <StatRow 
                  label="⚡ Lightning" 
                  value={p.calculatedStats?.lightningDamage || 0} 
                  color="text-yellow-300" 
                  statType="lightningDamage"
                />
              )}
              {(p.calculatedStats?.poisonDamage || 0) > 0 && (
                <StatRow 
                  label="☠️ Poison" 
                  value={p.calculatedStats?.poisonDamage || 0} 
                  color="text-green-300" 
                  statType="poisonDamage"
                />
              )}
            </div>
          </div>
        )}

        {/* Elemental Resistances */}
        {(p.calculatedStats?.fireResistance || p.calculatedStats?.iceResistance || p.calculatedStats?.lightningResistance || p.calculatedStats?.poisonResistance) && (
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <h3 className="text-xs font-semibold text-cyan-300 mb-1">🛡️ Resistances</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(p.calculatedStats?.fireResistance || 0) > 0 && (
                <StatRow 
                  label="🔥 Fire Res" 
                  value={p.calculatedStats?.fireResistance || 0} 
                  color="text-red-400" 
                  statType="fireResistance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.iceResistance || 0) > 0 && (
                <StatRow 
                  label="❄️ Ice Res" 
                  value={p.calculatedStats?.iceResistance || 0} 
                  color="text-blue-300" 
                  statType="iceResistance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.lightningResistance || 0) > 0 && (
                <StatRow 
                  label="⚡ Lightning Res" 
                  value={p.calculatedStats?.lightningResistance || 0} 
                  color="text-yellow-300" 
                  statType="lightningResistance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.poisonResistance || 0) > 0 && (
                <StatRow 
                  label="☠️ Poison Res" 
                  value={p.calculatedStats?.poisonResistance || 0} 
                  color="text-green-300" 
                  statType="poisonResistance"
                  suffix="%"
                />
              )}
            </div>
          </div>
        )}

        {/* Advanced Combat Stats */}
        {(p.calculatedStats?.armorPenetration || p.calculatedStats?.damageMultiplier || p.calculatedStats?.stunChance || p.calculatedStats?.damageReduction || p.calculatedStats?.reflectDamage) && (
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <h3 className="text-xs font-semibold text-purple-300 mb-1">⚔️ Advanced Combat</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(p.calculatedStats?.armorPenetration || 0) > 0 && (
                <StatRow 
                  label="🗡️ Armor Pen" 
                  value={p.calculatedStats?.armorPenetration || 0} 
                  color="text-orange-400" 
                  statType="armorPenetration"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.damageMultiplier || 0) > 0 && (
                <StatRow 
                  label="💥 Damage Multi" 
                  value={p.calculatedStats?.damageMultiplier || 0} 
                  color="text-red-500" 
                  statType="damageMultiplier"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.stunChance || 0) > 0 && (
                <StatRow 
                  label="😵 Stun Chance" 
                  value={p.calculatedStats?.stunChance || 0} 
                  color="text-yellow-400" 
                  statType="stunChance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.damageReduction || 0) > 0 && (
                <StatRow 
                  label="🛡️ Damage Red" 
                  value={p.calculatedStats?.damageReduction || 0} 
                  color="text-blue-400" 
                  statType="damageReduction"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.reflectDamage || 0) > 0 && (
                <StatRow 
                  label="🪞 Reflect" 
                  value={p.calculatedStats?.reflectDamage || 0} 
                  color="text-purple-400" 
                  statType="reflectDamage"
                  suffix="%"
                />
              )}
            </div>
          </div>
        )}

        {/* Special Effects */}
        {(p.calculatedStats?.doubleDropChance || p.calculatedStats?.cleaveChance || p.calculatedStats?.cooldownReduction || p.calculatedStats?.movementSpeed) && (
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <h3 className="text-xs font-semibold text-pink-300 mb-1">✨ Special Effects</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(p.calculatedStats?.doubleDropChance || 0) > 0 && (
                <StatRow 
                  label="🎁 Double Drop" 
                  value={p.calculatedStats?.doubleDropChance || 0} 
                  color="text-yellow-400" 
                  statType="doubleDropChance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.cleaveChance || 0) > 0 && (
                <StatRow 
                  label="⚔️ Cleave" 
                  value={p.calculatedStats?.cleaveChance || 0} 
                  color="text-orange-400" 
                  statType="cleaveChance"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.cooldownReduction || 0) > 0 && (
                <StatRow 
                  label="⏰ CDR" 
                  value={p.calculatedStats?.cooldownReduction || 0} 
                  color="text-cyan-400" 
                  statType="cooldownReduction"
                  suffix="%"
                />
              )}
              {(p.calculatedStats?.movementSpeed || 0) > 0 && (
                <StatRow 
                  label="🏃 Move Speed" 
                  value={p.calculatedStats?.movementSpeed || 0} 
                  color="text-green-400" 
                  statType="movementSpeed"
                  suffix="%"
                />
              )}
            </div>
          </div>
        )}

        {/* Passive Tree Bonuses */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-yellow-300 mb-1">🌟 Passive Tree Bonuses</h3>
          {passiveTreeStats ? (
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(passiveTreeStats.damage || 0) > 0 && (
                <div className="flex justify-between">
                  <span>💪 Damage:</span>
                  <span className="text-red-400">+{passiveTreeStats.damage}</span>
                </div>
              )}
              {(passiveTreeStats.health || 0) > 0 && (
                <div className="flex justify-between">
                  <span>❤️ Health:</span>
                  <span className="text-red-300">+{passiveTreeStats.health}</span>
                </div>
              )}
              {(passiveTreeStats.mana || 0) > 0 && (
                <div className="flex justify-between">
                  <span>💙 Mana:</span>
                  <span className="text-blue-400">+{passiveTreeStats.mana}</span>
                </div>
              )}
              {(passiveTreeStats.armor || 0) > 0 && (
                <div className="flex justify-between">
                  <span>🛡️ Armor:</span>
                  <span className="text-gray-300">+{passiveTreeStats.armor}</span>
                </div>
              )}
              {(passiveTreeStats.critChance || 0) > 0 && (
                <div className="flex justify-between">
                  <span>🎯 Crit Chance:</span>
                  <span className="text-red-400">+{((passiveTreeStats.critChance || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.critMultiplier || 0) > 0 && (
                <div className="flex justify-between">
                  <span>💥 Crit Multi:</span>
                  <span className="text-red-500">+{((passiveTreeStats.critMultiplier || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.attackSpeed || 0) > 0 && (
                <div className="flex justify-between">
                  <span>⚡ Attack Speed:</span>
                  <span className="text-yellow-300">+{((passiveTreeStats.attackSpeed || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.dodgeChance || 0) > 0 && (
                <div className="flex justify-between">
                  <span>🏃 Dodge:</span>
                  <span className="text-green-400">+{((passiveTreeStats.dodgeChance || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.goldFind || 0) > 0 && (
                <div className="flex justify-between">
                  <span>🪙 Gold Find:</span>
                  <span className="text-yellow-300">+{((passiveTreeStats.goldFind || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.magicFind || 0) > 0 && (
                <div className="flex justify-between">
                  <span>🔍 Magic Find:</span>
                  <span className="text-purple-400">+{((passiveTreeStats.magicFind || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {(passiveTreeStats.experienceBonus || 0) > 0 && (
                <div className="flex justify-between">
                  <span>📚 Exp Bonus:</span>
                  <span className="text-cyan-400">+{((passiveTreeStats.experienceBonus || 0) * 100).toFixed(1)}%</span>
                </div>
              )}
              {/* Note: projectileSpeed is not in EquipmentStats interface, removing for now */}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No passive tree bonuses allocated</div>
          )}
        </div>

        {/* Consolidated Equipment Bonuses */}
        {(() => {
          // Calculate consolidated stats from ALL equipped gear
          const calculateAllEquipmentStats = () => {
            const consolidatedStats: any = {}
            const equippedItems: any[] = []
            
            // Collect all equipped items
            if (p.equipment) {
              Object.entries(p.equipment).forEach(([slot, item]) => {
                if (item && typeof item === 'object') {
                  equippedItems.push({ slot, item })
                }
              })
            }
            
            // Legacy weapon support
            if (p.equipped && !p.equipment?.weapon) {
              equippedItems.push({ slot: 'weapon', item: p.equipped })
            }
            
            // Calculate total stats from all equipment
            equippedItems.forEach(({ item }) => {
              // Add base stats
              if (item.baseStats) {
                Object.entries(item.baseStats).forEach(([stat, value]) => {
                  if (typeof value === 'number' && value > 0) {
                    consolidatedStats[stat] = (consolidatedStats[stat] || 0) + value
                  }
                })
              }
              
              // Add affix stats
              if (item.affixes) {
                item.affixes.forEach((affix: any) => {
                  const stat = affix.stat
                  const value = affix.value
                  if (typeof value === 'number' && value > 0) {
                    consolidatedStats[stat] = (consolidatedStats[stat] || 0) + value
                  }
                })
              }
              
              // Add stone stats
              if (item.sockets && item.sockets.stones) {
                item.sockets.stones.forEach((stoneId: string | null) => {
                  if (stoneId && p.stones) {
                    const stone = p.stones.find((s: any) => s.id === stoneId)
                    if (stone) {
                      // Add stone base stats
                      if (stone.baseStats) {
                        Object.entries(stone.baseStats).forEach(([stat, value]) => {
                          if (typeof value === 'number' && value > 0) {
                            consolidatedStats[stat] = (consolidatedStats[stat] || 0) + value
                          }
                        })
                      }
                      
                      // Add stone affix stats
                      if (stone.affixes) {
                        stone.affixes.forEach((affix: any) => {
                          const stat = affix.stat
                          const value = affix.value
                          if (typeof value === 'number' && value > 0) {
                            consolidatedStats[stat] = (consolidatedStats[stat] || 0) + value
                          }
                        })
                      }
                    }
                  }
                })
              }
            })
            
            return { consolidatedStats, equippedItems }
          }
          
          const formatStatValue = (stat: string, value: number): string => {
            const percentageStats = [
              'critChance', 'dodgeChance', 'blockChance', 'lifeSteal', 'manaSteal',
              'fireResistance', 'coldResistance', 'lightningResistance', 'chaosResistance',
              'iceResistance', 'poisonResistance', 'spellResistance', 'stunResistance',
              'increasedDamage', 'increasedAttackSpeed', 'increasedCastSpeed',
              'increasedMovementSpeed', 'increasedCritMultiplier', 'attackSpeed',
              'castSpeed', 'movementSpeed', 'damageReduction', 'reflectDamage',
              'armorPenetration', 'damageMultiplier', 'stunChance', 'doubleDropChance',
              'cleaveChance', 'cooldownReduction', 'goldFind', 'magicFind', 'experienceBonus',
              'healthRegen', 'manaRegen'
            ]
            
            if (percentageStats.includes(stat)) {
              return `${(value * 100).toFixed(1)}%`
            }
            
            return value.toFixed(1)
          }
          
          const getStatDisplayName = (stat: string): string => {
            const statNames: Record<string, string> = {
              damage: 'Damage', armor: 'Armor', health: 'Health', mana: 'Mana',
              strength: 'Strength', dexterity: 'Dexterity', intelligence: 'Intelligence', 
              vitality: 'Vitality', luck: 'Luck', critChance: 'Crit Chance',
              critMultiplier: 'Crit Multiplier', attackSpeed: 'Attack Speed',
              dodgeChance: 'Dodge Chance', blockChance: 'Block Chance',
              lifeSteal: 'Life Steal', manaSteal: 'Mana Steal',
              fireDamage: 'Fire Damage', iceDamage: 'Ice Damage',
              lightningDamage: 'Lightning Damage', poisonDamage: 'Poison Damage',
              fireResistance: 'Fire Resistance', iceResistance: 'Ice Resistance',
              lightningResistance: 'Lightning Resistance', poisonResistance: 'Poison Resistance',
              armorPenetration: 'Armor Penetration', damageMultiplier: 'Damage Multiplier',
              stunChance: 'Stun Chance', damageReduction: 'Damage Reduction',
              reflectDamage: 'Reflect Damage', goldFind: 'Gold Find',
              magicFind: 'Magic Find', experienceBonus: 'Experience Bonus',
              healthRegen: 'Health Regen', manaRegen: 'Mana Regen'
            }
            return statNames[stat] || stat.charAt(0).toUpperCase() + stat.slice(1)
          }
          
          const { consolidatedStats, equippedItems } = calculateAllEquipmentStats()
          
          return (
            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
              <h3 className="text-xs font-semibold text-yellow-300 mb-1">⚔️ All Equipment Bonuses</h3>
              <div className="text-xs space-y-1">
                {/* Equipment Count */}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Equipped Items:</span>
                  <span className="text-blue-400">{equippedItems.length}</span>
                </div>
                
                {/* Consolidated Stats */}
                {Object.keys(consolidatedStats).length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(consolidatedStats)
                      .filter(([_, value]) => typeof value === 'number' && value > 0)
                      .sort(([a], [b]) => getStatDisplayName(a).localeCompare(getStatDisplayName(b)))
                      .map(([stat, value]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="text-gray-300">{getStatDisplayName(stat)}:</span>
                          <span className="text-green-400">+{formatStatValue(stat, value as number)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-2">
                    {equippedItems.length === 0 ? 'No equipment equipped' : 'No stat bonuses from equipment'}
                  </div>
                )}
                
                {/* Equipment Slots Summary */}
                {equippedItems.length > 0 && (
                  <div className="border-t border-gray-600 pt-1 mt-2">
                    <div className="text-blue-300 font-medium mb-1">Equipped Slots:</div>
                    <div className="flex flex-wrap gap-1">
                      {equippedItems.map(({ slot, item }) => (
                        <span 
                          key={slot} 
                          className={`px-1 py-0.5 rounded text-xs ${rarityColor(item.rarity)} bg-gray-700/50`}
                          title={`${item.name || item.type || 'Unknown'} (${item.rarity || 'Common'})`}
                        >
                          {slot.charAt(0).toUpperCase() + slot.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
