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
  const [showSupportDetails, setShowSupportDetails] = useState<{ [key: string]: boolean }>({})

  const skillBar = state.player.skillBar
  const maxSlots = skillBar?.maxSlots || 6

  const getEquippedSkill = (slotIndex: number): SkillGem | null => {
    if (!skillBar?.slots) return null
    return skillBar.slots[slotIndex] || null
  }

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex)
  }

  const handleUnequipSkill = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()
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
        onClick={() => handleSlotClick(slotIndex)}
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
            
            {isSelected && (
              <div className="skill-tooltip">
                <div className="tooltip-header">
                  <h4>{skill.name}</h4>
                  <span className="skill-type">{skill.type}</span>
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
    <div className={`skill-bar-container ${className}`}>
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