import React, { useState, useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { SkillGem, SupportGem, getSkillUnlockCost, getSkillLevelUpCost, canLevelUpSkill, getScaledSkillDamage, getScaledManaCost, getScaledCooldown, getScaledArea, getScaledDuration, getScaledSupportGemValue, getScaledSupportGemModifiers, applyModifiersToSkill } from '../systems/skillGems'
import { getAvailableSkills, getUnlockedSkills, getAvailableSupportGems, getUnlockedSupportGems } from '../systems/skillManager'

interface SkillGemPanelProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'skills' | 'supports'

export const SkillGemPanel = React.memo(function SkillGemPanel({ isOpen, onClose }: SkillGemPanelProps) {
  const { state, actions } = useGame()
  const [activeTab, setActiveTab] = useState<TabType>('skills')
  const [selectedSkill, setSelectedSkill] = useState<SkillGem | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<SupportGem | null>(null)

  // Memoize expensive skill calculations
  const skillData = useMemo(() => ({
    availableSkills: getAvailableSkills(state.player),
    unlockedSkills: getUnlockedSkills(state.player),
    availableSupports: getAvailableSupportGems(state.player),
    unlockedSupports: getUnlockedSupportGems(state.player)
  }), [state.player.skillGems, state.player.supportGems, state.player.level, state.player.skillPoints])

  if (!isOpen) return null

  const handleUnlockSkill = useCallback((skillId: string) => {
    actions.unlockSkillGem(skillId)
    setSelectedSkill(null)
  }, [actions])

  const handleUnlockSupport = useCallback((supportId: string) => {
    actions.unlockSupportGem(supportId)
    setSelectedSupport(null)
  }, [actions])

  const handleLevelUpSkill = useCallback((skillId: string) => {
    actions.levelUpSkillGem(skillId)
  }, [actions])

  const handleLevelUpSupport = useCallback((supportId: string) => {
    actions.levelUpSupportGem(supportId)
  }, [actions])

  const handleEquipSkill = (skillId: string) => {
    // Find first empty slot in skill bar
    const skillBar = state.player.skillBar
    if (!skillBar?.slots) return
    
    const emptySlotIndex = skillBar.slots.findIndex(slot => slot === null)
    if (emptySlotIndex !== -1) {
      actions.equipSkillToBar(skillId, emptySlotIndex)
    }
  }

  const handleUnequipSkill = (skillId: string) => {
    // Find the skill in the skill bar and unequip it
    const skillBar = state.player.skillBar
    if (!skillBar?.slots) return
    
    const equippedSlotIndex = skillBar.slots.findIndex(slot => slot?.id === skillId)
    if (equippedSlotIndex !== -1) {
      actions.unequipSkillFromBar(equippedSlotIndex)
    }
  }

  const renderSkillCard = (skill: SkillGem, isLocked: boolean = false) => {
    const canUnlock = !isLocked && state.player.level >= skill.unlockLevel && state.player.skillPoints >= getSkillUnlockCost(skill)
    const canLevel = !isLocked && canLevelUpSkill(skill, state.player.skillPoints)
    // Check if skill is equipped by looking at the skill bar directly
    const isEquipped = state.player.skillBar?.slots?.some(slot => slot?.id === skill.id) || false

    return (
      <div
        key={skill.id}
        className={`skill-card ${isLocked ? 'locked' : 'unlocked'} ${selectedSkill?.id === skill.id ? 'selected' : ''}`}
        onClick={() => setSelectedSkill(skill)}
      >
        <div className="skill-icon">{skill.icon}</div>
        <div className="skill-info">
          <h4 className={isLocked ? 'locked-text' : ''}>{skill.name}</h4>
          <p className="skill-level">Level {skill.level}/{skill.maxLevel}</p>
          {isEquipped && <span className="equipped-badge">Equipped</span>}
          {isLocked && (
            <div className="unlock-requirements">
              <p>Requires Level {skill.unlockLevel}</p>
              <p>Cost: {getSkillUnlockCost(skill)} SP</p>
            </div>
          )}
          {!isLocked && skill.level < skill.maxLevel && (
            <p className="level-up-cost">
              Level up cost: {getSkillLevelUpCost(skill.level)} SP
            </p>
          )}
        </div>
        <div className="skill-actions">
          {isLocked && canUnlock && (
            <button 
              className="unlock-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleUnlockSkill(skill.id)
              }}
            >
              Unlock
            </button>
          )}
          {!isLocked && canLevel && (
            <button 
              className="level-up-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleLevelUpSkill(skill.id)
              }}
            >
              Level Up
            </button>
          )}
          {!isLocked && !isEquipped && (
            <button 
              className="equip-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleEquipSkill(skill.id)
              }}
            >
              Equip
            </button>
          )}
          {!isLocked && isEquipped && (
            <button 
              className="unequip-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleUnequipSkill(skill.id)
              }}
            >
              Unequip
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderSupportCard = (support: SupportGem, isLocked: boolean = false) => {
    const canUnlock = !isLocked && state.player.level >= support.unlockLevel && state.player.skillPoints >= getSkillUnlockCost(support)
    const canLevel = !isLocked && canLevelUpSkill(support, state.player.skillPoints)

    return (
      <div
        key={support.id}
        className={`support-card ${isLocked ? 'locked' : 'unlocked'} ${selectedSupport?.id === support.id ? 'selected' : ''}`}
        onClick={() => setSelectedSupport(support)}
      >
        <div className="support-icon">{support.icon}</div>
        <div className="support-info">
          <h4 className={isLocked ? 'locked-text' : ''}>{support.name}</h4>
          <p className="support-level">Level {support.level}/{support.maxLevel}</p>
          {isLocked && (
            <div className="unlock-requirements">
              <p>Requires Level {support.unlockLevel}</p>
              <p>Cost: {getSkillUnlockCost(support)} SP</p>
            </div>
          )}
          {!isLocked && support.level < support.maxLevel && (
            <p className="level-up-cost">
              Level up cost: {getSkillLevelUpCost(support.level)} SP
            </p>
          )}
        </div>
        <div className="support-actions">
          {isLocked && canUnlock && (
            <button 
              className="unlock-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleUnlockSupport(support.id)
              }}
            >
              Unlock
            </button>
          )}
          {!isLocked && canLevel && (
            <button 
              className="level-up-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleLevelUpSupport(support.id)
              }}
            >
              Level Up
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderSkillDetails = () => {
    if (!selectedSkill) return null

    const baseValues = {
      damage: getScaledSkillDamage(selectedSkill),
      manaCost: getScaledManaCost(selectedSkill),
      cooldown: getScaledCooldown(selectedSkill),
      area: getScaledArea(selectedSkill),
      duration: getScaledDuration(selectedSkill)
    }
    
    const finalValues = applyModifiersToSkill(selectedSkill)
    const hasSupports = selectedSkill.supportGems.length > 0

    return (
      <div className="skill-details">
        <h3>{selectedSkill.name}</h3>
        <p className="skill-description">{selectedSkill.description}</p>
        <div className="skill-stats">
          <p><strong>Type:</strong> {selectedSkill.type}</p>
          <p><strong>Category:</strong> {selectedSkill.category}</p>
          <p><strong>Level:</strong> {selectedSkill.level}/{selectedSkill.maxLevel}</p>
          
          {baseValues.damage > 0 && (
            <p><strong>Damage:</strong> {hasSupports ? (
              <span>
                <span className="base-value">{baseValues.damage}</span>
                {finalValues.damage !== baseValues.damage && (
                  <span className="final-value"> → {finalValues.damage}</span>
                )}
              </span>
            ) : baseValues.damage}</p>
          )}
          
          <p><strong>Mana Cost:</strong> {hasSupports ? (
            <span>
              <span className="base-value">{baseValues.manaCost}</span>
              {finalValues.manaCost !== baseValues.manaCost && (
                <span className="final-value"> → {finalValues.manaCost}</span>
              )}
            </span>
          ) : baseValues.manaCost}</p>
          
          <p><strong>Cooldown:</strong> {hasSupports ? (
            <span>
              <span className="base-value">{baseValues.cooldown}ms</span>
              {finalValues.cooldown !== baseValues.cooldown && (
                <span className="final-value"> → {finalValues.cooldown}ms</span>
              )}
            </span>
          ) : `${baseValues.cooldown}ms`}</p>
          
          {baseValues.area > 1 && (
            <p><strong>Area:</strong> {hasSupports ? (
              <span>
                <span className="base-value">{baseValues.area.toFixed(1)}x</span>
                {finalValues.area !== baseValues.area && (
                  <span className="final-value"> → {finalValues.area.toFixed(1)}x</span>
                )}
              </span>
            ) : `${baseValues.area.toFixed(1)}x`}</p>
          )}
          
          {baseValues.duration > 0 && (
            <p><strong>Duration:</strong> {hasSupports ? (
              <span>
                <span className="base-value">{(baseValues.duration / 1000).toFixed(1)}s</span>
                {finalValues.duration !== baseValues.duration && (
                  <span className="final-value"> → {(finalValues.duration / 1000).toFixed(1)}s</span>
                )}
              </span>
            ) : `${(baseValues.duration / 1000).toFixed(1)}s`}</p>
          )}
          
          {finalValues.projectileCount > 1 && (
            <p><strong>Projectiles:</strong> {finalValues.projectileCount}</p>
          )}
        </div>
        {selectedSkill.supportGems.length > 0 && (
          <div className="attached-supports">
            <h4>Attached Support Gems:</h4>
            {selectedSkill.supportGems.map(support => (
              <div key={support.id} className="attached-support">
                <span>{support.icon} {support.name} (Lv.{support.level})</span>
                <button 
                  className="detach-btn"
                  onClick={() => actions.detachSupportGem(selectedSkill.id, support.id)}
                >
                  Detach
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderSupportDetails = () => {
    if (!selectedSupport) return null

    const scaledModifiers = getScaledSupportGemModifiers(selectedSupport)

    return (
      <div className="support-details">
        <h3>{selectedSupport.name}</h3>
        <p className="support-description">{selectedSupport.description}</p>
        <div className="support-stats">
          <p><strong>Level:</strong> {selectedSupport.level}/{selectedSupport.maxLevel}</p>
        </div>
        <div className="support-modifiers">
          <h4>Modifiers:</h4>
          {scaledModifiers.map((modifier, index) => (
            <p key={index} className="modifier">
              {modifier.description}
            </p>
          ))}
        </div>
        {selectedSupport.isUnlocked && (
          <div className="attach-to-skill">
            <h4>Attach to Skill:</h4>
            {skillData.unlockedSkills.filter(skill => 
              skill.supportGems.length < 5 && 
              !skill.supportGems.some(s => s.id === selectedSupport.id)
            ).map(skill => (
              <button
                key={skill.id}
                className="attach-btn"
                onClick={() => actions.attachSupportGem(skill.id, selectedSupport.id)}
              >
                {skill.icon} {skill.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="skill-gem-panel-overlay">
      <div className="skill-gem-panel">
        <div className="panel-header">
          <h2>Skill Gems</h2>
          <div className="player-info">
            <span>Skill Points: {state.player.skillPoints}</span>
            <span>Level: {state.player.level}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="panel-tabs">
          <button 
            className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Active Skills ({skillData.unlockedSkills.length}/{state.player.skillGems.length})
          </button>
          <button 
            className={`tab ${activeTab === 'supports' ? 'active' : ''}`}
            onClick={() => setActiveTab('supports')}
          >
            Support Gems ({skillData.unlockedSupports.length}/{state.player.supportGems.length})
          </button>
        </div>

        <div className="panel-content">
          <div className="gems-grid">
            {activeTab === 'skills' && (
              <>
                <div className="unlocked-section">
                  <h3>Unlocked Skills</h3>
                  <div className="gems-list">
                    {skillData.unlockedSkills.map(skill => renderSkillCard(skill, false))}
                  </div>
                </div>
                <div className="locked-section">
                  <h3>Available Skills</h3>
                  <div className="gems-list">
                    {skillData.availableSkills.map(skill => renderSkillCard(skill, true))}
                  </div>
                </div>
                <div className="unavailable-section">
                  <h3>Locked Skills</h3>
                  <div className="gems-list">
                    {state.player.skillGems
                      .filter(skill => !skill.isUnlocked && state.player.level < skill.unlockLevel)
                      .map(skill => renderSkillCard(skill, true))}
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'supports' && (
              <>
                <div className="unlocked-section">
                  <h3>Unlocked Support Gems</h3>
                  <div className="gems-list">
                    {skillData.unlockedSupports.map(support => renderSupportCard(support, false))}
                  </div>
                </div>
                <div className="locked-section">
                  <h3>Available Support Gems</h3>
                  <div className="gems-list">
                    {skillData.availableSupports.map(support => renderSupportCard(support, true))}
                  </div>
                </div>
                <div className="unavailable-section">
                  <h3>Locked Support Gems</h3>
                  <div className="gems-list">
                    {state.player.supportGems
                      .filter(support => !support.isUnlocked && state.player.level < support.unlockLevel)
                      .map(support => renderSupportCard(support, true))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="details-panel">
            {activeTab === 'skills' && renderSkillDetails()}
            {activeTab === 'supports' && renderSupportDetails()}
          </div>
        </div>
      </div>
    )
})

export default SkillGemPanel