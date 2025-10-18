import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useGame } from '../systems/gameContext'
import { DragDropProvider } from './DragDropSystem'
import { EnhancedTooltip } from './EnhancedTooltip'
import { SmartFilterSystem } from './SmartFilterSystem'
import { EnhancedEquipmentView, EquipmentGrid } from './EnhancedEquipmentView'
import { DESIGN_TOKENS, getColor } from '../utils/designTokens'
import { EquipmentSlot } from '../systems/equipment'

// Standalone Tooltip Component for inventory tooltips
interface StandaloneTooltipProps {
  item: any
  position: { x: number; y: number }
  level: 'quick' | 'detailed' | 'comparison' | 'advanced'
  equippedItem?: any
  onClose: () => void
  onLevelChange: (level: 'quick' | 'detailed' | 'comparison' | 'advanced') => void
}

const StandaloneTooltip: React.FC<StandaloneTooltipProps> = ({
  item,
  position,
  level,
  equippedItem,
  onClose,
  onLevelChange
}) => {
  const renderContent = () => {
    switch (level) {
      case 'quick':
        return (
          <div className="space-y-1">
            <div className="font-bold text-lg" style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}>
              {item.name || 'Unknown Item'}
            </div>
            <div className="text-sm text-gray-400">
              {item.type || 'Unknown Type'}
            </div>
            {item.level && (
              <div className="text-sm text-blue-400">Level {item.level}</div>
            )}
          </div>
        )
      case 'detailed':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="font-bold text-lg" style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}>
                {item.name || 'Unknown Item'}
              </div>
              <div className="text-sm text-gray-400">
                {item.type || 'Unknown Type'}
              </div>
              {item.level && (
                <div className="text-sm text-blue-400">Level {item.level}</div>
              )}
            </div>
            {item.baseStats && Object.keys(item.baseStats).length > 0 && (
              <div>
                <h4 className="text-blue-400 font-semibold text-sm mb-2">Stats:</h4>
                <div className="space-y-1">
                  {Object.entries(item.baseStats).map(([stat, value]) => (
                    typeof value === 'number' && value > 0 && (
                      <div key={stat} className="flex justify-between text-sm">
                        <span className="text-gray-300">{stat}:</span>
                        <span className="text-green-400">+{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            {item.description && (
              <div className="text-sm text-gray-300 italic">
                {item.description}
              </div>
            )}
          </div>
        )
      case 'comparison':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="font-bold text-lg" style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}>
                {item.name || 'Unknown Item'}
              </div>
              <div className="text-sm text-gray-400">
                {item.type || 'Unknown Type'}
              </div>
            </div>
            {equippedItem && (
              <div className="border-t border-gray-600 pt-2">
                <div className="text-yellow-400 text-sm font-semibold mb-2">
                  vs Equipped: {equippedItem.name}
                </div>
                <div className="text-xs text-gray-400">
                  Comparison functionality would be implemented here
                </div>
              </div>
            )}
          </div>
        )
      case 'advanced':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="font-bold text-lg" style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}>
                {item.name || 'Unknown Item'}
              </div>
              <div className="text-sm text-gray-400">
                {item.type || 'Unknown Type'}
              </div>
            </div>
            <div className="border-t border-gray-600 pt-2">
              <div className="text-purple-400 text-sm font-semibold">
                Advanced Information
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Item ID: {item.id || 'N/A'}</div>
                <div>Generated: {item.timestamp || 'Unknown'}</div>
                {item.seed && <div>Seed: {item.seed}</div>}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg max-w-sm"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex space-x-2">
          {(['quick', 'detailed', 'comparison', 'advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => onLevelChange(lvl)}
              className={`px-2 py-1 text-xs rounded ${
                level === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white ml-2"
        >
          ✕
        </button>
      </div>
      {renderContent()}
    </div>
  )
}

// Enhanced Inventory Panel with all new UI improvements
export default function EnhancedInventoryPanel() {
  const { state, actions } = useGame()

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('grid')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [tooltipState, setTooltipState] = useState<{
    item: any | null
    position: { x: number; y: number } | null
    level: 'quick' | 'detailed' | 'comparison' | 'advanced'
    isPersistent: boolean
  }>({
    item: null,
    position: null,
    level: 'quick',
    isPersistent: false
  })

  // Get inventory items
  const inventoryItems = useMemo(() => {
    return state.inventory || []
  }, [state.inventory])

  // Initialize filtered items with inventory items
  const [filteredItems, setFilteredItems] = useState<any[]>([])

  // Sync filtered items with inventory items when inventory changes
  useEffect(() => {
    setFilteredItems(inventoryItems)
  }, [inventoryItems])

  // Get equipped items for comparison
  const equippedItems = useMemo(() => {
    return state.player.equipment || {}
  }, [state.player.equipment])

  // Get stones for embedding
  const stones = useMemo(() => {
    return state.player.stones || []
  }, [state.player.stones])

  // Filter stones for embedding
  const availableStones = useMemo(() => {
    return stones.filter((s: any) => !s.embedded)
  }, [stones])

  // Get equipped item for comparison
  const getEquippedItem = useCallback((itemType: string) => {
    return equippedItems[itemType as EquipmentSlot]
  }, [equippedItems])

  // Define filter groups for the smart filter system
  const filterGroups = useMemo(() => [
    {
      id: 'rarity',
      label: 'Rarity',
      type: 'multiple' as const,
      options: [...new Set(inventoryItems.map((i: any) => i.rarity).filter(Boolean))].map((rarity: string) => ({
        id: rarity,
        label: rarity,
        value: rarity,
        color: DESIGN_TOKENS.colors.rarity[rarity as keyof typeof DESIGN_TOKENS.colors.rarity] || DESIGN_TOKENS.colors.text.secondary
      }))
    },
    {
      id: 'type',
      label: 'Type',
      type: 'multiple' as const,
      options: [...new Set(inventoryItems.map((i: any) => i.type).filter(Boolean))].map((type: string) => ({
        id: type,
        label: type,
        value: type,
        color: DESIGN_TOKENS.colors.ui.accent
      }))
    },
    {
      id: 'element',
      label: 'Element',
      type: 'multiple' as const,
      options: [...new Set(inventoryItems.map((i: any) => i.element).filter(Boolean))].map((element: string) => ({
        id: element,
        label: element,
        value: element,
        color: DESIGN_TOKENS.colors.elements[element as keyof typeof DESIGN_TOKENS.colors.elements] || DESIGN_TOKENS.colors.text.secondary
      }))
    }
  ], [inventoryItems])

  // Handle item actions
  const handleEquip = useCallback((itemId: string) => {
    actions.equipItem(itemId)
  }, [actions])

  const handleUnequip = useCallback((itemId: string) => {
    actions.unequipItem(itemId)
  }, [actions])

  const handleSell = useCallback((itemId: string) => {
    actions.sellItem(itemId)
  }, [actions])

  // Calculate sell all value
  const sellAllValue = useMemo(() => {
    return inventoryItems.reduce((total, item) => total + (item.value || 0), 0)
  }, [inventoryItems])

  const handleSellAll = useCallback(() => {
    if (inventoryItems.length === 0) return
    if (window.confirm(`Sell all ${inventoryItems.length} items for ${sellAllValue.toFixed(2)} gold?`)) {
      actions.sellAll()
    }
  }, [inventoryItems.length, sellAllValue, actions])

  // Handle stone embedding
  const handleStoneEmbed = useCallback((equipmentId: string, stoneId: string, socketIndex: number) => {
    actions.embedStone(equipmentId, stoneId, socketIndex)
  }, [actions])

  const handleStoneRemove = useCallback((equipmentId: string, socketIndex: number) => {
    actions.removeStoneFromSocket(equipmentId, socketIndex)
  }, [actions])

  // Handle drag and drop validation
  const canDrop = useCallback((item: any, target: any) => {
    if (item.type === 'stone' && target.type === 'socket') {
      return true // Stone can be dropped on socket
    }
    return false
  }, [])

  const handleDrop = useCallback((item: any, target: any) => {
    if (item.type === 'stone' && target.type === 'socket') {
      handleStoneEmbed(target.equipmentId, item.id, target.socketIndex)
    }
  }, [handleStoneEmbed])

  const validateDrop = useCallback((draggedItem: any, targetType: string, targetId: string) => {
    if (draggedItem.type === 'stone' && targetType === 'socket') {
      // Validate stone can be embedded in this socket
      const [equipmentId, socketIndex] = targetId.split('-')
      const equipment = inventoryItems.find(item => item.id === equipmentId)
      
      if (!equipment || !equipment.sockets || parseInt(socketIndex) >= equipment.sockets) {
        return false
      }

      // Check if socket is already occupied
      const existingStone = stones.find(stone => 
        stone.equipmentId === equipmentId && stone.socketIndex === parseInt(socketIndex)
      )
      
      return !existingStone
    }
    
    return false
  }, [inventoryItems, stones])

  // Tooltip management
  const showTooltip = useCallback((event: React.MouseEvent, item: any, level: 'quick' | 'detailed' = 'quick') => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipState({
      item,
      position: { x: rect.right + 10, y: rect.top },
      level,
      isPersistent: false
    })
  }, [])

  const showPersistentTooltip = useCallback((event: React.MouseEvent, item: any, level: 'comparison' | 'advanced' = 'comparison') => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipState({
      item,
      position: { x: rect.right + 10, y: rect.top },
      level,
      isPersistent: true
    })
  }, [])

  const hideTooltip = useCallback(() => {
    if (!tooltipState.isPersistent) {
      setTooltipState(prev => ({ ...prev, item: null, position: null }))
    }
  }, [tooltipState.isPersistent])

  const closeTooltip = useCallback(() => {
    setTooltipState(prev => ({ ...prev, item: null, position: null, isPersistent: false }))
  }, [])

  // Handle item click for detailed view
  const handleItemClick = useCallback((event: React.MouseEvent, item: any) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+click for comparison tooltip
      showPersistentTooltip(event, item, 'comparison')
    } else if (event.shiftKey) {
      // Shift+click for advanced tooltip
      showPersistentTooltip(event, item, 'advanced')
    } else {
      // Regular click for detailed view
      setSelectedItem(item)
    }
  }, [showPersistentTooltip])

  // Wrapper for EquipmentGrid onEquipmentClick prop
  const handleEquipmentClick = useCallback((equipment: any) => {
    // Regular click for detailed view (no modifier keys available in this context)
    setSelectedItem(equipment)
  }, [])

  // Render view mode selector
  const ViewModeSelector = () => (
    <div className="flex bg-gray-800 rounded-lg p-1">
      {[
        { id: 'grid', icon: '⊞', label: 'Grid' },
        { id: 'list', icon: '☰', label: 'List' },
        { id: 'detailed', icon: '📋', label: 'Detailed' }
      ].map((mode) => (
        <button
          key={mode.id}
          onClick={() => setViewMode(mode.id as any)}
          className={`
            px-3 py-2 rounded text-sm font-medium transition-colors
            ${viewMode === mode.id 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }
          `}
          title={mode.label}
        >
          <span className="mr-2">{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  )

  // Render items based on view mode
  const renderItems = () => {
    switch (viewMode) {
      case 'grid':
        return (
          <EquipmentGrid
            equipment={filteredItems}
            stones={stones}
            onEquipmentClick={handleEquipmentClick}
            onStoneEmbed={handleStoneEmbed}
            onStoneRemove={handleStoneRemove}
            onEquipmentHover={showTooltip}
            onEquipmentLeave={hideTooltip}
            className="grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          />
        )
      
      case 'list':
        return (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                onMouseEnter={(e) => showTooltip(e, item)}
                onMouseLeave={hideTooltip}
                onClick={(e) => handleItemClick(e, item)}
              >
                <EnhancedEquipmentView
                  equipment={item}
                  stones={stones.filter(s => s.equipmentId === item.id)}
                  className="w-16 h-16"
                  showSockets={false}
                  interactive={false}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-medium"
                      style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}
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
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSell(item.id)
                    }}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'detailed':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex gap-4">
                  <EnhancedEquipmentView
                    equipment={item}
                    stones={stones.filter(s => s.equipmentId === item.id)}
                    onStoneEmbed={(stoneId, socketIndex) => handleStoneEmbed(item.id, stoneId, socketIndex)}
                    onStoneRemove={(socketIndex) => handleStoneRemove(item.id, socketIndex)}
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 
                        className="font-medium text-lg"
                        style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.type} • Level {item.level || 1}
                      </p>
                    </div>
                    
                    {item.baseStats && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-gray-300">Base Stats:</h4>
                        {Object.entries(item.baseStats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between text-sm">
                            <span className="capitalize">{stat}:</span>
                            <span className="font-medium">{value as number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => item.equipped ? handleUnequip(item.id) : handleEquip(item.id)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          item.equipped
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {item.equipped ? 'Unequip' : 'Equip'}
                      </button>
                      
                      <button
                        onClick={() => handleSell(item.id)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <DragDropProvider
      onDrop={(draggedItem, targetType, targetId) => {
        if (draggedItem.type === 'stone' && targetType === 'socket') {
          const [equipmentId, socketIndex] = targetId.split('-')
          handleStoneEmbed(equipmentId, draggedItem.id, parseInt(socketIndex))
        }
      }}
      validateDrop={validateDrop}
    >
      <div className="h-full flex flex-col bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Enhanced Inventory</h2>
          <ViewModeSelector />
        </div>

        {/* Smart Filter System */}
        <div className="p-4 border-b border-gray-700">
          <SmartFilterSystem
            items={inventoryItems}
            filterGroups={filterGroups}
            onFilterChange={setFilteredItems}
            showSearch={true}
            showSort={true}
          />
        </div>

        {/* Gold and Stats Display */}
        <div className="p-4 bg-gray-700/50 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-yellow-400 text-lg font-bold">
                💰 Gold: {(state.player.gold && typeof state.player.gold === 'number' && !isNaN(state.player.gold)) ? state.player.gold.toFixed(2) : '0.00'}
              </div>
              <div className="text-gray-300 text-sm">
                Items: {filteredItems.length}
                {filteredItems.length !== inventoryItems.length && (
                  <span className="text-gray-400"> / {inventoryItems.length} total</span>
                )}
              </div>
              <div className="text-gray-300 text-sm">
                Total Value: {sellAllValue.toFixed(2)} 💰
              </div>
            </div>
            {inventoryItems.length > 0 && (
              <button
                onClick={handleSellAll}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm transition-all text-black font-bold shadow-lg hover:shadow-xl"
              >
                💰 Sell All Items
              </button>
            )}
          </div>
        </div>

        {/* Items Display */}
        <div className="flex-1 p-4 overflow-auto">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">📦</div>
                <p>No items match your current filters</p>
              </div>
            </div>
          ) : (
            renderItems()
          )}
        </div>

        {/* Standalone Tooltip */}
        {tooltipState.item && tooltipState.position && (
          <StandaloneTooltip
            item={tooltipState.item}
            position={tooltipState.position}
            level={tooltipState.level}
            equippedItem={equippedItems[tooltipState.item.type as EquipmentSlot]}
            onClose={closeTooltip}
            onLevelChange={(level: 'quick' | 'detailed' | 'comparison' | 'advanced') => setTooltipState(prev => ({ ...prev, level }))}
          />
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 
                  className="text-xl font-bold"
                  style={{ color: getColor('rarity', (selectedItem.rarity || 'common').toLowerCase()) }}
                >
                  {selectedItem.name}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <EnhancedEquipmentView
                  equipment={selectedItem}
                  stones={stones.filter(s => s.equipmentId === selectedItem.id)}
                  onStoneEmbed={(stoneId, socketIndex) => handleStoneEmbed(selectedItem.id, stoneId, socketIndex)}
                  onStoneRemove={(socketIndex) => handleStoneRemove(selectedItem.id, socketIndex)}
                  className="mx-auto"
                />
                
                {/* Additional item details would go here */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      selectedItem.equipped ? handleUnequip(selectedItem.id) : handleEquip(selectedItem.id)
                      setSelectedItem(null)
                    }}
                    className={`flex-1 py-2 rounded transition-colors ${
                      selectedItem.equipped
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {selectedItem.equipped ? 'Unequip' : 'Equip'}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleSell(selectedItem.id)
                      setSelectedItem(null)
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropProvider>
  )
}