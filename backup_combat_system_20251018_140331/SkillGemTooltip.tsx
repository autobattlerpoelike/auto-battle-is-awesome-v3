import React from 'react'
import { SkillGem, SupportGem, getScaledSkillDamage, getScaledManaCost, getScaledCooldown, calculateSkillDamageWithStats, applyModifiersToSkill, GEM_RARITY_BONUSES } from '../systems/skillGems'
import { useGame } from '../systems/gameContext'

interface SkillGemTooltipProps {
  skill: SkillGem
  position: { x: number; y: number }
  showCharacterStats?: boolean
  onClose?: () => void
}

const SkillGemTooltip: React.FC<SkillGemTooltipProps> = ({ 
  skill, 
  position, 
  showCharacterStats = true,
  onClose
}) => {
  const { state } = useGame()
  const player = state.player

  // Calculate skill stats with modifiers
  const modifiedSkill = applyModifiersToSkill(skill)
  const baseDamage = getScaledSkillDamage(skill)
  const finalDamage = showCharacterStats ? calculateSkillDamageWithStats(skill, player) : modifiedSkill.damage
  const manaCost = getScaledManaCost(skill)
  const cooldown = getScaledCooldown(skill)
  
  // Calculate DPS (damage per second) based on cooldown
  const effectiveCooldown = Math.max(100, modifiedSkill.cooldown) // Minimum 0.1 second cooldown
  const skillDPS = Math.round((finalDamage * 1000) / effectiveCooldown)

  // Calculate final values with all modifiers applied
  const finalValues = {
    projectileCount: modifiedSkill.projectileCount || 1,
    area: modifiedSkill.area || 0,
    duration: modifiedSkill.duration || 0
  }

  // Get rarity bonuses
  const rarityBonus = GEM_RARITY_BONUSES[skill.rarity]

  // Calculate character-specific bonuses
  const getCharacterBonuses = () => {
    if (!showCharacterStats) return null

    const bonuses = []
    
    // Player DPS contribution
    const playerDps = player.dps || player.baseDps || 2
    const dpsContribution = Math.round((finalDamage - baseDamage) * 100) / 100
    if (dpsContribution > 0) {
      bonuses.push({
        name: 'Character DPS Bonus',
        value: `+${dpsContribution}`,
        color: 'text-green-400'
      })
    }

    // Attribute bonuses
    const attributes = player.attributes || {}
    if (skill.tags.includes('Physical') && attributes.strength > 10) {
      const strBonus = Math.round(((attributes.strength - 10) * 0.02) * 100)
      bonuses.push({
        name: 'Strength Bonus',
        value: `+${strBonus}%`,
        color: 'text-red-400'
      })
    }

    if (skill.tags.includes('Spell') && attributes.intelligence > 10) {
      const intBonus = Math.round(((attributes.intelligence - 10) * 0.02) * 100)
      bonuses.push({
        name: 'Intelligence Bonus',
        value: `+${intBonus}%`,
        color: 'text-blue-400'
      })
    }

    if (skill.tags.includes('Projectile') && attributes.dexterity > 10) {
      const dexBonus = Math.round(((attributes.dexterity - 10) * 0.015) * 100)
      bonuses.push({
        name: 'Dexterity Bonus',
        value: `+${dexBonus}%`,
        color: 'text-green-400'
      })
    }

    // Critical chance from luck
    if (attributes.luck > 5) {
      const critBonus = Math.round(((attributes.luck - 5) * 0.5) * 10) / 10
      bonuses.push({
        name: 'Critical Chance',
        value: `+${critBonus}%`,
        color: 'text-yellow-400'
      })
    }

    // Equipment bonuses (including stone bonuses)
    if (player.equipment) {
      let totalEquipmentDamage = 0
      let totalStoneDamage = 0
      
      Object.values(player.equipment).forEach(item => {
        if (!item) return
        
        // Add base equipment damage
        totalEquipmentDamage += (item.baseStats?.damage || 0)
        
        // Add affix damage
        item.affixes.forEach(affix => {
          if (affix.stat === 'damage') {
            totalEquipmentDamage += affix.value
          }
        })
        
        // Add stone damage bonuses
        if (item.sockets && player.stones) {
          const socketedStones = item.sockets.stones
            .filter(stoneId => stoneId !== null)
            .map(stoneId => player.stones.find(stone => stone.id === stoneId))
            .filter(stone => stone !== undefined)
          
          socketedStones.forEach(stone => {
            // Add base stone damage
            if (stone.baseStats.damage) {
              totalStoneDamage += stone.baseStats.damage
            }
            
            // Add stone affix damage
            stone.affixes.forEach(affix => {
              if (affix.stat === 'damage') {
                totalStoneDamage += affix.value
              }
            })
          })
        }
      })
      
      if (totalEquipmentDamage > 0) {
        bonuses.push({
          name: 'Equipment Damage',
          value: `+${totalEquipmentDamage}`,
          color: 'text-orange-400'
        })
      }
      
      if (totalStoneDamage > 0) {
        bonuses.push({
          name: 'Stone Damage',
          value: `+${totalStoneDamage}`,
          color: 'text-purple-400'
        })
      }
    }

    return bonuses
  }

  const characterBonuses = getCharacterBonuses()

  // Get active skill modifiers from support gems
  const getActiveModifiers = () => {
    const modifiers: Array<{
      name: string
      value: string
      color: string
      source: string
    }> = []
    
    skill.supportGems.forEach(support => {
      support.modifiers.forEach(modifier => {
        let displayValue = modifier.value
        let suffix = ''
        
        if (modifier.isPercentage) {
          suffix = '%'
        }
        
        if (modifier.type === 'damage_multiplier') {
          displayValue = Math.round((modifier.value - 1) * 100)
          suffix = '% more'
        }
        
        modifiers.push({
          name: modifier.description || `${modifier.type} modifier`,
          value: `${displayValue > 0 ? '+' : ''}${displayValue}${suffix}`,
          color: modifier.value > 0 ? 'text-green-400' : 'text-red-400',
          source: support.name
        })
      })
    })
    
    return modifiers
  }

  const activeModifiers = getActiveModifiers()

  // Get tag-specific rarity bonuses
  const getTagBonuses = () => {
    const bonuses = []
    
    if (skill.tags.includes('AoE') && rarityBonus.areaOfEffectBonus) {
      bonuses.push({
        name: 'Area of Effect',
        value: `+${rarityBonus.areaOfEffectBonus}%`,
        color: 'text-purple-400'
      })
    }
    
    if (skill.tags.includes('Projectile') && rarityBonus.projectileDamageBonus) {
      bonuses.push({
        name: 'Projectile Damage',
        value: `+${rarityBonus.projectileDamageBonus}%`,
        color: 'text-cyan-400'
      })
    }
    
    if (skill.tags.includes('Physical') && rarityBonus.physicalDamageBonus) {
      bonuses.push({
        name: 'Physical Damage',
        value: `+${rarityBonus.physicalDamageBonus}%`,
        color: 'text-gray-400'
      })
    }
    
    if ((skill.tags.includes('Fire') || skill.tags.includes('Cold') || skill.tags.includes('Lightning')) && rarityBonus.elementalDamageBonus) {
      bonuses.push({
        name: 'Elemental Damage',
        value: `+${rarityBonus.elementalDamageBonus}%`,
        color: 'text-yellow-400'
      })
    }
    
    return bonuses
  }

  const tagBonuses = getTagBonuses()

  // Calculate safe positioning to avoid going off-screen
  const tooltipWidth = 384 // max-w-sm is approximately 384px
  const tooltipHeight = 600 // Estimated height for skill tooltips
  
  const safePosition = {
    x: Math.max(10, Math.min(position.x, window.innerWidth - tooltipWidth - 10)),
    y: Math.max(10, Math.min(position.y, window.innerHeight - tooltipHeight - 10))
  }

  return (
    <div
      className="fixed z-50 rounded-lg shadow-2xl p-4 max-w-sm"
      style={{
        left: safePosition.x,
        top: safePosition.y,
        maxHeight: '80vh',
        overflow: 'auto',
        background: 'var(--bg-secondary)',
        border: `2px solid ${rarityBonus.colorVariant}`,
        boxShadow: '0 20px 40px var(--shadow-color)'
      }}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{skill.icon}</span>
          <div className="flex-1">
            <h3 
              className="font-bold text-lg"
              style={{ color: rarityBonus.colorVariant }}
            >
              {skill.name}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Level {skill.level}</span>
              <span style={{ color: 'var(--text-secondary)' }}>•</span>
              <span style={{ color: rarityBonus.colorVariant }}>{skill.rarity}</span>
              {skill.quality > 0 && (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>•</span>
                  <span style={{ color: 'var(--accent-primary)' }}>Q{skill.quality}%</span>
                </>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl leading-none p-1 hover:bg-gray-700 rounded ml-2"
              style={{ color: 'var(--text-secondary)' }}
              title="Close tooltip"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {skill.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: getTagColor(tag),
                color: 'white'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {skill.description}
      </p>

      {/* Core Stats */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>Damage:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {showCharacterStats ? (
              <>
                <span style={{ color: 'var(--accent-secondary)' }}>{Math.round(finalDamage)}</span>
                {finalDamage !== baseDamage && (
                  <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>({Math.round(baseDamage)} base)</span>
                )}
              </>
            ) : (
              Math.round(baseDamage)
            )}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-secondary)' }}>DPS:</span>
          <span style={{ color: 'var(--accent-secondary)' }}>{skillDPS}</span>
        </div>
        
        {manaCost > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Mana Cost:</span>
            <span style={{ color: 'var(--accent-primary)' }}>{Math.round(manaCost)}</span>
          </div>
        )}
        
        {cooldown > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Cooldown:</span>
            <span style={{ color: 'var(--accent-tertiary)' }}>{(cooldown / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Active Skill Properties */}
      <div className="mb-3">
        <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Active Skill Properties:</h4>
        <div className="p-3 rounded space-y-1" style={{ background: 'var(--bg-tertiary)' }}>
          {/* Damage Type */}
          <div className="text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Damage Type: </span>
            <span className="font-medium" style={{
              color: skill.tags.includes('Fire') ? '#ef4444' :
                     skill.tags.includes('Lightning') ? '#fbbf24' :
                     skill.tags.includes('Cold') ? '#06b6d4' :
                     skill.tags.includes('Chaos') ? '#10b981' :
                     'var(--text-primary)'
            }}>
              {skill.tags.includes('Fire') ? 'Fire' :
               skill.tags.includes('Lightning') ? 'Lightning' :
               skill.tags.includes('Cold') ? 'Cold' :
               skill.tags.includes('Chaos') ? 'Chaos' :
               'Physical'}
            </span>
          </div>

          {/* Additional Stats */}
          {finalValues.projectileCount > 1 && (
            <div className="text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Projectiles: </span>
              <span className="font-medium" style={{ color: '#06b6d4' }}>{finalValues.projectileCount}</span>
            </div>
          )}
          {finalValues.area > 0 && (
            <div className="text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Area: </span>
              <span className="font-medium" style={{ color: '#10b981' }}>{finalValues.area.toFixed(1)}</span>
            </div>
          )}
          {finalValues.duration > 0 && (
            <div className="text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
              <span className="font-medium" style={{ color: '#a855f7' }}>{(finalValues.duration / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* Skill Mechanics */}
          {skill.tags.includes('Projectile') && (
            <div className="text-xs" style={{ color: '#06b6d4' }}>
              • Projectile skill - travels to target location
            </div>
          )}
          {skill.tags.includes('AoE') && (
            <div className="text-xs" style={{ color: '#10b981' }}>
              • Area of Effect - damages multiple enemies
            </div>
          )}
          {skill.tags.includes('Channeling') && (
            <div className="text-xs" style={{ color: '#a855f7' }}>
              • Channeling skill - continuous effect
            </div>
          )}
          {skill.tags.includes('Minion') && (
            <div className="text-xs" style={{ color: 'var(--accent-primary)' }}>
              • Summons minions to fight for you
            </div>
          )}

          {/* Enhanced Properties from Support Gems */}
          {skill.supportGems.some(gem => gem.id === 'multiple_projectiles') && (
            <div className="text-xs" style={{ color: '#06b6d4' }}>
              • Fires multiple projectiles simultaneously
            </div>
          )}
          {skill.supportGems.some(gem => gem.id === 'pierce') && (
            <div className="text-xs" style={{ color: '#fbbf24' }}>
              • Projectiles pierce through enemies
            </div>
          )}
          {skill.supportGems.some(gem => gem.id === 'faster_casting') && (
            <div className="text-xs" style={{ color: 'var(--accent-secondary)' }}>
              • Enhanced casting speed
            </div>
          )}
        </div>
      </div>

      {/* Character Status Bonuses */}
      {characterBonuses && characterBonuses.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Character Bonuses:</h4>
          <div className="space-y-1">
            {characterBonuses.map((bonus, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{bonus.name}:</span>
                <span className={bonus.color}>{bonus.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag-Specific Rarity Bonuses */}
      {tagBonuses.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Rarity Bonuses:</h4>
          <div className="space-y-1">
            {tagBonuses.map((bonus, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{bonus.name}:</span>
                <span className={bonus.color}>{bonus.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Skill Modifiers */}
      {activeModifiers.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Active Modifiers:</h4>
          <div className="space-y-1">
            {activeModifiers.map((modifier, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>{modifier.name}:</span>
                  <span className={modifier.color}>{modifier.value}</span>
                </div>
                <div className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                  from {modifier.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Gems */}
      {skill.supportGems.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Support Gems:</h4>
          <div className="space-y-1">
            {skill.supportGems.map((support, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{support.icon}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{support.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>Lv.{support.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get tag colors
function getTagColor(tag: string): string {
  const tagColors: Record<string, string> = {
    // Core types
    'Attack': '#dc2626',
    'Spell': '#2563eb',
    'Aura': '#7c3aed',
    'Support': '#059669',
    
    // Damage types
    'Physical': '#6b7280',
    'Fire': '#dc2626',
    'Cold': '#06b6d4',
    'Lightning': '#fbbf24',
    'Chaos': '#7c2d12',
    'Elemental': '#f59e0b',
    
    // Mechanics
    'Projectile': '#10b981',
    'AoE': '#8b5cf6',
    'Melee': '#ef4444',
    'Channeling': '#3b82f6',
    'Duration': '#06b6d4',
    'Movement': '#22c55e',
    'Minion': '#a855f7',
    'Critical': '#fbbf24'
  }
  
  return tagColors[tag] || '#6b7280'
}

export default SkillGemTooltip