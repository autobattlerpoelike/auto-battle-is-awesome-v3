import React, { useMemo, useCallback, useState } from 'react'
import { useGame } from '../systems/gameContext'
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../systems/equipment'
import EquipmentTooltip from './EquipmentTooltip'

interface EquipmentModalProps {
  isOpen: boolean
  onClose: () => void
}

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

// Equipment slot component for grid display
const EquipmentItemComponent = React.memo(({ 
  slot, 
  equippedItem, 
  onUnequip,
  stones
}: { 
  slot: any
  equippedItem: any
  onUnequip: (slotId: string) => void
  stones: any[]
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const handleUnequip = useCallback((e: React.MouseEvent) => {
    if (equippedItem) {
      e.preventDefault()
      onUnequip(slot.id)
    }
  }, [onUnequip, slot.id, equippedItem])

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (equippedItem) {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Center the tooltip on screen
      // Tooltip is now 900px wide, so center it horizontally
      const tooltipWidth = 900
      const tooltipHeight = Math.min(viewportHeight * 0.9, 700) // Max 90% of viewport height or 700px
      
      const x = (viewportWidth - tooltipWidth) / 2
      const y = (viewportHeight - tooltipHeight) / 2
      
      const position = { x, y }
      console.log('Centered tooltip position:', position, 'Equipment:', equippedItem.name, 'Viewport:', { viewportWidth, viewportHeight })
      setTooltipPosition(position)
      setShowTooltip(true)
    }
  }, [equippedItem])

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false)
  }, [])

  const getPowerValue = (item: any): string => {
    if (item.power && typeof item.power === 'number' && !isNaN(item.power)) {
      return `+${item.power.toFixed(0)}`
    }
    if (item.baseStats?.damage && typeof item.baseStats.damage === 'number' && !isNaN(item.baseStats.damage)) {
      return `+${item.baseStats.damage.toFixed(0)}`
    }
    if (item.baseStats?.armor && typeof item.baseStats.armor === 'number' && !isNaN(item.baseStats.armor)) {
      return `+${item.baseStats.armor.toFixed(0)}`
    }
    if (item.baseStats?.health && typeof item.baseStats.health === 'number' && !isNaN(item.baseStats.health)) {
      return `+${item.baseStats.health.toFixed(0)}`
    }
    return '+0'
  }
  
  return (
    <>
      <div 
        className="w-16 h-16 bg-gradient-to-br from-gray-800/60 to-gray-900/80 border-2 rounded-lg flex flex-col items-center justify-center hover:from-gray-700/60 hover:to-gray-800/80 transition-all duration-300 cursor-pointer relative group shadow-lg"
        style={{ 
          borderColor: equippedItem ? rarityColor(equippedItem.rarity) : '#6b7280',
          boxShadow: equippedItem 
            ? `0 0 12px ${rarityColor(equippedItem.rarity)}60, inset 0 0 8px ${rarityColor(equippedItem.rarity)}20` 
            : '0 2px 8px rgba(0,0,0,0.3), inset 0 0 4px rgba(107, 114, 128, 0.1)'
        }}
        onContextMenu={handleUnequip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Slot Icon */}
        <div className="text-xl mb-1">{slot.icon}</div>
        
        {/* Equipment Indicator */}
        {equippedItem ? (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border border-gray-800"></div>
        ) : (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-600 border border-gray-800"></div>
        )}
        
        {/* Sockets indicator */}
        {equippedItem?.sockets && equippedItem.sockets.maxSockets > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: Math.min(equippedItem.sockets.maxSockets, 3) }, (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  equippedItem.sockets.stones[i] 
                    ? 'bg-amber-400' 
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Hover overlay with slot name */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/95 border border-amber-600/30 text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 shadow-xl">
          <div className="text-amber-400 font-medium">{slot.name}</div>
          {equippedItem ? (
            <div className="text-center font-bold" style={{ color: rarityColor(equippedItem.rarity) }}>
              {equippedItem.name}
            </div>
          ) : (
            <div className="text-gray-500 text-center">Empty Slot</div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900/95"></div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && equippedItem && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 9999
          }}
        >
          <EquipmentTooltip equipment={equippedItem} stones={stones} />
        </div>
      )}
    </>
  )
})

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useGame()
  const p = state.player

  // Memoize equipped items for all slots
  const equippedItems = useMemo(() => {
    const items: Record<string, any> = {}
    EQUIPMENT_SLOTS.forEach(slot => {
      // Check new equipment system first
      if (p.equipment && p.equipment[slot.id as EquipmentSlot]) {
        items[slot.id] = p.equipment[slot.id as EquipmentSlot]
      }
      // Legacy support: map old equipped item to weapon slot
      else if (p.equipped && slot.id === 'weapon') {
        const itemType = p.equipped.type
        if (itemType === 'melee' || itemType === 'ranged') {
          items[slot.id] = p.equipped
        }
      }
    })
    return items
  }, [p.equipment, p.equipped])

  // Get equipped item for a specific slot
  const getEquippedItem = useCallback((slotId: string) => {
    // Handle ring2 as a special case - for now, return null since we don't have dual ring support
    if (slotId === 'ring2') {
      return null
    }
    return equippedItems[slotId] || null
  }, [equippedItems])

  // Memoize total equipped items count
  const equippedCount = useMemo(() => {
    let count = 0
    if (p.equipment) {
      count += Object.keys(p.equipment).length
    }
    if (p.equipped && !p.equipment?.weapon) {
      count += 1 // Legacy equipped item
    }
    return count
  }, [p.equipment, p.equipped])
  
  // Memoize unequip callback
  const handleUnequip = useCallback((slotId: string) => {
    dispatch({ type: 'UNEQUIP', payload: slotId })
  }, [dispatch])

  // Memoized render function for equipment slots
  const renderEquipmentSlot = useCallback((slot: any) => {
    const equippedItem = getEquippedItem(slot.id)
    
    return (
      <EquipmentItemComponent
        key={slot.id}
        slot={slot}
        equippedItem={equippedItem}
        onUnequip={handleUnequip}
        stones={p.stones || []}
      />
    )
  }, [getEquippedItem, handleUnequip, p.stones])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-600/50 bg-gray-800/50">
          <h2 className="text-xl font-bold text-amber-400">⚔️ CHARACTER EQUIPMENT</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl px-2 py-1 hover:bg-gray-700 rounded"
          >
            ✕
          </button>
        </div>
        
        {/* Main Equipment Layout */}
        <div className="flex-1 p-6 relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-600/20 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-amber-600/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-amber-600/10 rounded-full"></div>
          </div>
          
          {/* Equipment Grid Layout */}
          <div className="grid grid-cols-5 grid-rows-4 gap-4 h-full max-w-4xl mx-auto relative z-10">
            
            {/* Top Row - Helm */}
            <div className="col-start-3 row-start-1 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'helm') || EQUIPMENT_SLOTS[2])}
            </div>
            
            {/* Second Row - Chest and Amulet */}
            <div className="col-start-1 row-start-2 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'chest') || EQUIPMENT_SLOTS[3])}
            </div>
            <div className="col-start-3 row-start-2 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'amulet') || EQUIPMENT_SLOTS[9])}
            </div>
            <div className="col-start-5 row-start-2 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'legs') || EQUIPMENT_SLOTS[5])}
            </div>
            
            {/* Third Row - Weapon, Armor, Off-hand */}
            <div className="col-start-1 row-start-3 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'weapon') || EQUIPMENT_SLOTS[0])}
            </div>
            
            {/* Central Character Area */}
            <div className="col-start-2 col-span-3 row-start-3 flex items-center justify-center">
              <div className="w-40 h-48 bg-gradient-to-b from-gray-800/60 via-gray-700/40 to-gray-900/60 border-2 border-amber-600/50 rounded-lg flex items-center justify-center relative overflow-hidden shadow-2xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-800/10"></div>
                
                {/* Character Silhouette */}
                <div className="text-7xl text-amber-400/60 relative z-10 drop-shadow-lg">🧙‍♂️</div>
                
                {/* Character Stats Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-gray-900/80 rounded px-2 py-1 text-xs">
                  <div className="flex justify-between text-amber-400">
                    <span>Level {p.level || 1}</span>
                    <span>Power: {Object.values(equippedItems).reduce((total, item) => {
                      if (!item) return total
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
                    }, 0).toFixed(0)}</span>
                  </div>
                </div>
                
                {/* Decorative Frame */}
                <div className="absolute inset-0 border-2 border-amber-500/30 rounded-lg"></div>
                <div className="absolute inset-1 border border-amber-400/20 rounded-md"></div>
                
                {/* Corner Decorations */}
                <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-amber-500/60"></div>
                <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-amber-500/60"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-amber-500/60"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-amber-500/60"></div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-lg shadow-inner" style={{
                  boxShadow: 'inset 0 0 20px rgba(251, 191, 36, 0.1)'
                }}></div>
              </div>
            </div>
            
            <div className="col-start-5 row-start-3 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'offhand') || EQUIPMENT_SLOTS[1])}
            </div>
            
            {/* Fourth Row - Gloves, Belt, Boots */}
            <div className="col-start-1 row-start-4 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'gloves') || EQUIPMENT_SLOTS[4])}
            </div>
            <div className="col-start-3 row-start-4 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'belt') || EQUIPMENT_SLOTS[7])}
            </div>
            <div className="col-start-5 row-start-4 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'boots') || EQUIPMENT_SLOTS[6])}
            </div>
            
            {/* Rings - positioned on sides */}
            <div className="col-start-2 row-start-4 flex justify-center">
              {renderEquipmentSlot(EQUIPMENT_SLOTS.find(slot => slot.id === 'ring') || EQUIPMENT_SLOTS[8])}
            </div>
            <div className="col-start-4 row-start-4 flex justify-center">
              {/* Second ring slot - we'll create a duplicate for now */}
              {renderEquipmentSlot({...EQUIPMENT_SLOTS.find(slot => slot.id === 'ring') || EQUIPMENT_SLOTS[8], id: 'ring2', name: 'Ring 2'})}
            </div>
          </div>
        </div>
        
        {/* Equipment Stats Summary */}
        <div className="border-t border-amber-600/50 p-4 bg-gray-800/50">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-400">Equipped: </span>
              <span className="text-amber-400 font-medium">{equippedCount}/{EQUIPMENT_SLOTS.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Power: </span>
              <span className="text-orange-400 font-bold">
                +{Object.values(equippedItems).reduce((total, item) => {
                  if (!item) return total
                  
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
                }, 0).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EquipmentModal