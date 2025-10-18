import React, { useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../systems/equipment'

// Helper functions for styling
const rarityColorMap = {
  'Common': '#9ca3af',
  'Magic': '#06b6d4', 
  'Rare': '#8b5cf6',
  'Unique': '#fbbf24',
  'Legendary': '#ff6b6b',
  'Mythic': '#ff1493',
  'Divine': '#ffd700'
} as const

function rarityColor(r: string | undefined): string {
  if (!r) return '#9ca3af'
  return rarityColorMap[r as keyof typeof rarityColorMap] || '#9ca3af'
}

const EquipmentPanel = React.memo(function EquipmentPanel() {
  const { state, dispatch } = useGame()
  const p = state.player

  // Memoize equipped items for all slots
  const equippedItems = useMemo(() => {
    const items: Array<{ slot: string, item: any, slotInfo: any }> = []
    
    EQUIPMENT_SLOTS.forEach(slot => {
      let equippedItem = null
      
      // Check new equipment system first
      if (p.equipment && p.equipment[slot.id as EquipmentSlot]) {
        equippedItem = p.equipment[slot.id as EquipmentSlot]
      }
      // Legacy support: map old equipped item to weapon slot
      else if (p.equipped && slot.id === 'weapon') {
        const itemType = p.equipped.type
        if (itemType === 'melee' || itemType === 'ranged') {
          equippedItem = p.equipped
        }
      }
      
      if (equippedItem) {
        items.push({ slot: slot.id, item: equippedItem, slotInfo: slot })
      }
    })
    
    return items
  }, [p.equipment, p.equipped])

  // Memoize unequip callback
  const handleUnequip = useCallback((slotId: string) => {
    dispatch({ type: 'UNEQUIP', payload: slotId })
  }, [dispatch])

  // Calculate total power
  const totalPower = useMemo(() => {
    return equippedItems.reduce((total, { item }) => {
      let itemPower = 0
      
      if (item.power && typeof item.power === 'number' && !isNaN(item.power)) {
        itemPower += item.power
      }
      if (item.baseStats) {
        Object.values(item.baseStats).forEach(value => {
          if (typeof value === 'number' && !isNaN(value)) {
            itemPower += value
          }
        })
      }
      
      return total + itemPower
    }, 0)
  }, [equippedItems])

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-600 bg-gray-700">
        <h2 className="text-lg font-bold text-center text-amber-400">⚔️ Equipment</h2>
      </div>
      
      {/* Equipment Summary */}
      <div className="p-3 border-b border-gray-600 bg-gray-750">
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-400">Equipped: </span>
            <span className="text-amber-400 font-medium">{equippedItems.length}/{EQUIPMENT_SLOTS.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Power: </span>
            <span className="text-orange-400 font-bold">+{totalPower.toFixed(0)}</span>
          </div>
        </div>
      </div>
      
      {/* Equipment List */}
      <div className="flex-1 overflow-y-auto">
        {equippedItems.length > 0 ? (
          <div className="p-2 space-y-2">
            {equippedItems.map(({ slot, item, slotInfo }) => (
              <div
                key={slot}
                className="bg-gray-700 border border-gray-600 rounded-lg p-3 hover:bg-gray-650 transition-colors cursor-pointer"
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleUnequip(slot)
                }}
                title="Right-click to unequip"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{slotInfo.icon}</div>
                    <div>
                      <div className="text-sm text-gray-400">{slotInfo.name}</div>
                      <div 
                        className="font-medium"
                        style={{ color: rarityColor(item.rarity) }}
                      >
                        {item.name || item.type || 'Unknown Item'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {item.rarity || 'Common'}
                    </div>
                    <div className="text-green-400 font-medium">
                      {(() => {
                        let power = 0
                        if (item.power && typeof item.power === 'number' && !isNaN(item.power)) {
                          power += item.power
                        }
                        if (item.baseStats) {
                          Object.values(item.baseStats).forEach(value => {
                            if (typeof value === 'number' && !isNaN(value)) {
                              power += value
                            }
                          })
                        }
                        return `+${power.toFixed(0)}`
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Sockets indicator */}
                {item.sockets && item.sockets.maxSockets > 0 && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-xs text-gray-400">Sockets:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: item.sockets.maxSockets }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            item.sockets.stones[i] 
                              ? 'bg-amber-400' 
                              : 'bg-gray-600'
                          }`}
                          title={item.sockets.stones[i] ? 'Socket filled' : 'Empty socket'}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">⚔️</div>
              <div>No equipment equipped</div>
              <div className="text-sm mt-1">Equip items from your inventory</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with instructions */}
      <div className="p-2 border-t border-gray-600 bg-gray-750">
        <div className="text-xs text-gray-400 text-center">
          Right-click equipped items to unequip
        </div>
      </div>
    </div>
  )
})

export default EquipmentPanel