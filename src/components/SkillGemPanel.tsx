import React, { useState, useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { 
  SkillGem, 
  SupportGem, 
  getSkillUnlockCost, 
  getSkillLevelUpCost, 
  canLevelUpSkill, 
  getScaledSkillDamage, 
  getScaledManaCost, 
  getScaledCooldown, 
  getScaledArea, 
  getScaledDuration, 
  getScaledSupportGemValue, 
  getScaledSupportGemModifiers, 
  applyModifiersToSkill, 
  getSkillTagsDisplay, 
  isCompatibleSupport, 
  GEM_RARITY_BONUSES,
  SkillTag 
} from '../systems/skillGems'
import { getAvailableSkills, getUnlockedSkills, getAvailableSupportGems, getUnlockedSupportGems } from '../systems/skillManager'
import SkillGemTooltip from './SkillGemTooltip'

interface SkillGemPanelProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'skills' | 'supports' | 'skillbar'
type ViewMode = 'list' | 'detailed'

export const SkillGemPanel = React.memo(function SkillGemPanel({ isOpen, onClose }: SkillGemPanelProps) {
  const { state, actions } = useGame()
  const [activeTab, setActiveTab] = useState<TabType>('skills')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedSkill, setSelectedSkill] = useState<SkillGem | null>(null)
  const [selectedSupport, setSelectedSupport] = useState<SupportGem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState<SkillTag | 'All'>('All')
  const [showAttachMode, setShowAttachMode] = useState(false)
  const [tooltip, setTooltip] = useState<{
    skill: SkillGem
    position: { x: number; y: number }
  } | null>(null)

  // Memoized data - include skillBar in dependencies to update when skills are equipped/unequipped
  const skillData = useMemo(() => ({
    unlockedSkills: getUnlockedSkills(state.player),
    availableSkills: getAvailableSkills(state.player),
    unlockedSupports: getUnlockedSupportGems(state.player),
    availableSupports: getAvailableSupportGems(state.player)
  }), [state.player, state.player.skillBar]) // Add skillBar dependency

  const allTags = useMemo(() => {
    const tags = new Set<SkillTag>()
    ;[...skillData.unlockedSkills, ...skillData.availableSkills].forEach(skill => {
      skill.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [skillData])

  // Filter functions
  const filteredSkills = useMemo(() => {
    let skills = [...skillData.unlockedSkills, ...skillData.availableSkills]
    
    if (searchTerm) {
      skills = skills.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterTag !== 'All') {
      skills = skills.filter(skill => skill.tags.includes(filterTag))
    }
    
    return skills
  }, [skillData, searchTerm, filterTag])

  const filteredSupports = useMemo(() => {
    let supports = [...skillData.unlockedSupports, ...skillData.availableSupports]
    
    if (searchTerm) {
      supports = supports.filter(support => 
        support.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        support.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterTag !== 'All') {
      supports = supports.filter(support => support.tags.includes(filterTag))
    }
    
    return supports
  }, [skillData, searchTerm, filterTag])

  // Event handlers
  const handleUnlockSkill = useCallback((skillId: string) => {
    actions.unlockSkillGem(skillId)
    // Reset selected skill to refresh the view
    setSelectedSkill(null)
  }, [actions])

  const handleLevelUpSkill = useCallback((skillId: string) => {
    actions.levelUpSkillGem(skillId)
    // Find and update the selected skill to refresh the view
    const updatedSkill = state.player.skillGems.find(s => s.id === skillId)
    if (updatedSkill && selectedSkill?.id === skillId) {
      setSelectedSkill(updatedSkill)
    }
  }, [actions, state.player.skillGems, selectedSkill])

  const handleUnlockSupport = useCallback((supportId: string) => {
    actions.unlockSupportGem(supportId)
    setSelectedSupport(null)
  }, [actions])

  const handleLevelUpSupport = useCallback((supportId: string) => {
    actions.levelUpSupportGem(supportId)
    // Find and update the selected support to refresh the view
    const updatedSupport = state.player.supportGems.find(s => s.id === supportId)
    if (updatedSupport && selectedSupport?.id === supportId) {
      setSelectedSupport(updatedSupport)
    }
  }, [actions, state.player.supportGems, selectedSupport])

  const handleEquipSkill = useCallback((skillId: string, slotIndex: number) => {
    actions.equipSkillToBar(skillId, slotIndex)
    // Reset selected skill to refresh the view
    setSelectedSkill(null)
  }, [actions])

  const handleUnequipSkill = useCallback((slotIndex: number) => {
    actions.unequipSkillFromBar(slotIndex)
    // Reset selected skill to refresh the view
    setSelectedSkill(null)
  }, [actions])

  const handleAttachSupport = useCallback((skillId: string, supportId: string) => {
    actions.attachSupportGem(skillId, supportId)
    setShowAttachMode(false)
    setSelectedSupport(null)
  }, [actions])

  const handleDetachSupport = useCallback((skillId: string, supportId: string) => {
    actions.detachSupportGem(skillId, supportId)
  }, [actions])

  // Utility functions
  const getRarityColor = (rarity: string) => {
    const colors = {
      'Normal': '#ffffff',
      'Magic': '#8888ff',
      'Rare': '#ffff88',
      'Unique': '#ff8800'
    }
    return colors[rarity as keyof typeof colors] || '#ffffff'
  }

  const getTagColor = (tag: SkillTag) => {
    const tagColors: Record<SkillTag, string> = {
      'Spell': '#4f46e5',
      'Attack': '#dc2626',
      'Projectile': '#059669',
      'AoE': '#d97706',
      'Physical': '#6b7280',
      'Fire': '#ef4444',
      'Cold': '#3b82f6',
      'Lightning': '#eab308',
      'Chaos': '#8b5cf6',
      'Melee': '#991b1b',
      'Duration': '#7c3aed',
      'Channeling': '#be185d',
      'Movement': '#0891b2',
      'Travel': '#0d9488',
      'Minion': '#7c2d12',
      'Totem': '#a16207',
      'Trap': '#374151',
      'Mine': '#1f2937',
      'Critical': '#fbbf24',
      'Bow': '#92400e',
      'Weapon': '#6b7280',
      'Unarmed': '#78716c',
      'Brand': '#c2410c',
      'Slam': '#7f1d1d',
      'Strike': '#b91c1c',
      'Guard': '#1e40af',
      'Vaal': '#581c87',
      'Trigger': '#be123c',
      'Aura': '#06b6d4',
      'Curse': '#f59e0b',
      'Warcry': '#dc2626',
      'Support': '#10b981',
      'Elemental': '#f59e0b'
    }
    return tagColors[tag] || '#6b7280'
  }

  const formatNumber = (value: number): string => {
    return value.toFixed(2)
  }

  const getAvailableSlots = () => {
    return state.player.skillBar.slots.map((slot, index) => ({
      index,
      skill: slot,
      isEmpty: !slot
    }))
  }

  // Render detailed skill view
  const renderDetailedSkillView = (skill: SkillGem) => {
    const scaledSkill = applyModifiersToSkill(skill)
    const availableSlots = getAvailableSlots()
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{skill.icon}</span>
            <div>
              <h3 className="text-xl font-bold" style={{ color: getRarityColor(skill.rarity) }}>
                {skill.name}
              </h3>
              <div className="text-sm text-gray-400">
                Level {skill.level}/{skill.maxLevel} • {skill.rarity} • Quality: {skill.quality}%
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedSkill(null)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="text-gray-300 text-sm leading-relaxed">
          {skill.description}
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1">
          {skill.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getTagColor(tag) }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Skill Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Damage:</span>
              <span className="text-red-400">{formatNumber(scaledSkill.damage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mana Cost:</span>
              <span className="text-blue-400">{formatNumber(scaledSkill.manaCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cooldown:</span>
              <span className="text-yellow-400">{formatNumber(scaledSkill.cooldown / 1000)}s</span>
            </div>
          </div>
          <div className="space-y-2">
            {skill.scaling?.baseArea && (
              <div className="flex justify-between">
                <span className="text-gray-400">Area:</span>
                <span className="text-green-400">{formatNumber(scaledSkill.area)}</span>
              </div>
            )}
            {skill.scaling?.baseDuration && (
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-purple-400">{formatNumber(scaledSkill.duration / 1000)}s</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Unlock Cost:</span>
              <span className="text-yellow-300">{skill.skillPointCost} SP</span>
            </div>
          </div>
        </div>

        {/* Support Gem Modifiers */}
        {skill.supportGems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium">Active Support Modifiers:</h4>
            <div className="space-y-1 bg-gray-700 p-3 rounded">
              {skill.supportGems.map(support => {
                const modifiers = getScaledSupportGemModifiers(support)
                return (
                  <div key={support.id} className="space-y-1">
                    <div className="text-sm font-medium text-blue-300">{support.name} (Lv.{support.level})</div>
                    {modifiers.map((modifier, index) => (
                      <div key={index} className="text-xs text-green-300 ml-2">
                        • {modifier.description || `${modifier.type}: ${modifier.isPercentage ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''}`}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Support Gems */}
        {skill.isUnlocked && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Support Gems ({skill.supportGems.length}/6)</h4>
              <button
                onClick={() => {
                  setSelectedSupport(null)
                  setShowAttachMode(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                disabled={skill.supportGems.length >= 6}
              >
                Attach Support
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {skill.supportGems.map(support => (
                <div key={support.id} className="bg-gray-700 p-2 rounded flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{support.icon}</span>
                    <div>
                      <div className="text-xs font-medium">{support.name}</div>
                      <div className="text-xs text-gray-400">Lv.{support.level}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDetachSupport(skill.id, support.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!skill.isUnlocked ? (
            <button
              onClick={() => handleUnlockSkill(skill.id)}
              disabled={state.player.skillPoints < getSkillUnlockCost(skill) || state.player.level < skill.unlockLevel}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
            >
              Unlock ({getSkillUnlockCost(skill)} SP)
            </button>
          ) : (
            <>
              {skill.level < skill.maxLevel && (
                <button
                  onClick={() => handleLevelUpSkill(skill.id)}
                  disabled={!canLevelUpSkill(skill, state.player.skillPoints)}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                >
                  Level Up ({getSkillLevelUpCost(skill.level)} SP)
                </button>
              )}
              
              {availableSlots.filter(slot => slot.isEmpty).length > 0 && (
                <div className="flex space-x-1">
                  <span className="text-gray-400 text-sm py-2">Equip to:</span>
                  {availableSlots.filter(slot => slot.isEmpty).map(slot => (
                    <button
                      key={slot.index}
                      onClick={() => handleEquipSkill(skill.id, slot.index)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Slot {slot.index + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Render detailed support view
  const renderDetailedSupportView = (support: SupportGem) => {
    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{support.icon}</span>
            <div>
              <h3 className="text-xl font-bold" style={{ color: getRarityColor(support.rarity) }}>
                {support.name}
              </h3>
              <div className="text-sm text-gray-400">
                Level {support.level}/{support.maxLevel} • {support.rarity} • Quality: {support.quality}%
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedSupport(null)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="text-gray-300 text-sm leading-relaxed">
          {support.description}
        </div>

        {/* Support Tags */}
        <div className="flex flex-wrap gap-1">
          {support.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getTagColor(tag) }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Support Modifiers */}
        <div className="space-y-2">
          <h4 className="text-white font-medium">Modifiers:</h4>
          <div className="space-y-1">
            {support.modifiers.map((modifier, index) => (
              <div key={index} className="text-sm text-gray-300">
                • {modifier.description || `${modifier.type}: ${modifier.isPercentage ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''}`}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!support.isUnlocked ? (
            <button
              onClick={() => handleUnlockSupport(support.id)}
              disabled={state.player.skillPoints < getSkillUnlockCost(support) || state.player.level < support.unlockLevel}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
            >
              Unlock ({getSkillUnlockCost(support)} SP)
            </button>
          ) : (
            <>
              {support.level < support.maxLevel && (
                <button
                  onClick={() => handleLevelUpSupport(support.id)}
                  disabled={!canLevelUpSkill(support, state.player.skillPoints)}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                >
                  Level Up ({getSkillLevelUpCost(support.level)} SP)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Render attach support mode
  const renderAttachSupportMode = () => {
    if (!selectedSkill || !showAttachMode) return null

    const compatibleSupports = skillData.unlockedSupports.filter(support => 
      isCompatibleSupport(selectedSkill, support) && 
      !selectedSkill.supportGems.some(s => s.id === support.id)
    )

    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Attach Support to {selectedSkill.name}</h3>
          <button
            onClick={() => setShowAttachMode(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {compatibleSupports.length > 0 ? (
            compatibleSupports.map(support => (
              <div key={support.id} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{support.icon}</span>
                  <div>
                    <div className="text-white font-medium">{support.name}</div>
                    <div className="text-sm text-gray-400">Lv.{support.level}</div>
                    <div className="flex space-x-1 mt-1">
                      {support.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-1 py-0.5 rounded text-xs"
                          style={{ backgroundColor: getTagColor(tag), color: 'white' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAttachSupport(selectedSkill.id, support.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Attach
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">
              No compatible support gems available
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">💎 Skill Gem Management</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Player Info */}
      <div className="px-4 py-2 border-b border-gray-700 text-sm text-gray-300">
        <div className="flex justify-between">
          <span>Skill Points: {state.player.skillPoints}</span>
          <span>Level: {state.player.level}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'skills' 
              ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('skills')}
        >
          Skills ({skillData.unlockedSkills.length})
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'supports' 
              ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('supports')}
        >
          Support Gems ({skillData.unlockedSupports.length})
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'skillbar' 
              ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('skillbar')}
        >
          Skill Bar
        </button>
      </div>

      {/* Search and Filter */}
      {(activeTab === 'skills' || activeTab === 'supports') && (
        <div className="p-4 border-b border-gray-700 space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as SkillTag | 'All')}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="All">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'detailed' : 'list')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              {viewMode === 'list' ? '📋' : '📖'}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showAttachMode ? (
          <div className="p-4 h-full overflow-y-auto">
            {renderAttachSupportMode()}
          </div>
        ) : selectedSkill ? (
          <div className="p-4 h-full overflow-y-auto">
            {renderDetailedSkillView(selectedSkill)}
          </div>
        ) : selectedSupport ? (
          <div className="p-4 h-full overflow-y-auto">
            {renderDetailedSupportView(selectedSupport)}
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            {activeTab === 'skills' && (
              <div className="space-y-4">
                {/* Unlocked Skills */}
                {skillData.unlockedSkills.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Unlocked Skills</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredSkills.filter(s => s.isUnlocked).map(skill => (
                        <div 
                          key={skill.id} 
                          className="bg-gray-800 p-3 rounded flex items-center justify-between hover:bg-gray-750 cursor-pointer" 
                          onClick={() => setSelectedSkill(skill)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({
                              skill,
                              position: { x: rect.right + 10, y: rect.top }
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{skill.icon}</span>
                            <div>
                              <div className="text-white font-medium">{skill.name}</div>
                              <div className="text-sm text-gray-400">
                                Lv.{skill.level} • Dmg: {formatNumber(getScaledSkillDamage(skill))}
                                {skill.isEquipped && <span className="text-yellow-400 ml-2">⚡ Equipped</span>}
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {skill.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-1 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: getTagColor(tag), color: 'white' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Skills */}
                {skillData.availableSkills.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Available Skills</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredSkills.filter(s => !s.isUnlocked).map(skill => (
                        <div 
                          key={skill.id} 
                          className="bg-gray-800 p-3 rounded flex items-center justify-between opacity-75 hover:opacity-100 cursor-pointer" 
                          onClick={() => setSelectedSkill(skill)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({
                              skill,
                              position: { x: rect.right + 10, y: rect.top }
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{skill.icon}</span>
                            <div>
                              <div className="text-gray-300 font-medium">{skill.name}</div>
                              <div className="text-sm text-gray-400">
                                Cost: {getSkillUnlockCost(skill)} SP • Req: Lv.{skill.unlockLevel}
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {skill.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-1 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: getTagColor(tag), color: 'white' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'supports' && (
              <div className="space-y-4">
                {/* Unlocked Support Gems */}
                {skillData.unlockedSupports.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Unlocked Support Gems</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredSupports.filter(s => s.isUnlocked).map(support => (
                        <div key={support.id} className="bg-gray-800 p-3 rounded flex items-center justify-between hover:bg-gray-750 cursor-pointer" onClick={() => setSelectedSupport(support)}>
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{support.icon}</span>
                            <div>
                              <div className="text-white font-medium">{support.name}</div>
                              <div className="text-sm text-gray-400">Lv.{support.level}</div>
                              <div className="flex space-x-1 mt-1">
                                {support.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-1 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: getTagColor(tag), color: 'white' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Support Gems */}
                {skillData.availableSupports.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Available Support Gems</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {filteredSupports.filter(s => !s.isUnlocked).map(support => (
                        <div key={support.id} className="bg-gray-800 p-3 rounded flex items-center justify-between opacity-75 hover:opacity-100 cursor-pointer" onClick={() => setSelectedSupport(support)}>
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{support.icon}</span>
                            <div>
                              <div className="text-gray-300 font-medium">{support.name}</div>
                              <div className="text-sm text-gray-400">
                                Cost: {getSkillUnlockCost(support)} SP • Req: Lv.{support.unlockLevel}
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {support.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-1 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: getTagColor(tag), color: 'white' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skillbar' && (
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Skill Bar Management</h4>
                <div className="grid grid-cols-2 gap-4">
                  {getAvailableSlots().map(slot => (
                    <div key={slot.index} className="bg-gray-800 p-4 rounded">
                      <div className="text-white font-medium mb-2">Slot {slot.index + 1}</div>
                      {slot.skill ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{slot.skill.icon}</span>
                            <div>
                              <div className="text-white font-medium">{slot.skill.name}</div>
                              <div className="text-sm text-gray-400">Lv.{slot.skill.level}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnequipSkill(slot.index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm w-full"
                          >
                            Unequip
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center py-4">
                          Empty Slot
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <SkillGemTooltip
          skill={tooltip.skill}
          position={tooltip.position}
          onClose={() => setTooltip(null)}
        />
      )}
      </div>
    </div>
  )
})

export default SkillGemPanel