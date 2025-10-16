import React, { useState, useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { SkillGem, SupportGem, getSkillUnlockCost, getSkillLevelUpCost, canLevelUpSkill, getScaledSkillDamage, getScaledManaCost, getScaledCooldown, getScaledArea, getScaledDuration, getScaledSupportGemValue, getScaledSupportGemModifiers, applyModifiersToSkill, getSkillTagsDisplay, isCompatibleSupport, GEM_RARITY_BONUSES } from '../systems/skillGems'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  // Filter functions
  const filterSkills = (skills: SkillGem[]) => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.size === 0 || 
                         skill.tags.some(tag => selectedTags.has(tag));
      return matchesSearch && matchesTags;
    });
  };

  const filterSupports = (supports: SupportGem[]) => {
    return supports.filter(support => {
      const matchesSearch = support.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           support.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const skillData = useMemo(() => ({
    availableSkills: filterSkills(getAvailableSkills(state.player)),
    unlockedSkills: filterSkills(getUnlockedSkills(state.player)),
    availableSupports: filterSupports(getAvailableSupportGems(state.player)),
    unlockedSupports: filterSupports(getUnlockedSupportGems(state.player))
  }), [state.player, searchTerm, selectedTags])

  // Get all available tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    [...getAvailableSkills(state.player), ...getUnlockedSkills(state.player)].forEach(skill => {
      skill.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [state.player])

  const handleUnlockSkill = useCallback((skillId: string) => {
    actions.unlockSkillGem(skillId)
  }, [actions])

  const handleLevelUpSkill = useCallback((skillId: string) => {
    actions.levelUpSkillGem(skillId)
  }, [actions])

  const handleUnlockSupport = useCallback((supportId: string) => {
    actions.unlockSupportGem(supportId)
  }, [actions])

  const handleLevelUpSupport = useCallback((supportId: string) => {
    actions.levelUpSupportGem(supportId)
  }, [actions])

  if (!isOpen) return null

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Normal': '#ffffff',
      'Magic': '#8888ff',
      'Rare': '#ffff88',
      'Unique': '#ff8800'
    }
    return colors[rarity as keyof typeof colors] || '#ffffff'
  }

  const renderSkillCard = (skill: SkillGem, isLocked: boolean) => {
    const unlockCost = getSkillUnlockCost(skill)
    const levelUpCost = getSkillLevelUpCost(skill.level)
    const canLevel = canLevelUpSkill(skill, state.player.skillPoints)
    const isSelected = selectedSkill?.id === skill.id
    const rarityBonus = GEM_RARITY_BONUSES[skill.rarity]

    return (
      <div 
        key={skill.id} 
        className={`skill-card ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedSkill(skill)}
        style={{ borderColor: getRarityColor(skill.rarity) }}
      >
        <div className="skill-header">
          <span className="skill-icon">{skill.icon}</span>
          <div className="skill-info">
            <h4 className="skill-name" style={{ color: getRarityColor(skill.rarity) }}>
              {skill.name}
            </h4>
            <div className="skill-meta">
              <span className="skill-level">Lv.{skill.level}/{skill.maxLevel}</span>
              {skill.quality > 0 && (
                <span className="skill-quality">Q: {skill.quality}%</span>
              )}
              <span className="skill-rarity">{skill.rarity}</span>
            </div>
          </div>
        </div>
        
        <div className="skill-tags">
          {skill.tags.slice(0, 3).map(tag => (
            <span key={tag} className={`skill-tag tag-${tag.toLowerCase()}`}>
              {tag}
            </span>
          ))}
          {skill.tags.length > 3 && <span className="skill-tag-more">+{skill.tags.length - 3}</span>}
        </div>

        <div className="skill-stats-preview">
          <div className="stat-item">
            <span className="stat-label">Damage:</span>
            <span className="stat-value">{getScaledSkillDamage(skill)}</span>
          </div>
          {skill.supportGems.length > 0 && (
            <div className="stat-item">
              <span className="stat-label">Supports:</span>
              <span className="stat-value">{skill.supportGems.length}/6</span>
            </div>
          )}
        </div>

        <div className="skill-actions">
          {isLocked && (
            <button 
              className="unlock-btn"
              disabled={state.player.skillPoints < unlockCost}
              onClick={(e) => {
                e.stopPropagation()
                handleUnlockSkill(skill.id)
              }}
            >
              Unlock ({unlockCost} SP)
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
              Level Up ({levelUpCost} SP)
            </button>
          )}
          {!isLocked && skill.isEquipped && (
            <span className="equipped-indicator">⚡ Equipped</span>
          )}
        </div>
      </div>
    )
  }

  const renderSupportCard = (support: SupportGem, isLocked: boolean) => {
    const unlockCost = getSkillUnlockCost(support)
    const levelUpCost = getSkillLevelUpCost(support.level)
    const canLevel = canLevelUpSkill(support, state.player.skillPoints)
    const isSelected = selectedSupport?.id === support.id
    const compatibleSkills = skillData.unlockedSkills.filter(skill => isCompatibleSupport(skill, support))

    return (
      <div 
        key={support.id} 
        className={`support-card ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedSupport(support)}
        style={{ borderColor: getRarityColor(support.rarity) }}
      >
        <div className="support-header">
          <span className="support-icon">{support.icon}</span>
          <div className="support-info">
            <h4 className="support-name" style={{ color: getRarityColor(support.rarity) }}>
              {support.name}
            </h4>
            <div className="support-meta">
              <span className="support-level">Lv.{support.level}/{support.maxLevel}</span>
              {support.quality > 0 && (
                <span className="support-quality">Q: {support.quality}%</span>
              )}
              <span className="support-rarity">{support.rarity}</span>
            </div>
          </div>
        </div>

        <div className="support-tags">
          {support.tags.slice(0, 3).map(tag => (
            <span key={tag} className={`support-tag tag-${tag.toLowerCase()}`}>
              {tag}
            </span>
          ))}
          {support.tags.length > 3 && <span className="support-tag-more">+{support.tags.length - 3}</span>}
        </div>

        <div className="support-compatibility">
          <span className="compatibility-label">Compatible with:</span>
          <span className="compatibility-count">{compatibleSkills.length} skills</span>
        </div>

        <div className="support-actions">
          {isLocked && (
            <button 
              className="unlock-btn"
              disabled={state.player.skillPoints < unlockCost}
              onClick={(e) => {
                e.stopPropagation()
                handleUnlockSupport(support.id)
              }}
            >
              Unlock ({unlockCost} SP)
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
              Level Up ({levelUpCost} SP)
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
    const rarityBonus = GEM_RARITY_BONUSES[selectedSkill.rarity]

    return (
      <div className="skill-details">
        <div className="skill-details-header">
          <h3 style={{ color: getRarityColor(selectedSkill.rarity) }}>
            {selectedSkill.icon} {selectedSkill.name}
          </h3>
          <div className="skill-details-meta">
            <span className="detail-rarity" style={{ color: getRarityColor(selectedSkill.rarity) }}>
              {selectedSkill.rarity}
            </span>
            {selectedSkill.quality > 0 && (
              <span className="detail-quality">Quality: {selectedSkill.quality}%</span>
            )}
          </div>
        </div>

        <p className="skill-description">{selectedSkill.description}</p>
        
        <div className="skill-tags-full">
          <h4>Tags:</h4>
          <div className="tags-container">
            {selectedSkill.tags.map(tag => (
              <span key={tag} className={`skill-tag tag-${tag.toLowerCase()}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="skill-stats">
          <h4>Statistics:</h4>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">Type:</span>
              <span className="stat-value">{selectedSkill.type}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Category:</span>
              <span className="stat-value">{selectedSkill.category}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{selectedSkill.level}/{selectedSkill.maxLevel}</span>
            </div>
            
            {baseValues.damage > 0 && (
              <div className="stat-row">
                <span className="stat-label">Damage:</span>
                <span className="stat-value">
                  {hasSupports ? (
                    <>
                      <span className="base-value">{baseValues.damage}</span>
                      {finalValues.damage !== baseValues.damage && (
                        <span className="final-value"> → {finalValues.damage}</span>
                      )}
                    </>
                  ) : baseValues.damage}
                </span>
              </div>
            )}
            
            <div className="stat-row">
              <span className="stat-label">Mana Cost:</span>
              <span className="stat-value">
                {hasSupports ? (
                  <>
                    <span className="base-value">{baseValues.manaCost}</span>
                    {finalValues.manaCost !== baseValues.manaCost && (
                      <span className="final-value"> → {finalValues.manaCost}</span>
                    )}
                  </>
                ) : baseValues.manaCost}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Cooldown:</span>
              <span className="stat-value">
                {hasSupports ? (
                  <>
                    <span className="base-value">{baseValues.cooldown}ms</span>
                    {finalValues.cooldown !== baseValues.cooldown && (
                      <span className="final-value"> → {finalValues.cooldown}ms</span>
                    )}
                  </>
                ) : `${baseValues.cooldown}ms`}
              </span>
            </div>
            
            {baseValues.area > 1 && (
              <div className="stat-row">
                <span className="stat-label">Area:</span>
                <span className="stat-value">
                  {hasSupports ? (
                    <>
                      <span className="base-value">{baseValues.area.toFixed(1)}x</span>
                      {finalValues.area !== baseValues.area && (
                        <span className="final-value"> → {finalValues.area.toFixed(1)}x</span>
                      )}
                    </>
                  ) : `${baseValues.area.toFixed(1)}x`}
                </span>
              </div>
            )}
            
            {baseValues.duration > 0 && (
              <div className="stat-row">
                <span className="stat-label">Duration:</span>
                <span className="stat-value">
                  {hasSupports ? (
                    <>
                      <span className="base-value">{(baseValues.duration / 1000).toFixed(1)}s</span>
                      {finalValues.duration !== baseValues.duration && (
                        <span className="final-value"> → {(finalValues.duration / 1000).toFixed(1)}s</span>
                      )}
                    </>
                  ) : `${(baseValues.duration / 1000).toFixed(1)}s`}
                </span>
              </div>
            )}
            
            {finalValues.projectileCount > 1 && (
              <div className="stat-row">
                <span className="stat-label">Projectiles:</span>
                <span className="stat-value">{finalValues.projectileCount}</span>
              </div>
            )}
          </div>
        </div>

        {rarityBonus.damageBonus > 0 && (
          <div className="rarity-bonuses">
            <h4>Rarity Bonuses:</h4>
            <div className="bonus-list">
              {rarityBonus.damageBonus > 0 && (
                <div className="bonus-item">+{rarityBonus.damageBonus}% damage</div>
              )}
              {rarityBonus.qualityBonus > 0 && (
                <div className="bonus-item">+{rarityBonus.qualityBonus}% quality</div>
              )}
              {rarityBonus.areaOfEffectBonus && (
                <div className="bonus-item">+{rarityBonus.areaOfEffectBonus}% area of effect</div>
              )}
              {rarityBonus.manaCostReduction && (
                <div className="bonus-item">-{rarityBonus.manaCostReduction}% mana cost</div>
              )}
            </div>
          </div>
        )}

        {selectedSkill.supportGems.length > 0 && (
          <div className="attached-supports">
            <h4>Attached Support Gems ({selectedSkill.supportGems.length}/6):</h4>
            <div className="supports-list">
              {selectedSkill.supportGems.map(support => (
                <div key={support.id} className="attached-support">
                  <span className="support-info">
                    {support.icon} {support.name} (Lv.{support.level})
                  </span>
                  <button 
                    className="detach-btn"
                    onClick={() => actions.detachSupportGem(selectedSkill.id, support.id)}
                  >
                    Detach
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSupportDetails = () => {
    if (!selectedSupport) return null

    const scaledModifiers = getScaledSupportGemModifiers(selectedSupport)
    const compatibleSkills = skillData.unlockedSkills.filter(skill => isCompatibleSupport(skill, selectedSupport))
    const rarityBonus = GEM_RARITY_BONUSES[selectedSupport.rarity]

    return (
      <div className="support-details">
        <div className="support-details-header">
          <h3 style={{ color: getRarityColor(selectedSupport.rarity) }}>
            {selectedSupport.icon} {selectedSupport.name}
          </h3>
          <div className="support-details-meta">
            <span className="detail-rarity" style={{ color: getRarityColor(selectedSupport.rarity) }}>
              {selectedSupport.rarity}
            </span>
            {selectedSupport.quality > 0 && (
              <span className="detail-quality">Quality: {selectedSupport.quality}%</span>
            )}
          </div>
        </div>

        <p className="support-description">{selectedSupport.description}</p>
        
        <div className="support-tags-full">
          <h4>Tags:</h4>
          <div className="tags-container">
            {selectedSupport.tags.map(tag => (
              <span key={tag} className={`support-tag tag-${tag.toLowerCase()}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="support-stats">
          <h4>Statistics:</h4>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{selectedSupport.level}/{selectedSupport.maxLevel}</span>
            </div>
          </div>
        </div>

        <div className="support-modifiers">
          <h4>Modifiers:</h4>
          <div className="modifiers-list">
            {scaledModifiers.map((modifier, index) => (
              <div key={index} className="modifier-item">
                {modifier.description}
              </div>
            ))}
          </div>
        </div>

        <div className="compatibility-section">
          <h4>Compatibility ({compatibleSkills.length} skills):</h4>
          <div className="compatible-skills">
            {compatibleSkills.map(skill => (
              <div key={skill.id} className="compatible-skill">
                <span className="skill-info">
                  {skill.icon} {skill.name}
                </span>
                <div className="skill-tags-mini">
                  {skill.tags.filter(tag => selectedSupport.tags.some(supportTag => 
                    supportTag === tag || 
                    (supportTag === 'Support' && ['Attack', 'Spell', 'AoE', 'Projectile'].includes(tag))
                  )).map(tag => (
                    <span key={tag} className={`tag-mini tag-${tag.toLowerCase()}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedSupport.isUnlocked && (
          <div className="attach-to-skill">
            <h4>Attach to Skill:</h4>
            <div className="attachable-skills">
              {skillData.unlockedSkills.filter(skill => 
                skill.supportGems.length < 6 && 
                !skill.supportGems.some(s => s.id === selectedSupport.id) &&
                isCompatibleSupport(skill, selectedSupport)
              ).map(skill => (
                <button
                  key={skill.id}
                  className="attach-btn"
                  onClick={() => actions.attachSupportGem(skill.id, selectedSupport.id)}
                >
                  {skill.icon} {skill.name} ({skill.supportGems.length}/6)
                </button>
              ))}
            </div>
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

        {/* Search and Filter Controls */}
        <div className="search-filter-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search skills and support gems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {activeTab === 'skills' && (
          <div className="tag-filters">
            <span className="filter-label">Filter by tags:</span>
            <div className="tag-buttons">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-filter-btn ${selectedTags.has(tag) ? 'active' : ''}`}
                  onClick={() => {
                    const newTags = new Set(selectedTags);
                    if (newTags.has(tag)) {
                      newTags.delete(tag);
                    } else {
                      newTags.add(tag);
                    }
                    setSelectedTags(newTags);
                  }}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.size > 0 && (
                <button
                  className="clear-filters-btn"
                  onClick={() => setSelectedTags(new Set())}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
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