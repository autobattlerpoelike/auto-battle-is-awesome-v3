import React, { useState, useEffect } from 'react'
import { useGame } from '../systems/gameContext'
import { 
  SkillGem, 
  calculateSkillManaCost, 
  calculateSkillCooldown,
  getScaledSkillDamage,
  getScaledManaCost,
  getScaledCooldown,
  applyModifiersToSkill
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

  const handleUnequipSkill = (slotIndex: number) => {
    actions.unequipSkillFromBar(slotIndex)
    setSelectedSlot(null)
  }

  const handleUseSkill = (skill: SkillGem) => {
    if (state.player.mana < skill.manaCost) {
      actions.log(`Not enough mana to use ${skill.name}! (${skill.manaCost} required, ${state.player.mana} available)`)
      return
    }

    // Check cooldown (this would be implemented in the game loop)
    actions.log(`Used ${skill.name}!`)
    
    // Apply skill effects (this would be implemented based on skill type)
    // For now, just log the usage
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
            
            {isSelected && (
              <div className="skill-tooltip">
                <div className="tooltip-header">
                  <h4>{skill.name}</h4>
                  <span className="skill-type">{skill.type}</span>
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
                      <span>Support Gems ({skill.supportGems.length}/5)</span>
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
                  <button 
                    className="use-skill-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseSkill(skill)
                    }}
                    disabled={state.player.mana < skill.manaCost}
                  >
                    Use Skill
                  </button>
                  <button 
                    className="unequip-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnequipSkill(slotIndex)
                    }}
                  >
                    Unequip
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

  const renderQuickActions = () => {
    const equippedSkills = skillBar?.slots
      ? skillBar.slots
          .map((skill, index) => ({ skill, index }))
          .filter(({ skill }) => skill !== null)
          .map(({ skill, index }) => ({ skill: skill!, index }))
      : []

    return (
      <div className="skill-bar-actions">
        <div className="auto-use-controls">
          <label className="auto-use-toggle">
            <input
              type="checkbox"
              checked={false}
              onChange={(e) => {
                // This would be implemented in the game context
                actions.log(`Auto-use skills: ${e.target.checked ? 'enabled' : 'disabled'}`)
              }}
            />
            Auto-use skills
          </label>
        </div>
        
        <div className="quick-use-buttons">
          {equippedSkills.map(({ skill, index }) => (
            <button
              key={skill.id}
              className={`quick-use-btn ${state.player.mana < skill.manaCost ? 'disabled' : ''}`}
              onClick={() => handleUseSkill(skill)}
              disabled={state.player.mana < skill.manaCost}
              title={`Use ${skill.name} (Slot ${index + 1})`}
            >
              <span className="quick-use-icon">{skill.icon}</span>
              <span className="quick-use-key">{index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`skill-bar-container ${className}`}>
      <div className="skill-bar-header">
        <h3>Skill Bar</h3>
        <div className="skill-bar-info">
          <span>Slots: {skillBar?.slots ? skillBar.slots.filter(s => s !== null).length : 0}/{maxSlots}</span>
        </div>
      </div>
      
      <div className="skill-bar">
        {Array.from({ length: maxSlots }, (_, index) => renderSkillSlot(index))}
      </div>
      
      {renderQuickActions()}
      
      <div className="skill-bar-help">
        <p>Click slots to view details • Use number keys 1-6 for quick activation</p>
      </div>
    </div>
  )
}