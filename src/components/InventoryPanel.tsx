import React, { useState, useMemo, useCallback, memo } from 'react'
import { useGame } from '../systems/gameContext'

// Tooltip component for item stat comparison
const ItemTooltip = memo(({ item, position, onClose, equippedItem, isPersistent }: {
  item: any
  position: { x: number; y: number }
  onClose: () => void
  equippedItem?: any
  isPersistent?: boolean
}) => {
  const compareStats = useMemo(() => {
    if (!equippedItem) return null
    
    const itemStats = item.baseStats || { damage: item.power || 0, armor: 0, health: 0 }
    const equippedStats = equippedItem.baseStats || { damage: equippedItem.power || 0, armor: 0, health: 0 }
    
    return {
      damage: (itemStats.damage || 0) - (equippedStats.damage || 0),
      armor: (itemStats.armor || 0) - (equippedStats.armor || 0),
      health: (itemStats.health || 0) - (equippedStats.health || 0)
    }
  }, [item, equippedItem])
  
  const StatComparison = ({ label, current, equipped, diff }: {
    label: string
    current: number
    equipped?: number
    diff?: number
  }) => {
    // Ensure current is a valid number
    if (current === undefined || current === null || typeof current !== 'number' || isNaN(current)) {
      return null
    }
    
    return (
      <div className="flex justify-between items-center">
        <span>{label}:</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{current.toFixed(1)}</span>
          {equipped !== undefined && diff !== undefined && typeof diff === 'number' && !isNaN(diff) && (
            <span className={`text-xs ${
              diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
            </span>
          )}
        </div>
      </div>
    )
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
      {/* Item header */}
      <div className="mb-3">
        <div className="font-bold text-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{color: rarityColor(item.rarity)}}>
            <span>{item.name || 'Unnamed Item'}</span>
            {formatElement(item.damageType) && <span>{formatElement(item.damageType)}</span>}
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
          {item.slot && <span className="capitalize">{item.slot}</span>}
          {item.category && item.slot && <span> • </span>}
          {item.category && <span className="capitalize">{item.category}</span>}
        </div>
      </div>
      
      {/* Stats section */}
      <div className="mb-3 space-y-1">
        {item.baseStats ? (
          <>
            {item.baseStats.damage && (
              <StatComparison 
                label="Damage" 
                current={item.baseStats.damage}
                equipped={equippedItem?.baseStats?.damage}
                diff={compareStats?.damage}
              />
            )}
            {item.baseStats.armor && (
              <StatComparison 
                label="Armor" 
                current={item.baseStats.armor}
                equipped={equippedItem?.baseStats?.armor}
                diff={compareStats?.armor}
              />
            )}
            {item.baseStats.health && (
              <StatComparison 
                label="Health" 
                current={item.baseStats.health}
                equipped={equippedItem?.baseStats?.health}
                diff={compareStats?.health}
              />
            )}
          </>
        ) : (
          <StatComparison 
            label="Power" 
            current={item.power || 0}
            equipped={equippedItem?.power}
            diff={equippedItem ? (item.power || 0) - (equippedItem.power || 0) : undefined}
          />
        )}
      </div>
      
      {/* Damage type */}
      {item.damageType && item.damageType !== 'physical' && (
        <div className="mb-3 text-sm">
          <span style={{color: elementColor(item.damageType)}}>
            {formatElement(item.damageType)} {item.damageType} damage
          </span>
        </div>
      )}
      
      {/* Affixes/Modifiers */}
      {item.affixes && item.affixes.length > 0 && (
        <div className="mb-3">
          <div className="text-blue-300 font-medium text-sm mb-1">Modifiers:</div>
          <div className="space-y-1">
            {item.affixes.map((a: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-blue-200">{a.name}:</span>
                <span className="text-blue-100">+{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legacy extras */}
      {item.extras && item.extras.length > 0 && (
        <div className="mb-3">
          <div className="text-blue-300 font-medium text-sm mb-1">Bonuses:</div>
          <div className="space-y-1">
            {item.extras.map((e: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-blue-200">{e.key}:</span>
                <span className="text-blue-100">+{e.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Requirements */}
      {item.requirements && (
        <div className="mb-3">
          <div className="text-orange-300 font-medium text-sm mb-1">Requirements:</div>
          <div className="space-y-1">
            {Object.entries(item.requirements).map(([attr, val]) => (
              <div key={attr} className="flex justify-between text-sm">
                <span className="text-orange-200 capitalize">{attr}:</span>
                <span className="text-orange-100">{val as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Value */}
      <div className="pt-2 border-t border-gray-600">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-400">Value:</span>
          <span className="text-yellow-300 font-medium">{item.value} 💰</span>
        </div>
      </div>
      
      {/* Comparison summary */}
      {equippedItem && compareStats && (
        <div className="mt-3 pt-2 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-1">vs. {equippedItem.name}:</div>
          <div className="text-xs">
            {Object.entries(compareStats).map(([stat, diff]) => {
              // Ensure diff is a valid number before using toFixed
              if (diff === 0 || diff === undefined || diff === null || typeof diff !== 'number' || isNaN(diff)) return null
              return (
                <span key={stat} className={`mr-2 ${
                  diff > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat}: {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              )
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  )
})

// Helper functions for styling - memoized for performance
const rarityColorMap = {
  'Common': '#9ca3af',
  'Magic': '#06b6d4',
  'Rare': '#8b5cf6',
  'Unique': '#fbbf24',
  'Legendary': '#ff6b6b'
} as const

const elementColorMap = {
  'fire': '#ff6b6b',
  'ice': '#74c0fc',
  'lightning': '#ffd43b',
  'poison': '#51cf66'
} as const

const elementSymbolMap = {
  'fire': '🔥',
  'ice': '❄️',
  'lightning': '⚡',
  'poison': '☠️'
} as const

function rarityColor(r: string | undefined): string {
  if (!r) return '#9ca3af'
  return rarityColorMap[r as keyof typeof rarityColorMap] || '#9ca3af'
}

function elementColor(element: string | undefined): string {
  if (!element || element === 'physical') return ''
  return elementColorMap[element as keyof typeof elementColorMap] || ''
}

function formatElement(element: string | undefined): string {
  if (!element || element === 'physical') return ''
  return elementSymbolMap[element as keyof typeof elementSymbolMap] || ''
}

// Memoized item component for better performance
const InventoryItem = memo(({ 
  item, 
  viewMode,
  onEquip, 
  onUnequip,
  onSell,
  isEquipped,
  onHover,
  onLeave,
  onClick
}: { 
  item: any
  viewMode: string
  onEquip: (id: string) => void
  onUnequip: (id: string) => void
  onSell: (id: string) => void
  isEquipped: boolean
  onHover?: (event: React.MouseEvent, item: any) => void
  onLeave?: () => void
  onClick?: (event: React.MouseEvent, item: any) => void
}) => {
  const handleEquip = useCallback(() => onEquip(item.id), [onEquip, item.id])
  const handleUnequip = useCallback(() => onUnequip(item.id), [onUnequip, item.id])
  const handleSell = useCallback(() => onSell(item.id), [onSell, item.id])
  
  return (
    <div 
      className={`bg-gray-700 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
        isEquipped 
          ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20' 
          : 'border-gray-600 hover:border-gray-400 hover:bg-gray-600/50'
      } ${viewMode === 'grid' ? 'p-3 h-auto min-h-[200px] max-h-[300px] overflow-hidden' : 'p-4'}`}
      onMouseEnter={(e) => onHover?.(e, item)}
      onMouseLeave={onLeave}
      onClick={(e) => onClick?.(e, item)}
    >
      <div className={`h-full ${viewMode === 'grid' ? 'flex flex-col justify-between' : 'flex justify-between items-start gap-4'}`}>
        <div className="flex-1">
          {/* Item name with equipped indicator */}
          <div className={`font-bold flex items-center gap-2 mb-2 ${viewMode === 'grid' ? 'text-sm' : 'text-lg'}`} style={{color: rarityColor(item.rarity)}}>
            {isEquipped && <span className="text-green-400 text-lg">✓</span>}
            <span className="truncate">{viewMode === 'grid' ? (item.name || 'Unnamed Item').split(' ').slice(0, 3).join(' ') : (item.name || 'Unnamed Item')}</span>
            {formatElement(item.damageType) && <span className="text-lg">{formatElement(item.damageType)}</span>}
          </div>
          
          {/* Item type and slot */}
          <div className={`text-gray-400 mb-3 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-2">
              {item.slot && <span className="capitalize bg-gray-600 px-2 py-1 rounded text-xs">{item.slot}</span>}
              {item.category && <span className="capitalize text-gray-300">{item.category}</span>}
              {item.type && !item.slot && <span className="bg-gray-600 px-2 py-1 rounded text-xs">{item.type}</span>}
            </div>
          </div>
          
          {/* Primary stats */}
          <div className={`text-gray-300 mb-2 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            {item.baseStats ? (
              <div className="space-y-1 bg-gray-800/50 p-2 rounded">
                {item.baseStats.damage && typeof item.baseStats.damage === 'number' && !isNaN(item.baseStats.damage) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">⚔️ Damage:</span>
                    <span className="text-red-300 font-bold">{item.baseStats.damage.toFixed(1)}</span>
                  </div>
                )}
                {item.baseStats.armor && typeof item.baseStats.armor === 'number' && !isNaN(item.baseStats.armor) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">🛡️ Armor:</span>
                    <span className="text-blue-300 font-bold">{item.baseStats.armor.toFixed(1)}</span>
                  </div>
                )}
                {item.baseStats.health && typeof item.baseStats.health === 'number' && !isNaN(item.baseStats.health) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">❤️ Health:</span>
                    <span className="text-green-300 font-bold">+{item.baseStats.health.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Legacy equipment stats */
              <div className="bg-gray-800/50 p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">⚡ Power:</span>
                  <span className="text-yellow-300 font-bold">+{item.power}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Damage type */}
          {item.damageType && item.damageType !== 'physical' && (
            <div className={`mb-2 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
              <div className="bg-gray-800/50 p-2 rounded">
                <span style={{color: elementColor(item.damageType)}} className="font-medium">
                  {formatElement(item.damageType)} {item.damageType} damage
                </span>
              </div>
            </div>
          )}
          
          {/* Show affixes for new equipment or extras for legacy */}
          {item.affixes && item.affixes.length > 0 && (
            <div className={`mb-2 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
              <div className="bg-blue-900/30 p-2 rounded border border-blue-600/30">
                <div className="font-medium text-blue-300 mb-1">✨ Modifiers:</div>
                <div className="space-y-1">
                  {item.affixes.map((a: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-blue-200">{a.name}:</span>
                      <span className="text-blue-100 font-medium">+{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {item.extras && item.extras.length > 0 && (
            <div className={`mb-2 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
              <div className="bg-blue-900/30 p-2 rounded border border-blue-600/30">
                <div className="font-medium text-blue-300 mb-1">✨ Bonuses:</div>
                <div className="space-y-1">
                  {item.extras.map((e: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-blue-200">{e.key}:</span>
                      <span className="text-blue-100 font-medium">+{e.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Show requirements if any */}
          {item.requirements && (
            <div className={`mb-2 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
              <div className="bg-orange-900/30 p-2 rounded border border-orange-600/30">
                <div className="font-medium text-orange-300 mb-1">⚠️ Requirements:</div>
                <div className="space-y-1">
                  {Object.entries(item.requirements).map(([attr, val]) => (
                    <div key={attr} className="flex justify-between">
                      <span className="capitalize text-orange-200">{attr}:</span>
                      <span className="text-orange-100 font-medium">{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Item value and action buttons */}
        <div className={`${viewMode === 'grid' ? 'mt-auto' : ''}`}>
          <div className={`text-yellow-400 mb-2 pt-2 border-t border-gray-600 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            <div className="flex justify-between items-center bg-yellow-900/20 p-2 rounded">
              <span className="text-yellow-300">💰 Value:</span>
              <span className="font-bold text-yellow-200">{item.value} gold</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className={`flex gap-2 ${viewMode === 'grid' ? '' : ''}`}>
            {isEquipped ? (
              <button 
                className={`bg-orange-600 hover:bg-orange-700 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl ${
                  viewMode === 'grid' ? 'px-2 py-1 text-xs flex-1' : 'px-4 py-2 text-sm'
                }`}
                onClick={handleUnequip}
              >
                {viewMode === 'grid' ? '↓ Unequip' : '↓ Unequip Item'}
              </button>
            ) : (
              <button 
                className={`bg-blue-600 hover:bg-blue-700 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl ${
                  viewMode === 'grid' ? 'px-2 py-1 text-xs flex-1' : 'px-4 py-2 text-sm'
                }`}
                onClick={handleEquip}
              >
                {viewMode === 'grid' ? '↑ Equip' : '↑ Equip Item'}
              </button>
            )}
            <button 
              className={`bg-red-600 hover:bg-red-700 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl ${
                viewMode === 'grid' ? 'px-2 py-1 text-xs flex-1' : 'px-3 py-2 text-sm'
              }`}
              onClick={handleSell}
            >
              {viewMode === 'grid' ? '🗑️' : '🗑️ Sell'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const InventoryPanel = memo(function InventoryPanel() {
  const { state, dispatch, actions } = useGame()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'armor' | 'accessories'>('all')
  const [tooltip, setTooltip] = useState<{
    item: any
    position: { x: number; y: number }
    equippedItem?: any
    isPersistent?: boolean
  } | null>(null)
  const itemsPerPage = 20
  const maxPages = 10
  
  // Memoize sorted and filtered inventory to avoid unnecessary re-renders
  const sortedInventory = useMemo(() => {
    let filteredInventory = [...state.inventory]
    
    // Filter by active tab
    if (activeTab !== 'all') {
      filteredInventory = filteredInventory.filter(item => {
        if (activeTab === 'weapons') {
          return item.category === 'weapon'
        } else if (activeTab === 'armor') {
          return item.category === 'armor'
        } else if (activeTab === 'accessories') {
          return item.category === 'accessory'
        }
        return true
      })
    }
    
    return filteredInventory.sort((a, b) => {
      // Sort by rarity first (Legendary > Unique > Rare > Magic > Common)
      const rarityOrder = ['Legendary','Unique','Rare','Magic','Common']
      const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
      if (rarityDiff !== 0) return rarityDiff
      
      // Sort by power for legacy items, or by damage/armor for new items
      const aPower = a.power || (a.baseStats?.damage) || (a.baseStats?.armor) || 0
      const bPower = b.power || (b.baseStats?.damage) || (b.baseStats?.armor) || 0
      return bPower - aPower
    })
  }, [state.inventory, activeTab])

  // Memoize item counts for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: state.inventory.length,
      weapons: 0,
      armor: 0,
      accessories: 0
    }
    
    state.inventory.forEach(item => {
      if (item.category === 'weapon') counts.weapons++
      else if (item.category === 'armor') counts.armor++
      else if (item.category === 'accessory') counts.accessories++
    })
    
    return counts
  }, [state.inventory])

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.min(maxPages, Math.ceil(sortedInventory.length / itemsPerPage))
    const maxItems = maxPages * itemsPerPage
    const displayInventory = sortedInventory.slice(0, maxItems)
    const startIndex = currentPage * itemsPerPage
    const currentItems = displayInventory.slice(startIndex, startIndex + itemsPerPage)
    const excessItems = sortedInventory.length - maxItems
    
    return {
      totalPages,
      displayInventory,
      currentItems,
      excessItems
    }
  }, [sortedInventory, currentPage, itemsPerPage, maxPages])
  
  // Memoize sell all value calculation
  const sellAllValue = useMemo(() => {
    return state.inventory.reduce((sum, item) => sum + (item.value || 0), 0)
  }, [state.inventory])
  
  // Memoize callbacks
  const handleSellAll = useCallback(() => {
    if (window.confirm(`Sell all ${state.inventory.length} items for ${sellAllValue} gold?`)) {
      actions.sellAll()
    }
  }, [state.inventory.length, sellAllValue, actions])
  
  const handleViewModeChange = useCallback((mode: string) => {
    setViewMode(mode as 'list' | 'grid')
    setCurrentPage(0) // Reset to first page when changing view mode
  }, [])

  const handleTabChange = useCallback((tab: 'all' | 'weapons' | 'armor' | 'accessories') => {
    setActiveTab(tab)
    setCurrentPage(0) // Reset to first page when changing tabs
  }, [])
  
  const handleEquip = useCallback((itemId: string) => {
    dispatch({ type: 'EQUIP', payload: itemId })
  }, [dispatch])
  
  const handleUnequip = useCallback((itemId: string) => {
    const item = state.inventory.find(i => i.id === itemId)
    if (item && item.slot) {
      dispatch({ type: 'UNEQUIP', payload: item.slot })
    }
  }, [dispatch, state.inventory])
  
  const handleSell = useCallback((itemId: string) => {
    dispatch({ type: 'DISCARD', payload: itemId })
  }, [dispatch])

  // Helper function to check if an item is equipped
  const isItemEquipped = useCallback((item: any) => {
    if (!item.slot) return false
    const equippedItem = state.player.equipment?.[item.slot as keyof typeof state.player.equipment]
    return equippedItem && equippedItem.id === item.id
  }, [state.player.equipment])

  // Tooltip handlers
  const handleItemHover = useCallback((event: React.MouseEvent, item: any) => {
    // Only show hover tooltip if no persistent tooltip is active
    if (!tooltip?.isPersistent) {
      const equippedItem = item.slot ? state.player.equipment?.[item.slot as keyof typeof state.player.equipment] : undefined
      
      // Get the item element's bounding box for better positioning
      const rect = event.currentTarget.getBoundingClientRect()
      const tooltipWidth = 400 // Approximate tooltip width
      const tooltipHeight = 300 // Approximate tooltip height
      
      // Try to position to the right of the item first
      let x = rect.right + 10
      let y = rect.top
      
      // If tooltip would go off the right edge, position to the left
      if (x + tooltipWidth > window.innerWidth) {
        x = rect.left - tooltipWidth - 10
      }
      
      // If tooltip would go off the left edge, center it horizontally
      if (x < 0) {
        x = Math.max(10, (window.innerWidth - tooltipWidth) / 2)
      }
      
      // If tooltip would go off the bottom, position above the item
      if (y + tooltipHeight > window.innerHeight) {
        y = rect.top - tooltipHeight - 10
      }
      
      // Ensure tooltip doesn't go off the top
      if (y < 0) {
        y = 10
      }
      
      setTooltip({
        item,
        position: { x, y },
        equippedItem,
        isPersistent: false
      })
    }
  }, [state.player.equipment, tooltip?.isPersistent])

  const handleItemLeave = useCallback(() => {
    // Only hide tooltip if it's not persistent
    if (!tooltip?.isPersistent) {
      setTooltip(null)
    }
  }, [tooltip?.isPersistent])

  const handleItemClick = useCallback((event: React.MouseEvent, item: any) => {
    event.stopPropagation()
    const equippedItem = item.slot ? state.player.equipment?.[item.slot as keyof typeof state.player.equipment] : undefined
    
    // Get the item element's bounding box for better positioning
    const rect = event.currentTarget.getBoundingClientRect()
    const tooltipWidth = 400 // Approximate tooltip width
    const tooltipHeight = 300 // Approximate tooltip height
    
    // Try to position to the right of the item first
    let x = rect.right + 10
    let y = rect.top
    
    // If tooltip would go off the right edge, position to the left
    if (x + tooltipWidth > window.innerWidth) {
      x = rect.left - tooltipWidth - 10
    }
    
    // If tooltip would go off the left edge, center it horizontally
    if (x < 0) {
      x = Math.max(10, (window.innerWidth - tooltipWidth) / 2)
    }
    
    // If tooltip would go off the bottom, position above the item
    if (y + tooltipHeight > window.innerHeight) {
      y = rect.top - tooltipHeight - 10
    }
    
    // Ensure tooltip doesn't go off the top
    if (y < 0) {
      y = 10
    }
    
    setTooltip({
      item,
      position: { x, y },
      equippedItem,
      isPersistent: true
    })
  }, [state.player.equipment])

  const handleTooltipClose = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div 
      className="panel p-6 w-full flex flex-col bg-gray-800"
      onClick={(e) => {
        // Close persistent tooltip when clicking outside
        if (tooltip?.isPersistent) {
          handleTooltipClose()
        }
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">🎒 Inventory</h2>
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'all' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            📦 All Items <span className="text-xs opacity-75">({tabCounts.all})</span>
          </button>
          <button
            onClick={() => handleTabChange('weapons')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'weapons' 
                ? 'bg-red-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            ⚔️ Weapons <span className="text-xs opacity-75">({tabCounts.weapons})</span>
          </button>
          <button
            onClick={() => handleTabChange('armor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'armor' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            🛡️ Armor <span className="text-xs opacity-75">({tabCounts.armor})</span>
          </button>
          <button
            onClick={() => handleTabChange('accessories')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'accessories' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            💍 Accessories <span className="text-xs opacity-75">({tabCounts.accessories})</span>
          </button>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 text-lg font-bold">💰 Gold: {(state.player.gold && typeof state.player.gold === 'number' && !isNaN(state.player.gold)) ? state.player.gold.toFixed(2) : '0.00'}</div>
            <div className="text-gray-300 text-sm">
              {activeTab === 'all' ? 'Total Items' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}: {sortedInventory.length}
              {activeTab !== 'all' && <span className="text-gray-400"> / {state.inventory.length} total</span>}
            </div>
            <div className="text-gray-300 text-sm">Total Value: {(sellAllValue && typeof sellAllValue === 'number' && !isNaN(sellAllValue)) ? sellAllValue.toFixed(2) : '0.00'} 💰</div>
          </div>
          {state.inventory.length > 0 && (
            <button
              onClick={handleSellAll}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm transition-all text-black font-bold shadow-lg hover:shadow-xl"
            >
              💰 Sell All Items
            </button>
          )}
        </div>
      </div>
      {paginationData.excessItems > 0 && (
        <div className="mb-4 p-3 bg-orange-900/30 border border-orange-600/40 rounded-lg text-orange-300 text-sm">
          ⚠️ {paginationData.excessItems} excess items converted to gold automatically
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-semibold text-gray-200">Items ({sortedInventory.length})</div>
          {paginationData.totalPages > 1 && (
            <div className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-lg">
              Page {currentPage + 1} of {paginationData.totalPages}
            </div>
          )}
        </div>
        <div className={`flex-1 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : 'space-y-3 p-2'}`}>
          {paginationData.currentItems.length === 0 && <div className="text-gray-400 text-sm col-span-2">No items yet.</div>}
          {paginationData.currentItems.map((item) => (
            <InventoryItem
              key={item.id}
              item={item}
              viewMode={viewMode}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onSell={handleSell}
              isEquipped={!!isItemEquipped(item)}
              onHover={handleItemHover}
              onLeave={handleItemLeave}
              onClick={handleItemClick}
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
      
      {/* Tooltip */}
      {tooltip && (
        <ItemTooltip
          item={tooltip.item}
          position={tooltip.position}
          onClose={handleTooltipClose}
          equippedItem={tooltip.equippedItem}
          isPersistent={tooltip.isPersistent}
        />
      )}
    </div>
  )
})

export default InventoryPanel
