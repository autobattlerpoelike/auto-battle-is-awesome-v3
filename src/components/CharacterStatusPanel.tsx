import React from 'react'
import { useGame } from '../systems/gameContext'

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

export default function CharacterStatusPanel() {
  const { state, actions } = useGame()
  const p = state.player
  const skills = state.skills || {}
  
  // Calculate derived stats
  const powerMultiplier = Math.pow(1.05, (skills['power']||0))
  const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
  const projectileSpeed = (p.projectileSpeed || 1) * (1 + (skills['arcane']||0)*0.1)
  const totalDps = (p.baseDps + (p.equipped?.power||0)) * powerMultiplier + (p.dps - p.baseDps)
  const estimatedDps = (totalDps * attackSpeed).toFixed(1)
  const legacyCrit = rarityCrit(p.equipped?.rarity) * 100
  
  // Calculate total character power (all sources)
  let equipmentPower = 0
  if (p.equipment) {
    Object.values(p.equipment).forEach(equipment => {
      if (equipment?.baseStats?.damage) {
        equipmentPower += equipment.baseStats.damage
      }
      equipment?.affixes?.forEach(affix => {
        if (affix.stat === 'damage') {
          equipmentPower += affix.value
        }
      })
    })
  }
  // Add legacy equipment power
  if (p.equipped?.power) {
    equipmentPower += p.equipped.power
  }
  
  // Calculate total character power including all sources
  const basePower = p.baseDps || 0
  const skillPowerBonus = (skills['power'] || 0) * 5 // Each power skill level adds 5% base power
  const totalPower = Math.floor((basePower + equipmentPower + skillPowerBonus) * powerMultiplier)
  
  // Get all combat stats
  const totalCritChance = ((p.critChance || 0) + rarityCrit(p.equipped?.rarity)) * 100
  const dodgeChance = (p.dodgeChance || 0) * 100
  const blockChance = (p.blockChance || 0) * 100
  const lifeSteal = (p.lifeSteal || 0) * 100
  const armor = p.armor || 0
  const healthRegen = (p.healthRegen || 0)
  const manaRegen = (p.manaRegen || 0)

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
            <div className="flex justify-between">
              <span>HP:</span>
              <span className="text-red-400">{Math.floor(p.hp)}/{Math.floor(p.maxHp)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mana:</span>
              <span className="text-blue-400">{Math.floor(p.mana || 0)}/{Math.floor(p.maxMana || 50)}</span>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-purple-300 mb-1">💪 Attributes</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Strength:</span>
              <span className="text-red-400">{(p.attributes?.strength || 10) + (p.calculatedStats?.strength || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dexterity:</span>
              <span className="text-green-400">{(p.attributes?.dexterity || 10) + (p.calculatedStats?.dexterity || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Intelligence:</span>
              <span className="text-blue-400">{(p.attributes?.intelligence || 10) + (p.calculatedStats?.intelligence || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Vitality:</span>
              <span className="text-orange-400">{(p.attributes?.vitality || 10) + (p.calculatedStats?.vitality || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Luck:</span>
              <span className="text-yellow-400">{(p.attributes?.luck || 5) + (p.calculatedStats?.luck || 0)}</span>
            </div>
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
            <div className="flex justify-between">
              <span>Base DPS:</span>
              <span className="text-orange-400">{p.baseDps}</span>
            </div>
            <div className="flex justify-between">
              <span>Total DPS:</span>
              <span className="text-orange-300">{p.dps}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Power:</span>
              <span className="text-purple-400">{totalPower}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. DPS:</span>
              <span className="text-yellow-400">{estimatedDps}</span>
            </div>
            <div className="flex justify-between">
              <span>Attack Speed:</span>
              <span className="text-yellow-300">{attackSpeed.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between">
              <span>Crit Chance:</span>
              <span className="text-red-400">{totalCritChance.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Life Steal:</span>
              <span className="text-pink-400">{lifeSteal.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Defensive Stats */}
        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
          <h3 className="text-xs font-semibold text-blue-300 mb-1">🛡️ Defensive</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Armor:</span>
              <span className="text-gray-300">{armor.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dodge:</span>
              <span className="text-green-400">{dodgeChance.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Block:</span>
              <span className="text-blue-400">{blockChance.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>HP Regen:</span>
              <span className="text-red-300">{healthRegen.toFixed(1)}/s</span>
            </div>
            <div className="flex justify-between">
              <span>MP Regen:</span>
              <span className="text-blue-300">{manaRegen.toFixed(1)}/s</span>
            </div>
            <div className="flex justify-between">
              <span>Proj Speed:</span>
              <span className="text-cyan-400">{projectileSpeed.toFixed(1)}x</span>
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
          onClick={actions.resetAll}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
        >
          🔄 Reset Character
        </button>
      </div>
    </div>
  )
}
