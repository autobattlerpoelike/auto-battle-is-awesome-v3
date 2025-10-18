import React from 'react'
import { Player } from '../systems/player'
import { calculateStoneStats } from '../utils/equipmentTooltip'

export interface StatBreakdown {
  base: number
  attributeBonus: number
  equipmentBonus: number
  stoneBonus: number
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
  luck: 'Increases critical chance (+0.5%). Base 5, increased by equipment.',
  
  // Elemental damage bonuses
  fireDamage: 'Additional fire damage added to attacks. Effective against ice-resistant enemies.',
  iceDamage: 'Additional ice damage added to attacks. Can slow enemies and is effective against fire-resistant foes.',
  lightningDamage: 'Additional lightning damage added to attacks. Fast and effective against armored enemies.',
  poisonDamage: 'Additional poison damage that deals damage over time. Effective against high-health enemies.',
  
  // Elemental resistances
  fireResistance: 'Reduces fire damage taken. Essential for surviving fire-based attacks.',
  iceResistance: 'Reduces ice damage taken and slowing effects. Helps maintain mobility.',
  lightningResistance: 'Reduces lightning damage taken. Important against fast, shocking attacks.',
  poisonResistance: 'Reduces poison damage and duration. Crucial for surviving toxic environments.',
  
  // Advanced combat stats
  armorPenetration: 'Percentage of enemy armor ignored when dealing damage. Effective against heavily armored foes.',
  damageMultiplier: 'Multiplies all damage dealt. A powerful stat that scales with all damage sources.',
  stunChance: 'Chance to stun enemies on hit, preventing them from acting temporarily.',
  damageReduction: 'Reduces all incoming damage by a percentage. Stacks multiplicatively with armor.',
  movementSpeed: 'Increases movement and positioning speed. Helps with kiting and positioning.',
  reflectDamage: 'Returns a percentage of received damage back to the attacker.',
  
  // Special utility effects
  doubleDropChance: 'Chance for enemies to drop twice the normal loot. Excellent for farming.',
  cleaveChance: 'Chance for attacks to hit multiple nearby enemies simultaneously.',
  spellResistance: 'Reduces damage from magical attacks and spell effects.',
  stunResistance: 'Reduces the duration and chance of being stunned by enemies.',
  cooldownReduction: 'Reduces the cooldown time of all abilities and skills.',
  
  // Special effects
  manaSteal: 'Percentage of damage dealt returned as mana. Helps sustain mana-intensive builds.',
  thorns: 'Deals damage to attackers when you take damage. Passive retaliation effect.'
}

export function calculateStatBreakdown(player: Player, statType: string): StatBreakdown {
  const skills = player.skills || {}
  const attributes = player.attributes || {}
  
  let base = 0
  let attributeBonus = 0
  let equipmentBonus = 0
  let stoneBonus = 0
  let skillTreeBonus = 0
  
  // Calculate pure equipment stats (without stones)
  let pureEquipmentStats: any = {}
  let totalStoneStats: any = {}
  
  if (player.equipment) {
    Object.values(player.equipment).forEach(equipment => {
      if (equipment) {
        // Add base equipment stats
        Object.entries(equipment.baseStats).forEach(([stat, value]) => {
          if (typeof value === 'number') {
            pureEquipmentStats[stat] = (pureEquipmentStats[stat] || 0) + value
          }
        })
        
        // Add equipment affix stats
        equipment.affixes.forEach(affix => {
          pureEquipmentStats[affix.stat] = (pureEquipmentStats[affix.stat] || 0) + affix.value
        })
        
        // Calculate stone stats separately
        if (player.stones) {
          const stoneStats = calculateStoneStats(equipment, player.stones)
          Object.entries(stoneStats).forEach(([stat, value]) => {
            if (typeof value === 'number') {
              totalStoneStats[stat] = (totalStoneStats[stat] || 0) + value
            }
          })
        }
      }
    })
  }

  switch (statType) {
    case 'health':
      base = 120 // Base health from player.ts
      // Attribute bonuses: Strength (+2 per point above 10), Vitality (+3 per point above 10)
      const strBonusHP = Math.max(0, (attributes.strength || 10) - 10) * 2
      const vitBonusHP = Math.max(0, (attributes.vitality || 10) - 10) * 3
      attributeBonus = strBonusHP + vitBonusHP
      // Equipment bonuses: direct health + strength*2 + vitality*3
      equipmentBonus = (pureEquipmentStats.health || 0) + 
                      (pureEquipmentStats.strength || 0) * 2 + 
                      (pureEquipmentStats.vitality || 0) * 3
      // Stone bonuses: direct health + strength*2 + vitality*3
      stoneBonus = (totalStoneStats.health || 0) + 
                  (totalStoneStats.strength || 0) * 2 + 
                  (totalStoneStats.vitality || 0) * 3
      skillTreeBonus = (skills.endurance || 0) * 10
      break
      
    case 'mana':
      base = 50 // Base mana from player.ts
      // Intelligence bonus: +1 per point above 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10)
      // Equipment bonuses: direct mana + intelligence
      equipmentBonus = (pureEquipmentStats.mana || 0) + (pureEquipmentStats.intelligence || 0)
      // Stone bonuses: direct mana + intelligence
      stoneBonus = (totalStoneStats.mana || 0) + (totalStoneStats.intelligence || 0)
      skillTreeBonus = 0
      break
      
    case 'damage':
      base = 2 // Base DPS from player.ts
      // Strength bonus: +1 per point above 10
      attributeBonus = Math.max(0, (attributes.strength || 10) - 10)
      // Equipment bonuses: direct damage + strength from equipment
      equipmentBonus = (pureEquipmentStats.damage || 0) + (pureEquipmentStats.strength || 0)
      // Stone bonuses: direct damage + strength from stones
      stoneBonus = (totalStoneStats.damage || 0) + (totalStoneStats.strength || 0)
      skillTreeBonus = (skills.strength || 0)
      break
      
    case 'armor':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.armor || 0
      stoneBonus = totalStoneStats.armor || 0
      skillTreeBonus = skills.resilience || 0
      break
      
    case 'critChance':
      base = 0 // Base 0% crit chance
      // Dexterity: +0.5% per point above 10, Luck: +0.5% per point above 5
      const dexBonusCrit = Math.max(0, (attributes.dexterity || 10) - 10) * 0.5
      const luckBonusCrit = Math.max(0, (attributes.luck || 5) - 5) * 0.5
      attributeBonus = dexBonusCrit + luckBonusCrit
      // Equipment bonuses: direct critChance + dexterity*0.5% + luck*0.5%
      equipmentBonus = ((pureEquipmentStats.critChance || 0) * 100) + 
                      ((pureEquipmentStats.dexterity || 0) * 0.5) + 
                      ((pureEquipmentStats.luck || 0) * 0.5)
      // Stone bonuses: direct critChance + dexterity*0.5% + luck*0.5%
      stoneBonus = ((totalStoneStats.critChance || 0) * 100) + 
                  ((totalStoneStats.dexterity || 0) * 0.5) + 
                  ((totalStoneStats.luck || 0) * 0.5)
      skillTreeBonus = (skills.precision || 0) * 1 // 1% per level
      break
      
    case 'dodgeChance':
      base = 0
      // Dexterity: +0.3% per point above 10
      attributeBonus = Math.max(0, (attributes.dexterity || 10) - 10) * 0.3
      // Equipment bonuses: direct dodgeChance + dexterity*0.3%
      equipmentBonus = ((pureEquipmentStats.dodgeChance || 0) * 100) + 
                      ((pureEquipmentStats.dexterity || 0) * 0.3)
      // Stone bonuses: direct dodgeChance + dexterity*0.3%
      stoneBonus = ((totalStoneStats.dodgeChance || 0) * 100) + 
                  ((totalStoneStats.dexterity || 0) * 0.3)
      skillTreeBonus = (skills.agility || 0) * 1 // 1% per level
      break
      
    case 'blockChance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.blockChance || 0) * 100
      stoneBonus = (totalStoneStats.blockChance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'lifeSteal':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.lifeSteal || 0) * 100
      stoneBonus = (totalStoneStats.lifeSteal || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'attackSpeed':
      base = 1.0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.attackSpeed || 0
      stoneBonus = totalStoneStats.attackSpeed || 0
      skillTreeBonus = 0
      break
      
    case 'healthRegen':
      base = 0 // Base 0 from player.ts
      // Vitality: +0.1 per point above 10
      attributeBonus = Math.max(0, (attributes.vitality || 10) - 10) * 0.1
      // Equipment bonuses: direct healthRegen + vitality*0.1
      equipmentBonus = (pureEquipmentStats.healthRegen || 0) + 
                      ((pureEquipmentStats.vitality || 0) * 0.1)
      // Stone bonuses: direct healthRegen + vitality*0.1
      stoneBonus = (totalStoneStats.healthRegen || 0) + 
                  ((totalStoneStats.vitality || 0) * 0.1)
      skillTreeBonus = 0
      break
      
    case 'manaRegen':
      base = 0 // Base 0 from player.ts
      // Intelligence: +0.2 per point above 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10) * 0.2
      // Equipment bonuses: direct manaRegen + intelligence*0.2
      equipmentBonus = (pureEquipmentStats.manaRegen || 0) + 
                      ((pureEquipmentStats.intelligence || 0) * 0.2)
      // Stone bonuses: direct manaRegen + intelligence*0.2
      stoneBonus = (totalStoneStats.manaRegen || 0) + 
                  ((totalStoneStats.intelligence || 0) * 0.2)
      skillTreeBonus = 0
      break
      
    case 'strength':
      base = 10
      attributeBonus = Math.max(0, (attributes.strength || 10) - 10)
      equipmentBonus = pureEquipmentStats.strength || 0
      stoneBonus = totalStoneStats.strength || 0
      skillTreeBonus = 0
      break
      
    case 'dexterity':
      base = 10
      attributeBonus = Math.max(0, (attributes.dexterity || 10) - 10)
      equipmentBonus = pureEquipmentStats.dexterity || 0
      stoneBonus = totalStoneStats.dexterity || 0
      skillTreeBonus = 0
      break
      
    case 'intelligence':
      base = 10
      attributeBonus = Math.max(0, (attributes.intelligence || 10) - 10)
      equipmentBonus = pureEquipmentStats.intelligence || 0
      stoneBonus = totalStoneStats.intelligence || 0
      skillTreeBonus = 0
      break
      
    case 'vitality':
      base = 10
      attributeBonus = Math.max(0, (attributes.vitality || 10) - 10)
      equipmentBonus = pureEquipmentStats.vitality || 0
      stoneBonus = totalStoneStats.vitality || 0
      skillTreeBonus = 0
      break
      
    case 'luck':
      base = 5
      attributeBonus = Math.max(0, (attributes.luck || 5) - 5)
      equipmentBonus = pureEquipmentStats.luck || 0
      stoneBonus = totalStoneStats.luck || 0
      skillTreeBonus = 0
      break
      
    // Elemental Damage
    case 'fireDamage':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.fireDamage || 0
      stoneBonus = totalStoneStats.fireDamage || 0
      skillTreeBonus = 0
      break
      
    case 'iceDamage':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.iceDamage || 0
      stoneBonus = totalStoneStats.iceDamage || 0
      skillTreeBonus = 0
      break
      
    case 'lightningDamage':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.lightningDamage || 0
      stoneBonus = totalStoneStats.lightningDamage || 0
      skillTreeBonus = 0
      break
      
    case 'poisonDamage':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.poisonDamage || 0
      stoneBonus = totalStoneStats.poisonDamage || 0
      skillTreeBonus = 0
      break
      
    // Elemental Resistances
    case 'fireResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.fireResistance || 0) * 100
      stoneBonus = (totalStoneStats.fireResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'iceResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.iceResistance || 0) * 100
      stoneBonus = (totalStoneStats.iceResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'lightningResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.lightningResistance || 0) * 100
      stoneBonus = (totalStoneStats.lightningResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'poisonResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.poisonResistance || 0) * 100
      stoneBonus = (totalStoneStats.poisonResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    // Advanced Combat Stats
    case 'armorPenetration':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.armorPenetration || 0) * 100
      stoneBonus = (totalStoneStats.armorPenetration || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'damageMultiplier':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.damageMultiplier || 0) * 100
      stoneBonus = (totalStoneStats.damageMultiplier || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'stunChance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.stunChance || 0) * 100
      stoneBonus = (totalStoneStats.stunChance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'damageReduction':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.damageReduction || 0) * 100
      stoneBonus = (totalStoneStats.damageReduction || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'reflectDamage':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.reflectDamage || 0) * 100
      stoneBonus = (totalStoneStats.reflectDamage || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'movementSpeed':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.movementSpeed || 0) * 100
      stoneBonus = (totalStoneStats.movementSpeed || 0) * 100
      skillTreeBonus = 0
      break
      
    // Special Effects
    case 'doubleDropChance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.doubleDropChance || 0) * 100
      stoneBonus = (totalStoneStats.doubleDropChance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'cleaveChance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.cleaveChance || 0) * 100
      stoneBonus = (totalStoneStats.cleaveChance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'cooldownReduction':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.cooldownReduction || 0) * 100
      stoneBonus = (totalStoneStats.cooldownReduction || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'spellResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.spellResistance || 0) * 100
      stoneBonus = (totalStoneStats.spellResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'stunResistance':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.stunResistance || 0) * 100
      stoneBonus = (totalStoneStats.stunResistance || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'manaSteal':
      base = 0
      attributeBonus = 0
      equipmentBonus = (pureEquipmentStats.manaSteal || 0) * 100
      stoneBonus = (totalStoneStats.manaSteal || 0) * 100
      skillTreeBonus = 0
      break
      
    case 'thorns':
      base = 0
      attributeBonus = 0
      equipmentBonus = pureEquipmentStats.thorns || 0
      stoneBonus = totalStoneStats.thorns || 0
      skillTreeBonus = 0
      break
      
    default:
      base = 0
      attributeBonus = 0
      equipmentBonus = 0
      stoneBonus = 0
      skillTreeBonus = 0
  }

  const total = base + attributeBonus + equipmentBonus + stoneBonus + skillTreeBonus

  return {
    base,
    attributeBonus,
    equipmentBonus,
    stoneBonus,
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
        
        {breakdown.stoneBonus !== 0 && (
          <div className="flex justify-between">
            <span className="text-orange-300">Stones:</span>
            <span className={getChangeColor(breakdown.stoneBonus)}>
              +{formatValue(breakdown.stoneBonus)}
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