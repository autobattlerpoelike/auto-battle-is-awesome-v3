import React, { useMemo, useCallback, memo } from 'react'
import { useGame } from '../systems/gameContext'
import { EQUIPMENT_SLOTS, RARITIES, type EquipmentSlot } from '../systems/equipment'
import { canEquip } from '../systems/equipmentGenerator'
import type { DamageType } from '../systems/combat'

// Helper functions for styling - optimized with lookup tables
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

function elementColor(element: DamageType | undefined): string {
  if (!element || element === 'physical') return ''
  return elementColorMap[element as keyof typeof elementColorMap] || ''
}

function formatElement(element: DamageType | undefined): string {
  if (!element || element === 'physical') return ''
  return elementSymbolMap[element as keyof typeof elementSymbolMap] || ''
}

// Memoized equipment slot component
const EquipmentSlotComponent = memo(({ 
  slot, 
  equippedItem, 
  onUnequip,
  player
}: { 
  slot: any
  equippedItem: any
  onUnequip: (slotId: string) => void
  player: any
}) => {
  const handleUnequip = useCallback((e: React.MouseEvent) => {
    if (equippedItem) {
      e.preventDefault()
      onUnequip(slot.id)
    }
  }, [onUnequip, slot.id, equippedItem])
  
  return (
    <div className="relative group">
      {/* Slot Name Label */}
      <div className="text-center mb-2">
        <div className="text-xs font-medium text-gray-400">{slot.name}</div>
      </div>
      
      {/* Equipment Slot */}
      <div
        className="relative bg-gray-800/70 border-2 rounded-xl p-3 h-20 flex flex-col items-center justify-center hover:bg-gray-700/70 transition-all cursor-pointer"
        style={{
          borderColor: equippedItem ? rarityColor(equippedItem.rarity) : '#4b5563',
          boxShadow: equippedItem ? `0 0 15px ${rarityColor(equippedItem.rarity)}20` : 'none'
        }}
        onContextMenu={handleUnequip}
      >
        {equippedItem ? (
          <div className="text-center relative">
            {/* Equipped Item Icon */}
            <div className="text-2xl mb-1 relative">
              {slot.icon}
              {/* Rarity Glow Effect */}
              <div 
                className="absolute inset-0 blur-sm opacity-50"
                style={{ color: rarityColor(equippedItem.rarity) }}
              >
                {slot.icon}
              </div>
            </div>
            
            {/* Power Display */}
            <div 
              className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-900/80"
              style={{ color: rarityColor(equippedItem.rarity) }}
            >
              {equippedItem.power ? `+${equippedItem.power.toFixed(2)}` : 
               equippedItem.baseStats?.damage ? `+${equippedItem.baseStats.damage.toFixed(2)}` :
               '+?'}
            </div>
            
            {/* Element Indicator */}
            {equippedItem.damageType && equippedItem.damageType !== 'physical' && (
              <div className="absolute -top-1 -right-1 text-xs">
                {formatElement(equippedItem.damageType)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center opacity-40">
            <div className="text-2xl mb-1">{slot.icon}</div>
            <div className="text-xs text-gray-500">Empty</div>
          </div>
        )}
      </div>
      
      {/* Item Name Below Slot */}
      {equippedItem && (
        <div className="text-center mt-2">
          <div 
            className="text-xs font-bold truncate px-1"
            style={{ color: rarityColor(equippedItem.rarity) }}
            title={equippedItem.name}
          >
            {equippedItem.name}
          </div>
        </div>
      )}
      
      {/* Enhanced Hover Tooltip */}
      {equippedItem && (
        <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none">
          <div className="bg-gray-900/95 border-2 rounded-lg p-4 text-xs whitespace-nowrap shadow-2xl backdrop-blur-sm"
               style={{ borderColor: rarityColor(equippedItem.rarity) }}>
            {/* Item Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">{slot.icon}</div>
              <div>
                <div className="font-bold text-sm" style={{ color: rarityColor(equippedItem.rarity) }}>
                  {equippedItem.name}
                </div>
                <div className="text-gray-400 text-xs">
                  {equippedItem.type} • {equippedItem.rarity}
                </div>
              </div>
              {equippedItem.damageType && equippedItem.damageType !== 'physical' && (
                <div className="text-lg">{formatElement(equippedItem.damageType)}</div>
              )}
            </div>
            
            {/* Stats */}
            <div className="border-t border-gray-700 pt-2">
              {/* Legacy power display */}
              {equippedItem.power && (
                <div className="text-orange-400 font-medium">
                  Power: +{equippedItem.power.toFixed(2)}
                </div>
              )}
              
              {/* New equipment base stats */}
              {equippedItem.baseStats && (
                <div className="text-orange-400 font-medium">
                  <div className="text-xs text-gray-400 mb-1">Base Stats:</div>
                  {Object.entries(equippedItem.baseStats).map(([stat, value]) => (
                    <div key={stat} className="text-xs">
                      {stat}: +{typeof value === 'number' ? (value as number).toFixed(2) : String(value)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Damage type */}
              {equippedItem.damageType && equippedItem.damageType !== 'physical' && (
                <div style={{ color: elementColor(equippedItem.damageType) }}>
                  Damage Type: {equippedItem.damageType}
                </div>
              )}
              
              {/* Requirements */}
              {equippedItem.requirements && Object.keys(equippedItem.requirements).length > 0 && (
                <div className="mt-1 pt-1 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Requirements:</div>
                  {Object.entries(equippedItem.requirements).map(([attr, value]) => {
                    const playerValue = (player.attributes as any)?.[attr] || 0
                    const canMeet = playerValue >= (value as number)
                    return (
                      <div key={attr} className={`text-xs ${canMeet ? 'text-green-400' : 'text-red-400'}`}>
                        {attr}: {value} ({playerValue})
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Affixes */}
              {equippedItem.affixes && equippedItem.affixes.length > 0 && (
                <div className="mt-1 pt-1 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Affixes:</div>
                  {equippedItem.affixes.map((affix: any, i: number) => (
                    <div key={i} className="text-blue-300 text-xs">
                      {affix.name}: +{affix.value.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legacy extras */}
              {equippedItem.extras && equippedItem.extras.length > 0 && (
                <div className="mt-1 pt-1 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Bonuses:</div>
                  {equippedItem.extras.map((e: any, i: number) => (
                    <div key={i} className="text-blue-300 text-xs">
                      {e.key}: +{e.val}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const EquipmentPanel = memo(function EquipmentPanel() {
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
      <EquipmentSlotComponent
        key={slot.id}
        slot={slot}
        equippedItem={equippedItem}
        onUnequip={handleUnequip}
        player={p}
      />
    )
  }, [getEquippedItem, handleUnequip])

  return (
    <div className="h-full flex flex-col bg-gray-900/95 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <h2 className="text-xl font-bold text-center">⚔️ EQUIPMENT</h2>
      </div>
      
      {/* Equipment Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3 h-full">
          {EQUIPMENT_SLOTS.map(renderEquipmentSlot)}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-gray-600">
        <div className="text-center text-sm text-gray-400">
          {(() => {
            if (equippedCount === 0) return <span>No equipment</span>
            if (equippedCount === 1) return <span>1 item equipped</span>
            return <span>{equippedCount} items equipped</span>
          })()}
        </div>
      </div>
    </div>
  )
})

export default EquipmentPanel