import React from 'react'
import { useGame } from '../systems/gameContext'

function rarityColor(r) {
  if (!r) return '#9ca3af'
  if (r === 'Common') return '#9ca3af'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  if (r === 'Legendary') return '#ff6b6b'
  return '#9ca3af'
}

function elementColor(element) {
  if (!element || element === 'physical') return ''
  const colors = {
    fire: '#ff6b6b',
    ice: '#74c0fc',
    lightning: '#ffd43b',
    poison: '#51cf66'
  }
  return colors[element] || ''
}

function formatElement(element) {
  if (!element || element === 'physical') return ''
  const symbols = {
    fire: '🔥',
    ice: '❄️',
    lightning: '⚡',
    poison: '☠️'
  }
  return symbols[element] || ''
}

const equipmentSlots = [
  { id: 'weapon', name: 'Weapon', icon: '⚔️' },
  { id: 'shield', name: 'Shield/Off-Hand', icon: '🛡️' },
  { id: 'helm', name: 'Helm', icon: '⛑️' },
  { id: 'bodyArmor', name: 'Body Armor', icon: '👕' },
  { id: 'gloves', name: 'Gloves', icon: '🧤' },
  { id: 'boots', name: 'Boots', icon: '👢' },
  { id: 'ring', name: 'Ring', icon: '💍' },
  { id: 'belt', name: 'Belt', icon: '🎒' }
]

export default function EquipmentPanel() {
  const { state } = useGame()
  const p = state.player

  // Map equipped item to correct slot based on item type
  const getEquippedItem = (slotId) => {
    if (!p.equipped) return null
    
    // Map item types to equipment slots
    const itemType = p.equipped.type
    
    if (slotId === 'weapon' && (itemType === 'melee' || itemType === 'ranged')) {
      return p.equipped
    }
    
    // For now, only weapons are supported
    // Future: Add armor, accessories, etc.
    return null
  }

  const renderEquipmentSlot = (slot) => {
    const equippedItem = getEquippedItem(slot.id)
    
    return (
      <div key={slot.id} className="relative group">
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
                +{equippedItem.power}
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
                <div className="text-orange-400 font-medium">
                  Power: +{equippedItem.power}
                </div>
                {equippedItem.damageType && equippedItem.damageType !== 'physical' && (
                  <div style={{ color: elementColor(equippedItem.damageType) }}>
                    Damage Type: {equippedItem.damageType}
                  </div>
                )}
                {equippedItem.extras && equippedItem.extras.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-700">
                    {equippedItem.extras.map((e, i) => (
                      <div key={i} className="text-blue-300">
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
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/95 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <h2 className="text-xl font-bold text-center">⚔️ EQUIPMENT</h2>
      </div>
      
      {/* Equipment Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3 h-full">
          {equipmentSlots.map(slot => renderEquipmentSlot(slot))}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-gray-600">
        <div className="text-center text-sm text-gray-400">
          {p.equipped ? (
            <span>1 item equipped</span>
          ) : (
            <span>No equipment</span>
          )}
        </div>
      </div>
    </div>
  )
}