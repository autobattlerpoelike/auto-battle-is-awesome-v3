import React from 'react'
import { Player } from '../systems/player'

export interface StatBreakdown {
  base: number
  attributeBonus: number
  equipmentBonus: number
  skillTreeBonus: number
  total: number
}

export const STAT_DESCRIPTIONS: Record<string, string> = {
  health: 'Maximum health points. Increased by Vitality (+3 per point) and Strength (+2 per point).',
  mana: 'Maximum mana points. Increased by Intelligence (+1 per point).',
  damage: 'Base damage per second. Increased by Strength (+1 per point) and equipment.',
  armor: 'Reduces incoming damage. Increased by equipment and Resilience skill.',
  critChance: 'Chance to deal critical damage. Increased by Dexterity (+0.5% per point), Luck (+0.5% per point), and Precision skill.',
  dodgeChance: 'Chance to avoid incoming damage. Increased by Dexterity (+0.3% per point) and Agility skill.',
  blockChance: 'Chance to block incoming damage. Increased by equipment.',
  lifeSteal: 'Percentage of damage dealt returned as health. Increased by equipment.',
  attackSpeed: 'Multiplier for attack frequency. Increased by equipment.',
  healthRegen: 'Health points regenerated per second. Increased by Vitality (+0.1 per point) and equipment.',
  manaRegen: 'Mana points regenerated per second. Increased by Intelligence (+0.2 per point) and equipment.',
  strength: 'Increases damage (+1) and health (+2). Base 10, increased by equipment.',
  dexterity: 'Increases critical chance (+0.5%) and dodge (+0.3%). Base 10, increased by equipment.',
  intelligence: 'Increases mana (+1) and mana regeneration (+0.2). Base 10, increased by equipment.',
  vitality: 'Increases health (+3) and health regeneration (+0.1). Base 10, increased by equipment.',
  luck: 'Increases critical chance (+0.5%). Base 5, increased by equipment.'
}

export function calculateStatBreakdown(player: Player, statType: string): StatBreakdown {
  const skills = player.skills || {}
  const attributes = player.attributes || {}
  const equipmentStats = player.calculatedStats || {}
  
  let base = 0
  let attributeBonus = 0
  let equipmentBonus = 0
  let skillTreeBonus = 0

  switch (statType) {
    case 'health':
      base = 120 // Base health from player.ts
      // Attribute bonuses: Strength (+2 per point above 10), Vitality (+3 per point above 10)
      const strBonusHP = Math.max(0, (attributes.strength || 10) - 10) * 2
      const vitBonusHP = Math.max(0, (attributes.vitality || 10) - 10) * 3
      attributeBonus = strBonusHP + vitBonusHP
      // Equipment bonuses: direct health + strength*2 + vitality*3
      equipmentBonus = (equipmentStats.health || 0) + 
                      (equipmentStats.strength || 0) * 2 + 
                      (equipmentStats.vitality || 0) * 3
      skillTreeBonus = (skills.endurance || 0) * 10
      break
      
    case 'mana':
      base = 50 // Base mana from player.ts
      // Intelligence bonus: +1 per point above 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10)
      // Equipment bonuses: direct mana + intelligence
      equipmentBonus = (equipmentStats.mana || 0) + (equipmentStats.intelligence || 0)
      skillTreeBonus = 0
      break
      
    case 'damage':
      base = 2 // Base DPS from player.ts
      // Strength bonus: +1 per point above 10
      attributeBonus = Math.max(0, (attributes.strength || 10) - 10)
      // Equipment bonuses: direct damage + strength from equipment
      equipmentBonus = (equipmentStats.damage || 0) + (equipmentStats.strength || 0)
      skillTreeBonus = (skills.strength || 0)
      break
      
    case 'armor':
      base = 0
      attributeBonus = 0
      equipmentBonus = equipmentStats.armor || 0
      skillTreeBonus = skills.resilience || 0
      break
      
    case 'critChance':
      base = 0 // Base 0% crit chance
      // Dexterity: +0.5% per point above 10, Luck: +0.5% per point above 5
      const dexBonusCrit = Math.max(0, (attributes.dexterity || 10) - 10) * 0.5
      const luckBonusCrit = Math.max(0, (attributes.luck || 5) - 5) * 0.5
      attributeBonus = dexBonusCrit + luckBonusCrit
      // Equipment bonuses: direct critChance + dexterity*0.5% + luck*0.5%
      equipmentBonus = ((equipmentStats.critChance || 0) * 100) + 
                      ((equipmentStats.dexterity || 0) * 0.5) + 
                      ((equipmentStats.luck || 0) * 0.5)
      skillTreeBonus = (skills.precision || 0) * 1 // 1% per level
      break
      
    case 'dodgeChance':
      base = 0
      // Dexterity: +0.3% per point above 10
      attributeBonus = Math.max(0, (attributes.dexterity || 10) - 10) * 0.3
      // Equipment bonuses: direct dodgeChance + dexterity*0.3%
      equipmentBonus = ((equipmentStats.dodgeChance || 0) * 100) + 
                      ((equipmentStats.dexterity || 0) * 0.3)
      skillTreeBonus = (skills.agility || 0) * 1 // 1% per level
      break
      
    case 'blockChance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (equipmentStats.blockChance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'lifeSteal':
      base = 0
      attributeBonus = 0
      equipmentBonus = (equipmentStats.lifeSteal || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'attackSpeed':
      base = 1.0
      attributeBonus = 0
      equipmentBonus = equipmentStats.attackSpeed || 0
      skillTreeBonus = 0
      break
      
    case 'healthRegen':
      base = 0 // Base 0 from player.ts
      // Vitality: +0.1 per point above 10
      attributeBonus = Math.max(0, (attributes.vitality || 10) - 10) * 0.1
      // Equipment bonuses: direct healthRegen + vitality*0.1
      equipmentBonus = (equipmentStats.healthRegen || 0) + 
                      ((equipmentStats.vitality || 0) * 0.1)
      skillTreeBonus = 0
      break
      
    case 'manaRegen':
      base = 0 // Base 0 from player.ts
      // Intelligence: +0.2 per point above 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10) * 0.2
      // Equipment bonuses: direct manaRegen + intelligence*0.2
      equipmentBonus = (equipmentStats.manaRegen || 0) + 
                      ((equipmentStats.intelligence || 0) * 0.2)
      skillTreeBonus = 0
      break
      
    case 'strength':
      base = 10
      attributeBonus = Math.max(0, (attributes.strength || 10) - 10)
      equipmentBonus = equipmentStats.strength || 0
      skillTreeBonus = 0
      break
      
    case 'dexterity':
      base = 10
      attributeBonus = Math.max(0, (attributes.dexterity || 10) - 10)
      equipmentBonus = equipmentStats.dexterity || 0
      skillTreeBonus = 0
      break
      
    case 'intelligence':
      base = 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10)
      equipmentBonus = equipmentStats.intelligence || 0
      skillTreeBonus = 0
      break
      
    case 'vitality':
      base = 10
      attributeBonus = Math.max(0, (attributes.vitality || 10) - 10)
      equipmentBonus = equipmentStats.vitality || 0
      skillTreeBonus = 0
      break
      
    case 'luck':
      base = 5
      attributeBonus = Math.max(0, (attributes.luck || 5) - 5)
      equipmentBonus = equipmentStats.luck || 0
      skillTreeBonus = 0
      break
      
    default:
      base = 0
      attributeBonus = 0
      equipmentBonus = 0
      skillTreeBonus = 0
  }

  const total = base + attributeBonus + equipmentBonus + skillTreeBonus

  return {
    base,
    attributeBonus,
    equipmentBonus,
    skillTreeBonus,
    total
  }
}

export function formatValue(value: number, suffix: string = ''): string {
  return `${value.toFixed(2)}${suffix}`
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-400'
  if (value < 0) return 'text-red-400'
  return 'text-gray-300'
}

interface StatTooltipProps {
  statName: string
  breakdown: StatBreakdown
  description: string
  position: { x: number; y: number }
  visible: boolean
}

export const StatTooltip: React.FC<StatTooltipProps> = ({
  statName,
  breakdown,
  description,
  position,
  visible
}) => {
  if (!visible) return null

  // Calculate tooltip position to avoid going off screen
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x - 150, window.innerWidth - 320),
    top: Math.max(position.y - 10, 10),
    zIndex: 1000,
    pointerEvents: 'none'
  }

  return (
    <div
      style={tooltipStyle}
      className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl text-xs max-w-xs"
    >
      {/* Header */}
      <div className="border-b border-gray-700 pb-2 mb-2">
        <h4 className="font-semibold text-white">{statName}</h4>
        <p className="text-gray-400 text-xs mt-1">{description}</p>
      </div>

      {/* Breakdown */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-300">Base:</span>
          <span className="text-white">{formatValue(breakdown.base)}</span>
        </div>
        
        {breakdown.attributeBonus !== 0 && (
          <div className="flex justify-between">
            <span className="text-purple-300">Attributes:</span>
            <span className={getChangeColor(breakdown.attributeBonus)}>
              +{formatValue(breakdown.attributeBonus)}
            </span>
          </div>
        )}
        
        {breakdown.equipmentBonus !== 0 && (
          <div className="flex justify-between">
            <span className="text-blue-300">Equipment:</span>
            <span className={getChangeColor(breakdown.equipmentBonus)}>
              +{formatValue(breakdown.equipmentBonus)}
            </span>
          </div>
        )}
        
        {breakdown.skillTreeBonus !== 0 && (
          <div className="flex justify-between">
            <span className="text-yellow-300">Skill Tree:</span>
            <span className={getChangeColor(breakdown.skillTreeBonus)}>
              +{formatValue(breakdown.skillTreeBonus)}
            </span>
          </div>
        )}
        
        <div className="border-t border-gray-700 pt-1 mt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total:</span>
            <span className="text-green-400">{formatValue(breakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}