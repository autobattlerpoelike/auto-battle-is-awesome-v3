import React, { useState, useMemo, useCallback, memo } from 'react'
import { useGame } from '../systems/gameContext'

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
  onSell 
}: { 
  item: any
  viewMode: string
  onEquip: (id: string) => void
  onSell: (id: string) => void 
}) => {
  const handleEquip = useCallback(() => onEquip(item.id), [onEquip, item.id])
  const handleSell = useCallback(() => onSell(item.id), [onSell, item.id])
  
  return (
    <div className={`bg-gray-700 rounded border border-gray-600 ${
      viewMode === 'grid' ? 'p-2' : 'p-3'
    }`}>
      <div className={`${viewMode === 'grid' ? 'flex flex-col' : 'flex justify-between items-start'}`}>
        <div className="flex-1">
          <div className={`font-bold ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`} style={{color: rarityColor(item.rarity)}}>
            {viewMode === 'grid' ? (item.name || 'Unnamed Item').split(' ').slice(0, 2).join(' ') : (item.name || 'Unnamed Item')} {formatElement(item.damageType)}
          </div>
          <div className={`text-gray-300 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
            {/* Show new equipment stats */}
            {item.baseStats ? (
              <>
                {item.baseStats.damage && `Damage: ${Math.floor(item.baseStats.damage)}`}
                {item.baseStats.armor && `Armor: ${Math.floor(item.baseStats.armor)}`}
                {item.baseStats.health && ` • HP: +${Math.floor(item.baseStats.health)}`}
                {item.category && ` • ${item.category}`}
                {item.slot && ` • ${item.slot}`}
              </>
            ) : (
              /* Legacy equipment stats */
              <>
                Power: +{item.power} • {item.type}
              </>
            )}
            {item.damageType && item.damageType !== 'physical' && (
              <span style={{color: elementColor(item.damageType)}}> • {item.damageType}</span>
            )}
          </div>
          
          {/* Show affixes for new equipment or extras for legacy */}
          {item.affixes && item.affixes.length > 0 && viewMode === 'list' && (
            <div className="text-xs text-blue-300 mt-1">
              {item.affixes.map((a: any) => `${a.name}: +${a.value}`).join(', ')}
            </div>
          )}
          {item.extras && item.extras.length > 0 && viewMode === 'list' && (
            <div className="text-xs text-blue-300 mt-1">
              {item.extras.map((e: any) => `${e.key}: +${e.val}`).join(', ')}
            </div>
          )}
          
          {/* Show requirements if any */}
          {item.requirements && viewMode === 'list' && (
            <div className="text-xs text-orange-300 mt-1">
              Requires: {Object.entries(item.requirements).map(([attr, val]) => `${attr}: ${val}`).join(', ')}
            </div>
          )}
          
          <div className={`text-yellow-400 mt-1 ${viewMode === 'grid' ? 'text-xs' : 'text-xs'}`}>
            Value: {item.value} gold
          </div>
        </div>
        <div className={`flex gap-1 ${viewMode === 'grid' ? 'mt-2' : 'ml-3'}`}>
          <button 
            className={`bg-blue-600 hover:bg-blue-700 rounded text-xs transition-all ${
              viewMode === 'grid' ? 'px-1 py-0.5 flex-1' : 'px-2 py-1'
            }`}
            onClick={handleEquip}
          >
            {viewMode === 'grid' ? '⚡' : 'Equip'}
          </button>
          <button 
            className={`bg-red-600 hover:bg-red-700 rounded text-xs transition-all ${
              viewMode === 'grid' ? 'px-1 py-0.5 flex-1' : 'px-2 py-1'
            }`}
            onClick={handleSell}
          >
            {viewMode === 'grid' ? '🗑️' : 'Discard'}
          </button>
        </div>
      </div>
    </div>
  )
})

const InventoryPanel = memo(function InventoryPanel() {
  const { state, dispatch, actions } = useGame()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const itemsPerPage = viewMode === 'grid' ? 6 : 4
  const maxPages = 10
  
  // Memoize sorted inventory to avoid re-sorting on every render
  const sortedInventory = useMemo(() => {
    return state.inventory.slice().sort((a,b)=> {
      const rarityOrder = ['Legendary','Unique','Rare','Magic','Common']
      const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
      if (rarityDiff !== 0) return rarityDiff
      
      // Sort by power for legacy items, or by damage/armor for new items
      const aPower = a.power || (a.baseStats?.damage) || (a.baseStats?.armor) || 0
      const bPower = b.power || (b.baseStats?.damage) || (b.baseStats?.armor) || 0
      return bPower - aPower
    })
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
    setViewMode(mode)
    setCurrentPage(0) // Reset to first page when changing view mode
  }, [])
  
  const handleEquip = useCallback((itemId: string) => {
    dispatch({ type: 'EQUIP', payload: itemId })
  }, [dispatch])
  
  const handleSell = useCallback((itemId: string) => {
    dispatch({ type: 'DISCARD', payload: itemId })
  }, [dispatch])

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Inventory</h2>
        <div className="flex gap-1">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-2 py-1 rounded text-xs transition-all ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`px-2 py-1 rounded text-xs transition-all ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ⊞ Grid
          </button>
        </div>
      </div>
      <div className="mb-3 flex justify-between items-center">
        <div className="text-yellow-400 text-sm">Gold: {Math.floor(state.player.gold)}</div>
        {state.inventory.length > 0 && (
          <button
            onClick={handleSellAll}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-all text-black font-bold"
          >
            💰 Sell All
          </button>
        )}
      </div>
      {paginationData.excessItems > 0 && (
        <div className="mb-3 p-2 bg-orange-900/30 border border-orange-600/40 rounded text-orange-300 text-xs">
          ⚠️ {paginationData.excessItems} excess items converted to gold automatically
        </div>
      )}


      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Items</div>
          {paginationData.totalPages > 1 && (
            <div className="text-xs text-gray-400">
              Page {currentPage + 1} of {paginationData.totalPages}
            </div>
          )}
        </div>
        <div className={`flex-1 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
          {paginationData.displayInventory.length === 0 && <div className="text-gray-400 text-sm col-span-2">No items yet.</div>}
          {paginationData.currentItems.map((item) => (
            <InventoryItem
              key={item.id}
              item={item}
              viewMode={viewMode}
              onEquip={handleEquip}
              onSell={handleSell}
            />
          ))}
        </div>
        
        {/* Pagination Controls */}
        {paginationData.totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Page {currentPage + 1} of {paginationData.totalPages}</span>
              {paginationData.totalPages >= maxPages && (
                <span className="text-orange-400 text-xs">(Max {maxPages} pages)</span>
              )}
            </div>
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages - 1, p + 1))}
              disabled={currentPage === paginationData.totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default InventoryPanel
