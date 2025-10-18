import React from 'react'
import { Equipment } from '../systems/equipment'
import { Stone } from '../systems/stones'
import { calculateStoneStats, calculateTotalEquipmentStats, formatStatValue, getStatDisplayName } from '../utils/equipmentTooltip'

interface EquipmentTooltipProps {
  equipment: Equipment
  stones: Stone[]
  className?: string
}

const EquipmentTooltip: React.FC<EquipmentTooltipProps> = ({ equipment, stones, className = '' }) => {
  console.log('EquipmentTooltip rendering:', equipment.name, 'Stones:', stones.length)
  const stoneStats = calculateStoneStats(equipment, stones)
  const totalStats = calculateTotalEquipmentStats(equipment, stones)
  
  // Get socketed stones for this equipment
  const socketedStones = equipment.sockets?.stones
    ?.filter(stoneId => stoneId !== null)
    ?.map(stoneId => stones.find(stone => stone.id === stoneId))
    ?.filter(stone => stone !== undefined) as Stone[] || []
  
  // Deduplicate stones by ID to prevent React key warnings
  const deduplicatedStones = socketedStones.filter((stone, index, arr) => 
    arr.findIndex(s => s.id === stone.id) === index
  )

  const getRarityColor = (rarity: string) => {
    const colors = {
      'Common': '#FFFFFF',
      'Magic': '#8888FF',
      'Rare': '#FFFF88',
      'Epic': '#FF88FF',
      'Legendary': '#FF8800',
      'Mythic': '#FF0000'
    }
    return colors[rarity as keyof typeof colors] || '#FFFFFF'
  }

  const getStoneRarityColor = (rarity: string) => {
    const stoneRarityColors = {
      'Common': '#9CA3AF',
      'Rare': '#3B82F6',
      'Mythical': '#8B5CF6',
      'Divine': '#F59E0B'
    }
    return stoneRarityColors[rarity as keyof typeof stoneRarityColors] || '#FFFFFF'
  }

  return (
    <div className={`bg-gray-900 border-2 border-yellow-400 rounded-lg p-4 shadow-xl w-[900px] max-h-[90vh] overflow-y-auto ${className}`} style={{ zIndex: 9999 }}>
      {/* Equipment Name and Type */}
      <div className="mb-3 text-center">
        <h3 
          className="font-bold text-lg mb-1" 
          style={{ color: getRarityColor(equipment.rarity) }}
        >
          {equipment.name}
        </h3>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span>{equipment.category} • Level {equipment.level}</span>
          <span>{equipment.rarity} {equipment.type}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Equipment Stats */}
        <div className="space-y-3">
          {/* Base Stats */}
          {Object.keys(equipment.baseStats).length > 0 && (
            <div>
              <h4 className="text-blue-400 font-semibold text-xs mb-1">Base Stats:</h4>
              <div className="space-y-0.5 bg-blue-900/10 rounded p-2">
                {Object.entries(equipment.baseStats).map(([stat, value]) => (
                  typeof value === 'number' && value > 0 && (
                    <div key={stat} className="text-white text-xs">
                      +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Affixes */}
          {equipment.affixes.length > 0 && (
            <div>
              <h4 className="text-green-400 font-semibold text-xs mb-1">Affixes:</h4>
              <div className="space-y-1 bg-green-900/10 rounded p-2">
                {equipment.affixes.map((affix, index) => (
                  <div key={index}>
                    <div className="text-green-300 text-xs font-medium">{affix.name}</div>
                    <div className="text-green-200 text-xs ml-2">
                      +{formatStatValue(affix.stat, affix.value)} {getStatDisplayName(affix.stat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Socket Information */}
          {equipment.sockets && (
            <div>
              <h4 className="text-yellow-400 font-semibold text-xs mb-1">Sockets:</h4>
              <div className="bg-yellow-900/10 rounded p-2">
                <div className="flex space-x-1 mb-1">
                  {equipment.sockets.stones.map((stoneId, index) => (
                    <div
                      key={index}
                      className={`w-5 h-5 border-2 rounded ${
                        stoneId ? 'border-purple-400 bg-purple-900' : 'border-gray-500 bg-gray-800'
                      }`}
                      title={stoneId ? 'Socketed' : 'Empty Socket'}
                    >
                      {stoneId && (
                        <div className="w-full h-full bg-purple-500 rounded opacity-60"></div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-xs">
                  {deduplicatedStones.length}/{equipment.sockets.stones.length} sockets used
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stone Information */}
        <div className="space-y-3">
          {/* Socketed Stones */}
          {deduplicatedStones.length > 0 && (
            <div>
              <h4 className="text-purple-400 font-semibold text-xs mb-1">Socketed Stones:</h4>
              <div className="space-y-2">
                {deduplicatedStones.map((stone, index) => (
                  <div key={stone.id} className="border-l-2 border-purple-500 pl-2 bg-gray-800/30 rounded-r p-1.5">
                    <div 
                      className="text-xs font-medium mb-0.5"
                      style={{ color: getStoneRarityColor(stone.rarity) }}
                    >
                      {stone.name}
                    </div>
                    
                    {/* Stone Base Stats */}
                    {Object.entries(stone.baseStats).map(([stat, value]) => (
                      typeof value === 'number' && value > 0 && (
                        <div key={stat} className="text-purple-200 text-xs ml-1">
                          +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                        </div>
                      )
                    ))}
                    
                    {/* Stone Affixes */}
                    {stone.affixes.map((affix, affixIndex) => (
                      <div key={affixIndex}>
                        <div className="text-purple-300 text-xs ml-1">{affix.name}</div>
                        <div className="text-purple-200 text-xs ml-2">
                          +{formatStatValue(affix.stat, affix.value)} {getStatDisplayName(affix.stat)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stone Bonus Summary */}
          {Object.keys(stoneStats).length > 0 && (
            <div>
              <h4 className="text-purple-400 font-semibold text-xs mb-1">Stone Bonus Total:</h4>
              <div className="space-y-0.5 bg-purple-900/20 rounded p-2">
                {Object.entries(stoneStats).map(([stat, value]) => (
                  typeof value === 'number' && value > 0 && (
                    <div key={stat} className="text-purple-300 text-xs">
                      +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Total Stats and Value */}
      <div className="border-t border-gray-600 pt-3 mt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Stats Summary */}
          <div>
            <h4 className="text-yellow-400 font-semibold text-xs mb-1">Total Equipment Stats:</h4>
            <div className="space-y-0.5 bg-yellow-900/20 rounded p-2 max-h-32 overflow-y-auto">
              {Object.entries(totalStats).map(([stat, value]) => (
                typeof value === 'number' && value > 0 && (
                  <div key={stat} className="text-yellow-300 text-xs">
                    +{formatStatValue(stat, value)} {getStatDisplayName(stat)}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Equipment Value and Info */}
          <div className="flex flex-col justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">Equipment Value</p>
              <p className="text-yellow-400 text-sm font-bold">
                {equipment.value} gold
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EquipmentTooltip