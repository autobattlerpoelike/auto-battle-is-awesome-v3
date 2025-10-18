import React, { useState, useMemo, useCallback, memo } from 'react'
import { useGame } from '../systems/gameContext'
import { generateStone } from '../systems/stoneGenerator'
import { getStoneColor, getStoneIcon, STONE_BASES, StoneType, StoneRarity } from '../systems/stones'
import { embedStone, removeStone, hasAvailableSocket } from '../systems/equipment'

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
        className={`bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700 ${
          isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600'
        }`}
        onMouseEnter={onHover ? (e) => onHover(e, stone) : undefined}
        onMouseLeave={onLeave}
        onClick={onClick ? (e) => onClick(e, stone) : undefined}
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: getStoneColor(stone.rarity) }}
          >
            {getStoneIcon(stone.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: getStoneColor(stone.rarity) }}>
              {stone.name}
            </div>
            <div className="text-xs text-gray-400">
              Level {stone.level} • {stone.rarity}
            </div>
          </div>
        </div>
        
        {/* Base stats preview */}
        <div className="text-xs space-y-1 mb-2">
          {Object.entries(stone.baseStats).slice(0, 2).map(([stat, value]) => (
            typeof value === 'number' && value > 0 && (
              <div key={stat} className="text-green-400">
                +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
              </div>
            )
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEmbed(stone.id)
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Embed
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(stone.id)
            }}
            className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div
      className={`bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700 ${
        isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600'
      }`}
      onMouseEnter={onHover ? (e) => onHover(e, stone) : undefined}
      onMouseLeave={onLeave}
      onClick={onClick ? (e) => onClick(e, stone) : undefined}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: getStoneColor(stone.rarity) }}
        >
          {getStoneIcon(stone.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-bold" style={{ color: getStoneColor(stone.rarity) }}>
              {stone.name}
            </div>
            <div className="text-xs text-gray-400">
              Level {stone.level} • {stone.rarity}
            </div>
          </div>
          
          {/* Stats display */}
          <div className="text-sm space-y-1">
            {/* Base stats */}
            {Object.entries(stone.baseStats).map(([stat, value]) => (
              typeof value === 'number' && value > 0 && (
                <span key={stat} className="text-green-400 mr-3">
                  +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                </span>
              )
            ))}
            
            {/* Affixes */}
            {stone.affixes && stone.affixes.map((affix: any, index: number) => (
              <span key={index} className="text-purple-300 mr-3">
                {affix.name}: +{formatStatValue(affix.stat, affix.value)} {getStatDisplayName(affix.stat)}
              </span>
            ))}
          </div>
          
          {/* Socket compatibility */}
          <div className="flex flex-wrap gap-1 mt-2">
            {stone.socketTypes.map((socketType: string) => (
              <span key={socketType} className="bg-amber-900/30 text-amber-300 px-2 py-1 rounded text-xs">
                {socketType}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="text-yellow-400 text-sm font-medium text-right">
            💰 {stone.value}
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEmbed(stone.id)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded transition-colors"
            >
              Embed
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(stone.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              ✕
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
  }, [state.player.stones])

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
        console.log('Removed stone:', removedStoneId)
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
    setActiveTab(tab)
    setCurrentPage(0)
  }, [])

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
        <div key={slot} className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-600">
          <h3 className="text-white font-bold mb-2 capitalize">{slot}</h3>
          <p className="text-gray-300 text-sm mb-3">{equipment.name}</p>
          
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: equipment.sockets?.maxSockets || 0 }, (_, index) => {
              const stoneId = equipment.sockets?.stones[index]
              const isEmpty = stoneId === null

              return (
                <div
                  key={index}
                  className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    isEmpty 
                      ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                      : 'border-amber-500 bg-amber-900 hover:border-amber-400'
                  }`}
                  onClick={() => {
                    if (isEmpty && selectedStone) {
                      handleEmbedStone(slot, selectedStone, index)
                    } else if (!isEmpty) {
                      handleRemoveStone(slot, index)
                    }
                  }}
                >
                  {isEmpty ? (
                    <span className="text-gray-500 text-xs">+</span>
                  ) : (
                    <span className="text-amber-300 text-lg">💎</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800/50 border-b border-gray-600">
        <h2 className="text-2xl font-bold text-white">💎 Stone Management</h2>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-3 bg-gray-800/50 border-b border-gray-600">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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
              onClick={() => handleTabChange(stoneType as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === stoneType 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {getStoneIcon(stoneType as StoneType)} {stoneData.name} <span className="text-xs opacity-75">({tabCounts[stoneType]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-4 bg-gray-700/50 border-b border-gray-600">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 text-lg font-bold">💰 Gold: {(state.player.gold && typeof state.player.gold === 'number' && !isNaN(state.player.gold)) ? state.player.gold.toFixed(2) : '0.00'}</div>
            <div className="text-gray-300 text-sm">
              {activeTab === 'all' ? 'Total Stones' : `${STONE_BASES[activeTab as StoneType]?.name || activeTab}`}: {sortedStones.length}
              {activeTab !== 'all' && <span className="text-gray-400"> / {state.player.stones?.length || 0} total</span>}
            </div>
            <div className="text-gray-300 text-sm">Total Value: {totalValue.toFixed(2)} 💰</div>
          </div>
          {selectedStone && (
            <div className="text-blue-400 text-sm font-medium">
              Selected stone - click on equipment socket to embed
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
              <StoneItem
                key={stone.id}
                stone={stone}
                viewMode={viewMode}
                onEmbed={handleStoneEmbed}
                onRemove={handleStoneRemove}
                isSelected={selectedStone === stone.id}
                onHover={handleStoneHover}
                onLeave={handleStoneLeave}
                onClick={handleStoneClick}
              />
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
          <h3 className="text-xl font-bold mb-4">Equipment Sockets</h3>
          <div className="flex-1 overflow-y-auto">
            {renderEquipmentSockets()}
            {renderEquipmentSockets().length === 0 && (
              <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-600">
                <p className="text-gray-400">No equipment with sockets found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Equip items with sockets to embed stones
                </p>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-600">
            <h4 className="text-lg font-bold mb-2">How to Use:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Select a stone by clicking "Embed"</li>
              <li>• Click an empty socket (+) to embed the stone</li>
              <li>• Click a filled socket (💎) to remove the stone</li>
              <li>• Stones provide stat bonuses when embedded</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <StoneTooltip
          stone={tooltip.stone}
          position={tooltip.position}
          onClose={handleTooltipClose}
          isPersistent={tooltip.isPersistent}
        />
      )}
    </div>
  )
})

export default StonePanel