import React, { useState } from 'react'
import { useGame } from '../systems/gameContext'
import { 
  SkillGem, 
  applyModifiersToSkill,
  getSkillTagsDisplay
} from '../systems/skillGems'

interface SkillBarProps {
  className?: string
}

export function SkillBar({ className = '' }: SkillBarProps) {
  const { state, actions } = useGame()
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [showSupportDetails, setShowSupportDetails] = useState<Record<string, boolean>>({})
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  const skillBar = state.player.skillBar
  const maxSlots = skillBar?.maxSlots || 6

  const getEquippedSkill = (slotIndex: number): SkillGem | null => {
    if (!skillBar?.slots) return null
    return skillBar.slots[slotIndex] || null
  }

  const handleSlotClick = (slotIndex: number, event?: React.MouseEvent) => {
    if (selectedSlot === slotIndex) {
      setSelectedSlot(null)
      setTooltipPosition(null)
    } else {
      setSelectedSlot(slotIndex)
      if (event) {
        setTooltipPosition({
          x: event.clientX + 10,
          y: event.clientY + 10
        })
      }
    }
  }

  const handleUnequipSkill = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`🔧 Attempting to unequip skill from slot ${slotIndex}`)
    const skill = getEquippedSkill(slotIndex)
    console.log(`🔧 Skill to unequip:`, skill)
    actions.unequipSkillFromBar(slotIndex)
    setSelectedSlot(null)
  }

  const toggleSupportDetails = (skillId: string) => {
    setShowSupportDetails(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }))
  }

  const renderSkillSlot = (slotIndex: number) => {
    const skill = getEquippedSkill(slotIndex)
    const isSelected = selectedSlot === slotIndex
    const isEmpty = !skill

    return (
      <div
        key={slotIndex}
        className={`skill-slot ${isEmpty ? 'empty' : 'filled'} ${isSelected ? 'selected' : ''}`}
        onClick={(e) => handleSlotClick(slotIndex, e)}
      >
        <div className="slot-number">{slotIndex + 1}</div>
        
        {skill ? (
          <>
            <div className="skill-icon" title={skill.name}>
              {skill.icon}
            </div>
            <div className="skill-level">{skill.level}</div>
            
            {skill.supportGems.length > 0 && (
              <div className="support-indicator">
                <span className="support-count">{skill.supportGems.length}</span>
              </div>
            )}

            <div className="skill-mana-cost">{applyModifiersToSkill(skill).manaCost}</div>
            
            {/* Unequip button */}
            <button 
              className="unequip-skill-btn"
              onClick={(e) => handleUnequipSkill(slotIndex, e)}
              title="Unequip skill"
            >
              ×
            </button>
            
            {isSelected && tooltipPosition && (
              <div 
                className="skill-tooltip"
                style={{
                  left: Math.max(10, Math.min(tooltipPosition.x, window.innerWidth - 420)),
                  top: Math.max(10, Math.min(tooltipPosition.y, window.innerHeight - 350)),
                  maxWidth: '400px',
                  maxHeight: '340px',
                  overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="tooltip-header">
                  <div>
                    <h4>{skill.name}</h4>
                    <span className="skill-type">{skill.type}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSlot(null)
                      setTooltipPosition(null)
                    }}
                    className="text-gray-400 hover:text-white text-xl leading-none p-1 hover:bg-gray-700 rounded"
                    title="Close tooltip"
                  >
                    ×
                  </button>
                </div>
                
                {/* Skill Tags */}
                <div className="skill-tags">
                  <span className="tags-label">Tags: </span>
                  <span className="tags-list">{getSkillTagsDisplay(skill)}</span>
                </div>
                
                <p className="skill-description">{skill.description}</p>
                <div className="skill-stats">
                  <div>Level: {skill.level}/{skill.maxLevel}</div>
                  {(() => {
                    const finalValues = applyModifiersToSkill(skill)
                    return (
                      <>
                        {finalValues.damage > 0 && <div>Damage: {finalValues.damage}</div>}
                        <div>Mana: {finalValues.manaCost}</div>
                        <div>Cooldown: {finalValues.cooldown}ms</div>
                        {finalValues.projectileCount > 1 && <div>Projectiles: {finalValues.projectileCount}</div>}
                      </>
                    )
                  })()}
                </div>
                
                {skill.supportGems.length > 0 && (
                  <div className="support-gems">
                    <div 
                      className="support-header"
                      onClick={() => toggleSupportDetails(skill.id)}
                    >
                      <span>Support Gems ({skill.supportGems.length}/6)</span>
                      <span className={`expand-icon ${showSupportDetails[skill.id] ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                    
                    {showSupportDetails[skill.id] && (
                      <div className="support-list">
                        {skill.supportGems.map(support => (
                          <div key={support.id} className="support-item">
                            <span className="support-icon">{support.icon}</span>
                            <span className="support-name">{support.name}</span>
                            <span className="support-level">Lv.{support.level}</span>
                            <button 
                              className="detach-support-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                actions.detachSupportGem(skill.id, support.id)
                              }}
                              title="Detach support gem"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="tooltip-actions">
                  <div className="auto-skill-status">
                    <span className="auto-indicator">🔄 Auto-Active</span>
                    <span className="skill-status">
                      {skill.id === 'whirlwind' ? 'Channeling in Combat' : 'Ready'}
                    </span>
                  </div>
                  <button 
                    className="unequip-btn-large"
                    onClick={(e) => handleUnequipSkill(slotIndex, e)}
                    title="Unequip this skill"
                  >
                    Unequip Skill
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-slot-content">
            <div className="empty-icon">+</div>
            <div className="empty-text">Empty</div>
          </div>
        )}
      </div>
    )
  }

  const renderCombatStatus = () => {
    const whirlwindSkill = skillBar?.slots?.find(skill => skill?.id === 'whirlwind')
    
    return (
      <div className="combat-status">
        <div className="auto-combat-info">
          <span className="status-label">Combat Mode:</span>
          <span className="status-value">Automatic Whirlwind</span>
        </div>
        {whirlwindSkill && (
          <div className="whirlwind-stats">
            <span>Mana Cost: {applyModifiersToSkill(whirlwindSkill).manaCost}/sec</span>
            <span>Area Damage: {applyModifiersToSkill(whirlwindSkill).damage}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`skill-bar-container ${className}`}
      onClick={(e) => {
        // Close tooltip when clicking outside
        if (selectedSlot !== null && !e.defaultPrevented) {
          setSelectedSlot(null)
          setTooltipPosition(null)
        }
      }}
    >
      <div className="skill-bar-header">
        <h3>Combat Skills</h3>
        <div className="skill-bar-info">
          <span>Active Skills: {skillBar?.slots ? skillBar.slots.filter(s => s !== null).length : 0}/{maxSlots}</span>
        </div>
      </div>
      
      <div className="skill-bar">
        {Array.from({ length: maxSlots }, (_, index) => renderSkillSlot(index))}
      </div>
      
      {renderCombatStatus()}
      
      <div className="skill-bar-help">
        <p>Skills activate automatically during combat • Click slots to view details and support gems</p>
      </div>
    </div>
  )
}