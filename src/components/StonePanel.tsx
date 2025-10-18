import React, { useState, useMemo, useCallback, memo } from 'react'
import { useGame } from '../systems/gameContext'
import { generateStone } from '../systems/stoneGenerator'
import { getStoneColor, getStoneIcon, STONE_BASES, StoneType, StoneRarity } from '../systems/stones'
import { embedStone, removeStone, hasAvailableSocket } from '../systems/equipment'
import { DragDropProvider, DraggableStone, Draggable } from './DragDropSystem'
import { EnhancedTooltip } from './EnhancedTooltip'
import { SmartFilterSystem } from './SmartFilterSystem'
import { DESIGN_TOKENS, getColor } from '../utils/designTokens'

// Stone Tooltip component for detailed information
const StoneTooltip = memo(({ stone, position, onClose, isPersistent }: {
  stone: any
  position: { x: number; y: number }
  onClose: () => void
  isPersistent?: boolean
}) => {
  const formatStatValue = (stat: string, value: number): string => {
    const percentageStats = ['critChance', 'dodgeChance', 'attackSpeed', 'goldFind', 'magicFind', 'experienceBonus', 'lifeSteal', 'healthRegen', 'manaRegen']
    if (percentageStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`
    }
    return value.toFixed(1)
  }

  const getStatDisplayName = (stat: string): string => {
    const statNames: Record<string, string> = {
      damage: 'Damage', armor: 'Armor', health: 'Health', mana: 'Mana',
      strength: 'Strength', dexterity: 'Dexterity', intelligence: 'Intelligence', vitality: 'Vitality',
      critChance: 'Critical Chance', dodgeChance: 'Dodge Chance', attackSpeed: 'Attack Speed',
      goldFind: 'Gold Find', magicFind: 'Magic Find', experienceBonus: 'Experience Bonus',
      lifeSteal: 'Life Steal', healthRegen: 'Health Regen', manaRegen: 'Mana Regen', luck: 'Luck'
    }
    return statNames[stat] || stat
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Common': '#9CA3AF',
      'Rare': '#3B82F6',
      'Mythical': '#8B5CF6',
      'Divine': '#F59E0B'
    }
    return colors[rarity as keyof typeof colors] || '#FFFFFF'
  }

  return (
    <div 
      className="fixed z-50 bg-gray-900 border-2 border-gray-600 rounded-lg p-4 shadow-2xl max-w-sm"
      style={{
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.min(position.y, window.innerHeight - 300)
      }}
      onMouseLeave={isPersistent ? undefined : onClose}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Stone header */}
      <div className="mb-3">
        <div className="font-bold text-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{color: getRarityColor(stone.rarity)}}>
            <span className="text-2xl">{getStoneIcon(stone.type)}</span>
            <span>{stone.name}</span>
          </div>
          {isPersistent && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl leading-none p-1 hover:bg-gray-700 rounded"
              title="Close tooltip"
            >
              ×
            </button>
          )}
        </div>
        <div className="text-gray-400 text-sm">
          <span className="capitalize">{stone.type}</span> • <span>{stone.rarity}</span> • Level {stone.level}
        </div>
      </div>
      
      {/* Base Stats section */}
      {Object.keys(stone.baseStats).length > 0 && (
        <div className="mb-3">
          <h4 className="text-blue-400 font-semibold text-sm mb-2">Base Stats:</h4>
          <div className="space-y-1">
            {Object.entries(stone.baseStats).map(([stat, value]) => (
              typeof value === 'number' && value > 0 && (
                <div key={stat} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{getStatDisplayName(stat)}:</span>
                  <span className="text-green-400 font-medium">+{formatStatValue(stat, value)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Affixes section */}
      {stone.affixes && stone.affixes.length > 0 && (
        <div className="mb-3">
          <h4 className="text-purple-400 font-semibold text-sm mb-2">Affixes:</h4>
          <div className="space-y-2">
            {stone.affixes.map((affix: any, index: number) => (
              <div key={index} className="border-l-2 border-purple-500 pl-2">
                <div className="text-purple-300 text-sm font-medium">{affix.name}</div>
                <div className="text-green-400 text-sm">
                  +{formatStatValue(affix.stat, affix.value)} {getStatDisplayName(affix.stat)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Socket compatibility */}
      <div className="mb-3">
        <h4 className="text-amber-400 font-semibold text-sm mb-2">Compatible Sockets:</h4>
        <div className="flex flex-wrap gap-1">
          {stone.socketTypes.map((socketType: string) => (
            <span key={socketType} className="bg-amber-900/30 text-amber-300 px-2 py-1 rounded text-xs">
              {socketType}
            </span>
          ))}
        </div>
      </div>

      {/* Value */}
      <div className="text-yellow-400 text-sm font-medium">
        💰 Value: {stone.value} gold
      </div>
    </div>
  )
})

// Stone Item component
const StoneItem = memo(({ 
  stone, 
  viewMode,
  onEmbed,
  onRemove,
  onHover,
  onLeave,
  onClick,
  isSelected
}: { 
  stone: any
  viewMode: string
  onEmbed: (stoneId: string) => void
  onRemove: (stoneId: string) => void
  onHover?: (event: React.MouseEvent, stone: any) => void
  onLeave?: () => void
  onClick?: (event: React.MouseEvent, stone: any) => void
  isSelected: boolean
}) => {
  const formatStatValue = (stat: string, value: number): string => {
    const percentageStats = ['critChance', 'dodgeChance', 'attackSpeed', 'goldFind', 'magicFind', 'experienceBonus', 'lifeSteal', 'healthRegen', 'manaRegen']
    if (percentageStats.includes(stat)) {
      return `${(value * 100).toFixed(1)}%`
    }
    return value.toFixed(1)
  }

  const getStatDisplayName = (stat: string): string => {
    const statNames: Record<string, string> = {
      damage: 'Damage', armor: 'Armor', health: 'Health', mana: 'Mana',
      strength: 'Strength', dexterity: 'Dexterity', intelligence: 'Intelligence', vitality: 'Vitality',
      critChance: 'Critical Chance', dodgeChance: 'Dodge Chance', attackSpeed: 'Attack Speed',
      goldFind: 'Gold Find', magicFind: 'Magic Find', experienceBonus: 'Experience Bonus',
      lifeSteal: 'Life Steal', healthRegen: 'Health Regen', manaRegen: 'Mana Regen', luck: 'Luck'
    }
    return statNames[stat] || stat
  }

  if (viewMode === 'grid') {
    return (
      <div
        className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 ${
          isSelected ? 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-blue-800/40 shadow-lg shadow-blue-500/30' : 'border-gray-600 hover:border-gray-500'
        }`}
        onMouseEnter={onHover ? (e) => onHover(e, stone) : undefined}
        onMouseLeave={onLeave}
        onClick={onClick ? (e) => onClick(e, stone) : undefined}
      >
        {/* Rarity indicator */}
        <div 
          className="absolute top-2 right-2 w-3 h-3 rounded-full shadow-lg"
          style={{ backgroundColor: getStoneColor(stone.rarity) }}
        />
        
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: getStoneColor(stone.rarity) }}
          >
            {getStoneIcon(stone.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate mb-1" style={{ color: getStoneColor(stone.rarity) }}>
              {stone.name}
            </div>
            <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg inline-block">
              Lv.{stone.level} • {stone.rarity}
            </div>
          </div>
        </div>
        
        {/* Base stats preview */}
        <div className="text-xs space-y-1.5 mb-3 bg-gray-700/30 rounded-lg p-2">
          {Object.entries(stone.baseStats).slice(0, 2).map(([stat, value]) => (
            typeof value === 'number' && value > 0 && (
              <div key={stat} className="flex justify-between items-center text-green-400">
                <span className="text-gray-300">{getStatDisplayName(stat)}</span>
                <span className="font-medium">+{formatStatValue(stat, value)}</span>
              </div>
            )
          ))}
          {Object.entries(stone.baseStats).length > 2 && (
            <div className="text-gray-500 text-center pt-1 border-t border-gray-600">
              +{Object.entries(stone.baseStats).length - 2} more stats
            </div>
          )}
        </div>

        {/* Value display */}
        <div className="text-yellow-400 text-xs font-medium mb-3 text-center bg-yellow-900/20 py-1 rounded-lg">
          💰 {stone.value.toLocaleString()}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEmbed(stone.id)
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs py-2 px-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/30"
          >
            ⚡ Embed
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(stone.id)
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs py-2 px-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/30"
          >
            🗑️
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div
      className={`relative bg-gradient-to-r from-gray-800 to-gray-900 border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 ${
        isSelected ? 'border-blue-400 bg-gradient-to-r from-blue-900/40 to-blue-800/40 shadow-lg shadow-blue-500/20' : 'border-gray-600 hover:border-gray-500'
      }`}
      onMouseEnter={onHover ? (e) => onHover(e, stone) : undefined}
      onMouseLeave={onLeave}
      onClick={onClick ? (e) => onClick(e, stone) : undefined}
    >
      {/* Rarity indicator */}
      <div 
        className="absolute top-3 right-3 w-3 h-3 rounded-full shadow-lg"
        style={{ backgroundColor: getStoneColor(stone.rarity) }}
      />
      
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ backgroundColor: getStoneColor(stone.rarity) }}
        >
          {getStoneIcon(stone.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="font-bold text-lg" style={{ color: getStoneColor(stone.rarity) }}>
              {stone.name}
            </div>
            <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
              Level {stone.level} • {stone.rarity}
            </div>
          </div>
          
          {/* Stats display */}
          <div className="text-sm space-y-1 mb-2">
            {/* Base stats */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(stone.baseStats).map(([stat, value]) => (
                typeof value === 'number' && value > 0 && (
                  <span key={stat} className="text-green-400 bg-green-900/20 px-2 py-1 rounded-lg text-xs">
                    +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                  </span>
                )
              ))}
            </div>
            
            {/* Affixes */}
            {stone.affixes && stone.affixes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {stone.affixes.map((affix: any, index: number) => (
                  <span key={index} className="text-purple-300 bg-purple-900/20 px-2 py-1 rounded-lg text-xs">
                    {affix.name}: +{formatStatValue(affix.stat, affix.value)} {getStatDisplayName(affix.stat)}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Socket compatibility */}
          <div className="flex flex-wrap gap-1 mt-2">
            {stone.socketTypes.map((socketType: string) => (
              <span key={socketType} className="bg-amber-900/30 text-amber-300 px-2 py-1 rounded-lg text-xs border border-amber-700/50">
                🔌 {socketType}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 items-end">
          <div className="text-yellow-400 text-sm font-medium bg-yellow-900/20 px-3 py-1 rounded-lg">
            💰 {stone.value.toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEmbed(stone.id)
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs py-2 px-4 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/30"
            >
              ⚡ Embed
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(stone.id)
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs py-2 px-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/30"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const StonePanel = memo(function StonePanel() {
  const { state, actions, dispatch } = useGame()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'ruby' | 'sapphire' | 'emerald' | 'diamond' | 'topaz' | 'amethyst' | 'onyx' | 'opal' | 'garnet' | 'citrine' | 'peridot' | 'turquoise'>('all')
  const [selectedStone, setSelectedStone] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    stone: any
    position: { x: number; y: number }
    isPersistent?: boolean
  } | null>(null)
  
  const itemsPerPage = 10
  const maxPages = 10

  // Memoize sorted and filtered stones
  const sortedStones = useMemo(() => {
    let filteredStones = [...(state.player.stones || [])]
    
    // Deduplicate stones by ID to prevent React key warnings
    const seenIds = new Set()
    filteredStones = filteredStones.filter(stone => {
      if (seenIds.has(stone.id)) {
        return false
      }
      seenIds.add(stone.id)
      return true
    })
    
    // Filter by active tab
    if (activeTab !== 'all') {
      filteredStones = filteredStones.filter(stone => stone.type === activeTab)
    }
    
    return filteredStones.sort((a, b) => {
      // Sort by rarity first
      const rarityOrder = ['Divine', 'Mythical', 'Rare', 'Common']
      const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
      if (rarityDiff !== 0) return rarityDiff
      
      // Then by level
      return b.level - a.level
    })
  }, [state.player.stones, activeTab])

  // Memoize stone counts for tabs
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: state.player.stones?.length || 0,
      ruby: 0, sapphire: 0, emerald: 0, diamond: 0, topaz: 0, amethyst: 0,
      onyx: 0, opal: 0, garnet: 0, citrine: 0, peridot: 0, turquoise: 0
    }
    
    state.player.stones?.forEach(stone => {
      if (counts.hasOwnProperty(stone.type)) {
        counts[stone.type]++
      }
    })
    

    
    return counts
  }, [state.player.stones, activeTab])

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.min(maxPages, Math.ceil(sortedStones.length / itemsPerPage))
    const maxItems = maxPages * itemsPerPage
    const displayStones = sortedStones.slice(0, maxItems)
    const startIndex = currentPage * itemsPerPage
    const currentItems = displayStones.slice(startIndex, startIndex + itemsPerPage)
    

    const excessItems = sortedStones.length - maxItems
    
    return {
      totalPages,
      displayStones,
      currentItems,
      excessItems
    }
  }, [sortedStones, currentPage, itemsPerPage, maxPages])

  // Memoize total value calculation
  const totalValue = useMemo(() => {
    return (state.player.stones || []).reduce((sum, stone) => sum + (stone.value || 0), 0)
  }, [state.player.stones])

  // Generate a test stone for demonstration
  const handleGenerateStone = useCallback(() => {
    const newStone = generateStone(state.player.level, false)
    actions.addStone(newStone)
  }, [state.player.level, actions])

  // Sell all stones for gold
  const handleSellAllStones = useCallback(() => {
    actions.sellAllStones()
  }, [actions])

  const handleEmbedStone = useCallback((equipmentSlot: string, stoneId: string, socketIndex: number) => {
    const equipment = state.player.equipment[equipmentSlot as keyof typeof state.player.equipment]
    if (!equipment || !hasAvailableSocket(equipment)) {
      return
    }

    try {
      const updatedEquipment = embedStone(equipment, stoneId, socketIndex)
      dispatch({ type: 'UPDATE_EQUIPMENT', payload: { slot: equipmentSlot, equipment: updatedEquipment } })
      setSelectedStone(null)
    } catch (error) {
      console.error('Failed to embed stone:', error)
    }
  }, [state.player.equipment, dispatch])

  const handleRemoveStone = useCallback((equipmentSlot: string, socketIndex: number) => {
    const equipment = state.player.equipment[equipmentSlot as keyof typeof state.player.equipment]
    if (!equipment || !equipment.sockets) {
      return
    }

    try {
      const { equipment: updatedEquipment, removedStoneId } = removeStone(equipment, socketIndex)
      dispatch({ type: 'UPDATE_EQUIPMENT', payload: { slot: equipmentSlot, equipment: updatedEquipment } })
      if (removedStoneId) {
    
      }
    } catch (error) {
      console.error('Failed to remove stone:', error)
    }
  }, [dispatch])

  const handleViewModeChange = useCallback((mode: string) => {
    setViewMode(mode as 'list' | 'grid')
    setCurrentPage(0)
  }, [])

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    if (tab !== activeTab) {
      setActiveTab(tab)
      setCurrentPage(0)
    }
  }, [activeTab])

  const handleStoneEmbed = useCallback((stoneId: string) => {
    setSelectedStone(stoneId)
  }, [])

  const handleStoneRemove = useCallback((stoneId: string) => {
    actions.removeStone(stoneId)
  }, [actions])

  // Tooltip handlers
  const handleStoneHover = useCallback((event: React.MouseEvent, stone: any) => {
    if (!tooltip?.isPersistent) {
      const rect = event.currentTarget.getBoundingClientRect()
      const tooltipWidth = 400
      
      setTooltip({
        stone,
        position: {
          x: rect.right + 10 > window.innerWidth - tooltipWidth ? rect.left - tooltipWidth - 10 : rect.right + 10,
          y: Math.max(10, rect.top)
        }
      })
    }
  }, [tooltip])

  const handleStoneLeave = useCallback(() => {
    if (!tooltip?.isPersistent) {
      setTooltip(null)
    }
  }, [tooltip])

  const handleStoneClick = useCallback((event: React.MouseEvent, stone: any) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const tooltipWidth = 400
    
    setTooltip({
      stone,
      position: {
        x: rect.right + 10 > window.innerWidth - tooltipWidth ? rect.left - tooltipWidth - 10 : rect.right + 10,
        y: Math.max(10, rect.top)
      },
      isPersistent: true
    })
  }, [])

  const handleTooltipClose = useCallback(() => {
    setTooltip(null)
  }, [])

  const renderEquipmentSockets = () => {
    return Object.entries(state.player.equipment).map(([slot, equipment]) => {
      if (!equipment || !equipment.sockets || equipment.sockets.maxSockets === 0) {
        return null
      }

      return (
        <div key={slot} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 mb-4 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">⚔️</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg capitalize">{slot}</h3>
              <p className="text-gray-300 text-sm">{equipment.name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: equipment.sockets?.maxSockets || 0 }, (_, index) => {
              const stoneId = equipment.sockets?.stones[index]
              const isEmpty = stoneId === null

              return (
                <div
                  key={index}
                  className={`relative w-14 h-14 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 group ${
                    isEmpty 
                      ? 'border-gray-500 bg-gray-700/50 hover:border-gray-400 hover:bg-gray-600/50 hover:scale-105' 
                      : 'border-amber-400 bg-gradient-to-br from-amber-900/50 to-orange-900/50 hover:border-amber-300 hover:scale-105 shadow-lg shadow-amber-500/20'
                  }`}
                  onClick={() => {
                    if (isEmpty && selectedStone) {
                      handleEmbedStone(slot, selectedStone, index)
                    } else if (!isEmpty) {
                      handleRemoveStone(slot, index)
                    }
                  }}
                >
                  {/* Socket indicator */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-300">{index + 1}</span>
                  </div>
                  
                  {isEmpty ? (
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-2xl group-hover:text-gray-300 transition-colors">+</span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Empty</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-amber-300 text-2xl group-hover:text-amber-200 transition-colors">💎</span>
                      <span className="text-xs text-amber-400 group-hover:text-amber-300 transition-colors">Filled</span>
                    </div>
                  )}
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
                </div>
              )
            })}
          </div>
          
          {/* Socket info */}
          <div className="mt-3 pt-3 border-t border-gray-600/50">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Sockets: {equipment.sockets?.stones.filter(s => s !== null).length || 0}/{equipment.sockets?.maxSockets || 0}</span>
              <span className="text-amber-400">Click to embed/remove</span>
            </div>
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  return (
    <DragDropProvider
      onDrop={(draggedItem, targetType, targetId) => {
        if (draggedItem.type === 'stone' && targetType === 'socket') {
          const [equipmentSlot, socketIndex] = targetId.split('-')
          handleEmbedStone(equipmentSlot, draggedItem.id, parseInt(socketIndex))
        }
      }}
      validateDrop={(draggedItem, targetType, targetId) => {
        if (draggedItem.type === 'stone' && targetType === 'socket') {
          const [equipmentSlot, socketIndex] = targetId.split('-')
          const equipment = state.player.equipment[equipmentSlot as keyof typeof state.player.equipment]
          return equipment ? hasAvailableSocket(equipment) : false
        }
        return false
      }}
    >
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        <div className="relative flex justify-between items-center p-6 bg-gray-800/80 backdrop-blur-sm border-b border-gray-600/50 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Stone Management
                </h2>
                <p className="text-sm text-gray-400">Enhance your equipment with magical stones</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600/50">
              <div className="text-yellow-400 text-lg font-bold flex items-center gap-2">
                <span className="text-xl">💰</span>
                {(state.player.gold && typeof state.player.gold === 'number' && !isNaN(state.player.gold)) ? state.player.gold.toFixed(2) : '0.00'}
              </div>
            </div>
            <SmartFilterSystem
              items={sortedStones}
              onFilterChange={(filtered) => {
                // Update filtered stones state if needed
              }}
              filterGroups={[
               {
                 id: 'type',
                 label: 'Stone Type',
                 type: 'single',
                 options: Object.keys(STONE_BASES).map(type => ({ 
                   id: type, 
                   label: type, 
                   value: type 
                 }))
               },
               {
                 id: 'rarity',
                 label: 'Rarity',
                 type: 'single',
                 options: [
                   { id: 'common', label: 'Common', value: 'common' },
                   { id: 'uncommon', label: 'Uncommon', value: 'uncommon' },
                   { id: 'rare', label: 'Rare', value: 'rare' },
                   { id: 'epic', label: 'Epic', value: 'epic' },
                   { id: 'legendary', label: 'Legendary', value: 'legendary' }
                 ]
               }
             ]}
          />
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            ⊞ Grid View
          </button>
          <button
            onClick={handleGenerateStone}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white font-medium"
          >
            ✨ Generate Stone
          </button>
          <button
            onClick={handleSellAllStones}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white font-medium"
            disabled={state.player.stones.length === 0}
          >
            💰 Sell All Stones
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-3 bg-gray-800/50 border-b border-gray-600">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            💎 All Stones <span className="text-xs opacity-75">({tabCounts.all})</span>
          </button>
          {Object.entries(STONE_BASES).map(([stoneType, stoneData]) => (
            <button
              key={stoneType}
              onClick={() => handleTabChange(stoneType as StoneType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === stoneType 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {getStoneIcon(stoneType as StoneType)} {stoneData.name} <span className="text-xs opacity-75">({tabCounts[stoneType as StoneType] || 0})</span>
            </button>
          ))}
        </div>
      </div>



      {/* Stats Bar */}
      <div className="px-6 py-4 bg-gray-700/30 backdrop-blur-sm border-b border-gray-600/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-600/50">
              <span className="text-blue-400 text-lg">📊</span>
              <div className="text-gray-300 text-sm">
                <span className="font-medium text-white">
                  {activeTab === 'all' ? 'Total Stones' : `${STONE_BASES[activeTab as StoneType]?.name || activeTab}`}:
                </span>
                <span className="ml-2 text-blue-400 font-bold">{sortedStones.length}</span>
                {activeTab !== 'all' && (
                  <span className="text-gray-400 ml-1">/ {state.player.stones?.length || 0} total</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-600/50">
              <span className="text-yellow-400 text-lg">💎</span>
              <div className="text-gray-300 text-sm">
                <span className="font-medium text-white">Total Value:</span>
                <span className="ml-2 text-yellow-400 font-bold">{totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {selectedStone && (
            <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/50 rounded-lg px-4 py-2">
              <span className="text-blue-400 text-lg">⚡</span>
              <span className="text-blue-300 text-sm font-medium">
                Stone selected - click equipment socket to embed
              </span>
            </div>
          )}
        </div>
      </div>

      {paginationData.excessItems > 0 && (
        <div className="mx-4 mt-4 p-3 bg-orange-900/30 border border-orange-600/40 rounded-lg text-orange-300 text-sm">
          ⚠️ {paginationData.excessItems} excess stones converted to gold automatically
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Stone Inventory */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="text-lg font-semibold text-gray-200">Stones ({sortedStones.length})</div>
            {paginationData.totalPages > 1 && (
              <div className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-lg">
                Page {currentPage + 1} of {paginationData.totalPages}
              </div>
            )}
          </div>
          
          <div className={`flex-1 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : 'space-y-3 p-2'}`}>
            {paginationData.currentItems.length === 0 && (
              <div className="text-gray-400 text-sm col-span-2 text-center py-8">
                {activeTab === 'all' ? 'No stones yet.' : `No ${STONE_BASES[activeTab as StoneType]?.name || activeTab} stones yet.`}
                <br />
                <span className="text-xs">Click "Generate Stone" to create stones</span>
              </div>
            )}
            {paginationData.currentItems.map((stone) => (
                 <Draggable
                   key={stone.id}
                   item={stone}
                   type="stone"
                   className={`transition-all ${selectedStone === stone.id ? 'ring-2 ring-blue-500' : ''}`}
                 >
                   <StoneItem
                     stone={stone}
                     viewMode={viewMode}
                     onEmbed={handleStoneEmbed}
                     onRemove={handleStoneRemove}
                     onHover={handleStoneHover}
                     onLeave={handleStoneLeave}
                     onClick={handleStoneClick}
                     isSelected={selectedStone === stone.id}
                   />
                 </Draggable>
               ))}
          </div>
          
          {/* Pagination Controls */}
          {paginationData.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600 bg-gray-700/30 rounded-lg p-3">
              <button 
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                ← Previous
              </button>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="bg-gray-600 px-3 py-1 rounded-lg font-medium">
                  Page {currentPage + 1} of {paginationData.totalPages}
                </span>
                {paginationData.totalPages >= maxPages && (
                  <span className="text-orange-400 text-xs bg-orange-900/30 px-2 py-1 rounded">
                    (Max {maxPages} pages)
                  </span>
                )}
              </div>
              <button 
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages - 1, p + 1))}
                disabled={currentPage === paginationData.totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Equipment Sockets */}
        <div className="w-80 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">⚔️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Equipment Sockets
              </h3>
              <p className="text-sm text-gray-400">Embed stones to enhance gear</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {renderEquipmentSockets()}
            {renderEquipmentSockets().length === 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-center border border-gray-600/50 shadow-lg">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">⚔️</span>
                </div>
                <p className="text-gray-400 font-medium mb-2">No equipment with sockets found</p>
                <p className="text-gray-500 text-sm">
                  Equip items with sockets to embed stones
                </p>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-600/50 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-400 text-lg">💡</span>
              <h4 className="text-lg font-bold text-white">How to Use</h4>
            </div>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span>Select a stone by clicking <span className="text-blue-400 font-medium">"⚡ Embed"</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span>Click an empty socket <span className="text-gray-400 font-medium">(+)</span> to embed the stone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span>Click a filled socket <span className="text-amber-400 font-medium">(💎)</span> to remove the stone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span>Stones provide <span className="text-purple-400 font-medium">stat bonuses</span> when embedded</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Enhanced Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.position.x,
            top: tooltip.position.y,
            zIndex: 1000
          }}
        >
          <EnhancedTooltip
            type="stone"
            item={tooltip.stone}
          >
            <div />
          </EnhancedTooltip>
        </div>
      )}
      </div>
    </div>
    </DragDropProvider>
  )
})

StonePanel.displayName = 'StonePanel'

export default StonePanel