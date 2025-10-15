import React, { useState } from 'react'
import { useGame } from '../systems/gameContext'

function rarityColor(r: string | undefined): string {
  if (!r) return '#9ca3af'
  if (r === 'Common') return '#9ca3af'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  if (r === 'Legendary') return '#ff6b6b'
  return '#9ca3af'
}

function elementColor(element: string | undefined): string {
  if (!element || element === 'physical') return ''
  const colors: Record<string, string> = {
    fire: '#ff6b6b',
    ice: '#74c0fc',
    lightning: '#ffd43b',
    poison: '#51cf66'
  }
  return colors[element] || ''
}

function formatElement(element: string | undefined): string {
  if (!element || element === 'physical') return ''
  const symbols: Record<string, string> = {
    fire: '🔥',
    ice: '❄️',
    lightning: '⚡',
    poison: '☠️'
  }
  return symbols[element] || ''
}

export default function InventoryPanel() {
  const { state, dispatch, actions } = useGame()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const itemsPerPage = viewMode === 'grid' ? 6 : 4
  const maxPages = 10
  
  const sortedInventory = state.inventory.slice().sort((a,b)=> {
    const rarityOrder = ['Legendary','Unique','Rare','Magic','Common']
    const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    if (rarityDiff !== 0) return rarityDiff
    
    // Sort by power for legacy items, or by damage/armor for new items
    const aPower = a.power || (a.baseStats?.damage) || (a.baseStats?.armor) || 0
    const bPower = b.power || (b.baseStats?.damage) || (b.baseStats?.armor) || 0
    return bPower - aPower
  })
  
  const totalPages = Math.min(maxPages, Math.ceil(sortedInventory.length / itemsPerPage))
  const maxItems = maxPages * itemsPerPage
  const displayInventory = sortedInventory.slice(0, maxItems)
  const startIndex = currentPage * itemsPerPage
  const currentItems = displayInventory.slice(startIndex, startIndex + itemsPerPage)
  const excessItems = sortedInventory.length - maxItems

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Inventory</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 rounded text-xs transition-all ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('grid')}
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
            onClick={() => {
              if (window.confirm(`Sell all ${state.inventory.length} items for ${state.inventory.reduce((sum, item) => sum + (item.value || 0), 0)} gold?`)) {
                actions.sellAll()
              }
            }}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-all text-black font-bold"
          >
            💰 Sell All
          </button>
        )}
      </div>
      {excessItems > 0 && (
        <div className="mb-3 p-2 bg-orange-900/30 border border-orange-600/40 rounded text-orange-300 text-xs">
          ⚠️ {excessItems} excess items converted to gold automatically
        </div>
      )}


      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Items</div>
          {totalPages > 1 && (
            <div className="text-xs text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </div>
          )}
        </div>
        <div className={`flex-1 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
          {displayInventory.length === 0 && <div className="text-gray-400 text-sm col-span-2">No items yet.</div>}
          {currentItems.map((it) => {
            console.log('Inventory item:', it)
            console.log('Item name:', it.name)
            console.log('Item properties:', Object.keys(it))
            return (
            <div key={it.id} className={`bg-gray-700 rounded border border-gray-600 ${
              viewMode === 'grid' ? 'p-2' : 'p-3'
            }`}>
              <div className={`${viewMode === 'grid' ? 'flex flex-col' : 'flex justify-between items-start'}`}>
                <div className="flex-1">
                  <div className={`font-bold ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`} style={{color: rarityColor(it.rarity)}}>
                    {viewMode === 'grid' ? (it.name || 'Unnamed Item').split(' ').slice(0, 2).join(' ') : (it.name || 'Unnamed Item')} {formatElement(it.damageType)}
                  </div>
                  <div className={`text-gray-300 ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
                    {/* Show new equipment stats */}
                    {it.baseStats ? (
                      <>
                        {it.baseStats.damage && `Damage: ${Math.floor(it.baseStats.damage)}`}
                        {it.baseStats.armor && `Armor: ${Math.floor(it.baseStats.armor)}`}
                        {it.baseStats.health && ` • HP: +${Math.floor(it.baseStats.health)}`}
                        {it.category && ` • ${it.category}`}
                        {it.slot && ` • ${it.slot}`}
                      </>
                    ) : (
                      /* Legacy equipment stats */
                      <>
                        Power: +{it.power} • {it.type}
                      </>
                    )}
                    {it.damageType && it.damageType !== 'physical' && (
                      <span style={{color: elementColor(it.damageType)}}> • {it.damageType}</span>
                    )}
                  </div>
                  
                  {/* Show affixes for new equipment or extras for legacy */}
                  {it.affixes && it.affixes.length > 0 && viewMode === 'list' && (
                    <div className="text-xs text-blue-300 mt-1">
                      {it.affixes.map((a: any) => `${a.name}: +${a.value}`).join(', ')}
                    </div>
                  )}
                  {it.extras && it.extras.length > 0 && viewMode === 'list' && (
                    <div className="text-xs text-blue-300 mt-1">
                      {it.extras.map((e: any) => `${e.key}: +${e.val}`).join(', ')}
                    </div>
                  )}
                  
                  {/* Show requirements if any */}
                  {it.requirements && viewMode === 'list' && (
                    <div className="text-xs text-orange-300 mt-1">
                      Requires: {Object.entries(it.requirements).map(([attr, val]) => `${attr}: ${val}`).join(', ')}
                    </div>
                  )}
                  
                  <div className={`text-yellow-400 mt-1 ${viewMode === 'grid' ? 'text-xs' : 'text-xs'}`}>
                    Value: {it.value} gold
                  </div>
                </div>
                <div className={`flex gap-1 ${viewMode === 'grid' ? 'mt-2' : 'ml-3'}`}>
                  <button 
                    className={`bg-blue-600 hover:bg-blue-700 rounded text-xs transition-all ${
                      viewMode === 'grid' ? 'px-1 py-0.5 flex-1' : 'px-2 py-1'
                    }`}
                    onClick={() => dispatch({ type: 'EQUIP', payload: it.id })}
                  >
                    {viewMode === 'grid' ? '⚡' : 'Equip'}
                  </button>
                  <button 
                    className={`bg-red-600 hover:bg-red-700 rounded text-xs transition-all ${
                      viewMode === 'grid' ? 'px-1 py-0.5 flex-1' : 'px-2 py-1'
                    }`}
                    onClick={() => dispatch({ type: 'DISCARD', payload: it.id })}
                  >
                    {viewMode === 'grid' ? '🗑️' : 'Discard'}
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Page {currentPage} of {totalPages}</span>
              {totalPages >= maxPages && (
                <span className="text-orange-400 text-xs">(Max {maxPages} pages)</span>
              )}
            </div>
            <button 
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm disabled:opacity-50 transition-all"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
