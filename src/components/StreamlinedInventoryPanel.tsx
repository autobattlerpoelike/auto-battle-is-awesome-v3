import React, { useState, useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { EnhancedTooltip } from './EnhancedTooltip'
import { getColor } from '../utils/designTokens'

type ViewMode = 'grid' | 'list'
type EquipmentTab = 'all' | 'weapons' | 'helm' | 'chest' | 'legs' | 'boots' | 'gloves' | 'shield' | 'accessories'

interface TooltipState {
  visible: boolean
  item: any
  position: { x: number; y: number }
}

export default function StreamlinedInventoryPanel() {
  const { state, actions } = useGame()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<EquipmentTab>('all')
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, item: null, position: { x: 0, y: 0 } })

  // Get inventory items
  const inventoryItems = useMemo(() => {
    return state.inventory || []
  }, [state.inventory])

  // Filter items by equipment type tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return inventoryItems
    
    return inventoryItems.filter(item => {
      switch (activeTab) {
        case 'weapons':
          return ['sword', 'axe', 'bow', 'staff', 'dagger', 'mace', 'wand'].includes(item.type)
        case 'helm':
          return item.type === 'helm'
        case 'chest':
          return item.type === 'chest'
        case 'legs':
          return item.type === 'legs'
        case 'boots':
          return item.type === 'boots'
        case 'gloves':
          return item.type === 'gloves'
        case 'shield':
          return item.type === 'shield'
        case 'accessories':
          return ['ring', 'amulet', 'belt'].includes(item.type)
        default:
          return true
      }
    })
  }, [inventoryItems, activeTab])

  // Calculate sell all value (excluding equipped items)
  const sellAllValue = useMemo(() => {
    return filteredItems
      .filter(item => !item.equipped)
      .reduce((total, item) => total + (item.value || 0), 0)
  }, [filteredItems])

  // Equipment type tabs
  const equipmentTabs = [
    { id: 'all' as EquipmentTab, label: 'All', icon: '📦' },
    { id: 'weapons' as EquipmentTab, label: 'Weapons', icon: '⚔️' },
    { id: 'helm' as EquipmentTab, label: 'Helms', icon: '⛑️' },
    { id: 'chest' as EquipmentTab, label: 'Chest', icon: '🦺' },
    { id: 'legs' as EquipmentTab, label: 'Legs', icon: '👖' },
    { id: 'boots' as EquipmentTab, label: 'Boots', icon: '🥾' },
    { id: 'gloves' as EquipmentTab, label: 'Gloves', icon: '🧤' },
    { id: 'shield' as EquipmentTab, label: 'Shields', icon: '🛡️' },
    { id: 'accessories' as EquipmentTab, label: 'Accessories', icon: '💍' }
  ]

  // View mode options
  const viewModes = [
    { id: 'grid' as ViewMode, label: 'Grid', icon: '⊞' },
    { id: 'list' as ViewMode, label: 'List', icon: '☰' }
  ]

  // Handlers
  const handleEquip = useCallback((itemId: string) => {
    actions.equipItem(itemId)
  }, [actions])

  const handleUnequip = useCallback((itemId: string) => {
    actions.unequipItem(itemId)
  }, [actions])

  const handleSell = useCallback((itemId: string) => {
    actions.sellItem(itemId)
  }, [actions])

  const handleSellAll = useCallback(() => {
    const unequippedItems = filteredItems.filter(item => !item.equipped)
    if (unequippedItems.length === 0) {
      alert('No items to sell!')
      return
    }
    
    if (window.confirm(`Sell ${unequippedItems.length} items for ${sellAllValue.toFixed(2)} gold?`)) {
      unequippedItems.forEach(item => actions.sellItem(item.id))
    }
  }, [filteredItems, sellAllValue, actions])

  const showTooltip = useCallback((event: React.MouseEvent, item: any) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      item,
      position: { x: rect.right + 10, y: rect.top }
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip({ visible: false, item: null, position: { x: 0, y: 0 } })
  }, [])

  // Render equipment item
  const renderEquipmentItem = (item: any) => {
    const rarityColor = getColor('rarity', (item.rarity || 'common').toLowerCase())
    
    if (viewMode === 'grid') {
      return (
        <div
          key={item.id}
          className="relative p-3 bg-gray-800 rounded-lg border-2 hover:bg-gray-700 transition-all cursor-pointer group"
          style={{ borderColor: item.equipped ? '#10B981' : rarityColor + '40' }}
          onMouseEnter={(e) => showTooltip(e, item)}
          onMouseLeave={hideTooltip}
        >
          {/* Equipment Icon/Visual */}
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
            {getEquipmentIcon(item.type)}
          </div>
          
          {/* Item Name */}
          <div className="text-center">
            <div 
              className="font-medium text-sm truncate mb-1"
              style={{ color: rarityColor }}
            >
              {item.name}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              Level {item.level || 1}
            </div>
          </div>

          {/* Equipped Badge */}
          {item.equipped && (
            <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
              E
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                item.equipped ? handleUnequip(item.id) : handleEquip(item.id)
              }}
              className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                item.equipped
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {item.equipped ? 'Unequip' : 'Equip'}
            </button>
            
            {!item.equipped && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSell(item.id)
                }}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs transition-colors"
                title="Sell"
              >
                💰
              </button>
            )}
          </div>
        </div>
      )
    } else {
      // List view
      return (
        <div
          key={item.id}
          className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border-l-4"
          style={{ borderLeftColor: item.equipped ? '#10B981' : rarityColor }}
          onMouseEnter={(e) => showTooltip(e, item)}
          onMouseLeave={hideTooltip}
        >
          {/* Equipment Icon */}
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
            {getEquipmentIcon(item.type)}
          </div>
          
          {/* Item Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span 
                className="font-medium"
                style={{ color: rarityColor }}
              >
                {item.name}
              </span>
              {item.equipped && (
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                  Equipped
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {item.type} • Level {item.level || 1}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                item.equipped ? handleUnequip(item.id) : handleEquip(item.id)
              }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                item.equipped
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {item.equipped ? 'Unequip' : 'Equip'}
            </button>
            
            {!item.equipped && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSell(item.id)
                }}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
              >
                Sell
              </button>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold mb-4">Inventory</h2>
        
        {/* Equipment Type Tabs */}
        <div className="flex gap-1 mb-4">
          {equipmentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          {/* View Mode Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Sell All Button */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">
              Total Value: {sellAllValue.toFixed(2)} 💰
            </div>
            <button
              onClick={handleSellAll}
              disabled={sellAllValue === 0}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              💰 Sell All ({filteredItems.filter(item => !item.equipped).length})
            </button>
          </div>
        </div>
      </div>

      {/* Items Display */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">📦</div>
            <div>No items in this category</div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
              : 'space-y-2'
          }>
            {filteredItems.map(renderEquipmentItem)}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.item && (
        <EnhancedTooltip
          content={tooltip.item}
          type="equipment"
          position={tooltip.position}
          onClose={hideTooltip}
        />
      )}
    </div>
  )
}

// Helper function to get equipment icon
function getEquipmentIcon(type: string): string {
  const icons: Record<string, string> = {
    // Weapons
    sword: '⚔️',
    axe: '🪓',
    bow: '🏹',
    staff: '🔮',
    dagger: '🗡️',
    mace: '🔨',
    wand: '✨',
    
    // Armor
    helm: '⛑️',
    chest: '🦺',
    legs: '👖',
    boots: '🥾',
    gloves: '🧤',
    shield: '🛡️',
    
    // Accessories
    ring: '💍',
    amulet: '📿',
    belt: '🔗'
  }
  
  return icons[type] || '❓'
}