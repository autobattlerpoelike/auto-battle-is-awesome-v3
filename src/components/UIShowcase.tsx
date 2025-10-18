import React, { useState } from 'react'
import { DragDropProvider } from './DragDropSystem'
import { EnhancedTooltip } from './EnhancedTooltip'
import { SmartFilterSystem } from './SmartFilterSystem'
import { EnhancedEquipmentView, EquipmentGrid, EquipmentSlot } from './EnhancedEquipmentView'
import { DraggableStone, Socket } from './DragDropSystem'
import { DESIGN_TOKENS, getColor } from '../utils/designTokens'

// Standalone Tooltip Component for UIShowcase
interface StandaloneTooltipProps {
  item: any
  position: { x: number; y: number }
  level: 'quick' | 'detailed' | 'comparison' | 'advanced'
  onClose: () => void
  onLevelChange: (level: 'quick' | 'detailed' | 'comparison' | 'advanced') => void
}

const StandaloneTooltip: React.FC<StandaloneTooltipProps> = ({
  item,
  position,
  level,
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
          </div>
        )
      default:
        return (
          <div className="text-sm text-gray-400">
            {level} view not implemented in showcase
          </div>
        )
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
          ×
        </button>
      </div>
      {renderContent()}
    </div>
  )
}

// Mock data for testing
const mockEquipment = [
  {
    id: 'sword1',
    name: 'Flaming Sword of Power',
    type: 'weapon',
    rarity: 'legendary',
    level: 15,
    enhancement: 3,
    sockets: 2,
    equipped: true,
    baseStats: { damage: 150, critChance: 15 },
    affixes: [
      { name: 'Fire Damage', value: '+25-40' },
      { name: 'Critical Strike Chance', value: '+15%' }
    ]
  },
  {
    id: 'armor1',
    name: 'Dragon Scale Armor',
    type: 'armor',
    rarity: 'epic',
    level: 12,
    sockets: 3,
    equipped: false,
    baseStats: { armor: 200, health: 100 },
    affixes: [
      { name: 'Fire Resistance', value: '+30%' },
      { name: 'Health', value: '+100' }
    ]
  },
  {
    id: 'helmet1',
    name: 'Crown of Wisdom',
    type: 'helmet',
    rarity: 'rare',
    level: 10,
    sockets: 1,
    equipped: false,
    baseStats: { armor: 80, mana: 50 },
    affixes: [
      { name: 'Mana', value: '+50' },
      { name: 'Spell Damage', value: '+20%' }
    ]
  },
  {
    id: 'boots1',
    name: 'Swift Boots',
    type: 'boots',
    rarity: 'uncommon',
    level: 8,
    sockets: 0,
    equipped: true,
    baseStats: { armor: 40, speed: 25 },
    affixes: [
      { name: 'Movement Speed', value: '+25%' }
    ]
  }
]

const mockStones = [
  {
    id: 'stone1',
    name: 'Ruby of Strength',
    type: 'strength',
    rarity: 'rare',
    level: 5,
    baseStats: { damage: 15, strength: 10 },
    equipmentId: 'sword1',
    socketIndex: 0
  },
  {
    id: 'stone2',
    name: 'Sapphire of Wisdom',
    type: 'intelligence',
    rarity: 'epic',
    level: 7,
    baseStats: { mana: 30, intelligence: 15 }
  },
  {
    id: 'stone3',
    name: 'Emerald of Vitality',
    type: 'vitality',
    rarity: 'uncommon',
    level: 3,
    baseStats: { health: 50, vitality: 8 }
  }
]

const UIShowcase: React.FC = () => {
  const [filteredItems, setFilteredItems] = useState(mockEquipment)
  const [selectedTab, setSelectedTab] = useState<'inventory' | 'character' | 'stones'>('inventory')
  const [tooltipState, setTooltipState] = useState<{
    item: any | null
    position: { x: number; y: number } | null
    level: 'quick' | 'detailed' | 'comparison' | 'advanced'
  }>({
    item: null,
    position: null,
    level: 'quick'
  })

  // Filter groups for testing
  const filterGroups = [
    {
      id: 'rarity',
      label: 'Rarity',
      type: 'multiple' as const,
      options: [
        { id: 'uncommon', label: 'Uncommon', value: 'uncommon', color: getColor('rarity', 'uncommon') },
        { id: 'rare', label: 'Rare', value: 'rare', color: getColor('rarity', 'rare') },
        { id: 'epic', label: 'Epic', value: 'epic', color: getColor('rarity', 'epic') },
        { id: 'legendary', label: 'Legendary', value: 'legendary', color: getColor('rarity', 'legendary') }
      ]
    },
    {
      id: 'type',
      label: 'Equipment Type',
      type: 'multiple' as const,
      options: [
        { id: 'weapon', label: 'Weapons', value: 'weapon', icon: '⚔️' },
        { id: 'armor', label: 'Armor', value: 'armor', icon: '🛡️' },
        { id: 'helmet', label: 'Helmets', value: 'helmet', icon: '⛑️' },
        { id: 'boots', label: 'Boots', value: 'boots', icon: '👢' }
      ]
    },
    {
      id: 'equipped',
      label: 'Equipment Status',
      type: 'single' as const,
      options: [
        { id: 'all', label: 'All Items', value: null },
        { id: 'equipped', label: 'Equipped', value: true },
        { id: 'unequipped', label: 'Not Equipped', value: false }
      ]
    }
  ]

  const handleItemHover = (event: React.MouseEvent, item: any, level: 'quick' | 'detailed' = 'quick') => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipState({
      item,
      position: { x: rect.right + 10, y: rect.top },
      level
    })
  }

  const handleTooltipClose = () => {
    setTooltipState({
      item: null,
      position: null,
      level: 'quick'
    })
  }

  const validateDrop = (draggedItem: any, targetType: string, targetId: string) => {
    return draggedItem.type && targetType === 'socket'
  }

  const handleDrop = (draggedItem: any, targetType: string, targetId: string) => {
    console.log('Drop:', draggedItem, 'to', targetType, targetId)
  }

  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
    <button
      onClick={() => setSelectedTab(id as any)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
        ${selectedTab === id 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  )

  return (
    <DragDropProvider onDrop={handleDrop} validateDrop={validateDrop}>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">UI Enhancement Showcase</h1>
            <p className="text-gray-400">
              Demonstrating enhanced tooltips, drag-and-drop, smart filtering, and visual improvements
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-4">
            <TabButton id="inventory" label="Enhanced Inventory" icon="🎒" />
            <TabButton id="character" label="Character Equipment" icon="👤" />
            <TabButton id="stones" label="Stone Management" icon="💎" />
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg p-6">
            {selectedTab === 'inventory' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Enhanced Inventory System</h2>
                
                {/* Smart Filter System */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Smart Filtering & Search</h3>
                  <SmartFilterSystem
                    items={mockEquipment}
                    filterGroups={filterGroups}
                    onFilterChange={setFilteredItems}
                    showSearch={true}
                    showSort={true}
                  />
                </div>

                {/* Equipment Grid */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Enhanced Equipment Display</h3>
                  <EquipmentGrid
                    equipment={filteredItems}
                    stones={mockStones}
                    onEquipmentClick={(item) => handleItemHover({ currentTarget: { getBoundingClientRect: () => ({ right: 400, top: 200 }) } } as any, item, 'detailed')}
                    onStoneEmbed={(equipmentId, stoneId, socketIndex) => console.log('Embed stone:', stoneId, 'in', equipmentId, 'socket', socketIndex)}
                    onStoneRemove={(equipmentId, socketIndex) => console.log('Remove stone from', equipmentId, 'socket', socketIndex)}
                  />
                </div>

                {/* Tooltip Demo */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Progressive Tooltip System</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockEquipment.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-600 rounded cursor-pointer hover:bg-gray-500 transition-colors text-center"
                        onMouseEnter={(e) => handleItemHover(e, item, 'quick')}
                        onMouseLeave={handleTooltipClose}
                        onClick={(e) => handleItemHover(e, item, 'detailed')}
                      >
                        <div className="text-2xl mb-2">
                          {item.type === 'weapon' ? '⚔️' : 
                           item.type === 'armor' ? '🛡️' : 
                           item.type === 'helmet' ? '⛑️' : '👢'}
                        </div>
                        <div className="text-sm" style={{ color: getColor('rarity', (item.rarity || 'common').toLowerCase()) }}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Hover: Quick | Click: Detailed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'character' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Character Equipment Slots</h2>
                
                <div className="grid grid-cols-3 gap-6">
                  {/* Equipment Slots */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium mb-4">Equipment Slots</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div></div>
                      <EquipmentSlot slotType="helmet" equipment={mockEquipment.find(e => e.type === 'helmet')} />
                      <div></div>
                      
                      <EquipmentSlot slotType="weapon" equipment={mockEquipment.find(e => e.type === 'weapon')} stones={mockStones.filter(s => s.equipmentId === 'sword1')} />
                      <EquipmentSlot slotType="armor" equipment={mockEquipment.find(e => e.type === 'armor')} />
                      <div></div>
                      
                      <div></div>
                      <EquipmentSlot slotType="boots" equipment={mockEquipment.find(e => e.type === 'boots')} />
                      <div></div>
                    </div>
                  </div>

                  {/* Character Stats */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Character Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Damage:</span>
                        <span className="font-medium text-red-400">165</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Armor:</span>
                        <span className="font-medium text-blue-400">320</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Health:</span>
                        <span className="font-medium text-green-400">150</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crit Chance:</span>
                        <span className="font-medium text-yellow-400">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'stones' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Stone Management & Embedding</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Stones */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Available Stones (Drag to Embed)</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {mockStones.filter(stone => !stone.equipmentId).map((stone) => (
                        <div key={stone.id} className="text-center">
                          <DraggableStone stone={stone} size="lg" />
                          <div className="text-xs mt-1" style={{ color: getColor('rarity', stone.rarity) }}>
                            {stone.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Socket Demo */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Socket System Demo</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">Empty Sockets:</div>
                        <div className="flex gap-2">
                          <Socket socketIndex={0} equipmentId="demo1" isEmpty={true} />
                          <Socket socketIndex={1} equipmentId="demo1" isEmpty={true} />
                          <Socket socketIndex={2} equipmentId="demo1" isEmpty={true} />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">Filled Sockets:</div>
                        <div className="flex gap-2">
                          <Socket 
                            socketIndex={0} 
                            equipmentId="demo2" 
                            stone={mockStones[0]} 
                            isEmpty={false}
                            onStoneRemove={() => console.log('Remove stone')}
                          />
                          <Socket 
                            socketIndex={1} 
                            equipmentId="demo2" 
                            stone={mockStones[1]} 
                            isEmpty={false}
                            onStoneRemove={() => console.log('Remove stone')}
                          />
                          <Socket socketIndex={2} equipmentId="demo2" isEmpty={true} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stone Stats */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Stone Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockStones.map((stone) => (
                      <div 
                        key={stone.id}
                        className="p-3 bg-gray-600 rounded cursor-pointer hover:bg-gray-500 transition-colors"
                        onMouseEnter={(e) => handleItemHover(e, stone, 'detailed')}
                        onMouseLeave={handleTooltipClose}
                      >
                        <div className="flex items-center gap-3">
                          <DraggableStone stone={stone} disabled />
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: getColor('rarity', stone.rarity) }}>
                              {stone.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              Level {stone.level} • {stone.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Standalone Tooltip */}
          {tooltipState.item && tooltipState.position && (
            <StandaloneTooltip
              item={tooltipState.item}
              position={tooltipState.position}
              level={tooltipState.level}
              onClose={handleTooltipClose}
              onLevelChange={(level: 'quick' | 'detailed' | 'comparison' | 'advanced') => setTooltipState(prev => ({ ...prev, level }))}
            />
          )}

          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2 text-blue-300">How to Test Features:</h3>
            <ul className="space-y-1 text-sm text-blue-200">
              <li>• <strong>Tooltips:</strong> Hover for quick info, click for detailed view, Ctrl+click for comparison</li>
              <li>• <strong>Filtering:</strong> Use the filter system to search and sort items by various criteria</li>
              <li>• <strong>Drag & Drop:</strong> Drag stones to empty sockets in the Stone Management tab</li>
              <li>• <strong>Visual Sockets:</strong> See socket positions and embedded stones on equipment</li>
              <li>• <strong>Progressive Disclosure:</strong> Information is revealed progressively based on interaction level</li>
            </ul>
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}

export default UIShowcase