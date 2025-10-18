import React, { useState, useMemo } from 'react'
import { Socket, DraggableStone } from './DragDropSystem'
import { DESIGN_TOKENS, getColor, getSpacing } from '../utils/designTokens'

interface EnhancedEquipmentViewProps {
  equipment: any
  stones?: any[]
  className?: string
  showSockets?: boolean
  interactive?: boolean
  onStoneEmbed?: (stoneId: string, socketIndex: number) => void
  onStoneRemove?: (socketIndex: number) => void
  onEquipmentClick?: () => void
}

export const EnhancedEquipmentView: React.FC<EnhancedEquipmentViewProps> = ({
  equipment,
  stones = [],
  className = '',
  showSockets = true,
  interactive = true,
  onStoneEmbed,
  onStoneRemove,
  onEquipmentClick
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Calculate socket positions based on equipment type
  const socketPositions = useMemo(() => {
    const maxSockets = equipment.sockets || 0
    const positions: Array<{ x: number; y: number }> = []

    switch (equipment.type) {
      case 'weapon':
        // Weapons: sockets along the blade/handle
        for (let i = 0; i < maxSockets; i++) {
          positions.push({
            x: 20 + (i * 25),
            y: 60 + (i % 2) * 20
          })
        }
        break
      case 'armor':
        // Armor: sockets in a grid pattern
        for (let i = 0; i < maxSockets; i++) {
          const row = Math.floor(i / 2)
          const col = i % 2
          positions.push({
            x: 30 + col * 40,
            y: 30 + row * 30
          })
        }
        break
      case 'accessory':
        // Accessories: circular arrangement
        for (let i = 0; i < maxSockets; i++) {
          const angle = (i / maxSockets) * 2 * Math.PI
          positions.push({
            x: 50 + Math.cos(angle) * 25,
            y: 50 + Math.sin(angle) * 25
          })
        }
        break
      default:
        // Default: simple row
        for (let i = 0; i < maxSockets; i++) {
          positions.push({
            x: 20 + (i * 30),
            y: 70
          })
        }
    }

    return positions
  }, [equipment.type, equipment.sockets])

  // Get equipment icon based on type
  const getEquipmentIcon = () => {
    const iconMap: Record<string, string> = {
      weapon: '⚔️',
      armor: '🛡️',
      helmet: '⛑️',
      boots: '👢',
      gloves: '🧤',
      ring: '💍',
      amulet: '📿',
      belt: '🔗'
    }
    return iconMap[equipment.type] || '📦'
  }

  // Get rarity glow effect
  const getRarityGlow = () => {
    const rarity = equipment.rarity || 'common'
    const color = getColor('rarity', rarity)
    return {
      boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}20`,
      borderColor: color
    }
  }

  return (
    <div
      className={`
        relative w-32 h-32 ${className}
        border-2 rounded-lg
        bg-gradient-to-br from-gray-800 to-gray-900
        transition-all duration-300
        ${interactive ? 'cursor-pointer hover:scale-105' : ''}
        ${isHovered ? 'z-10' : ''}
      `}
      style={getRarityGlow()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEquipmentClick}
    >
      {/* Equipment Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Equipment Icon */}
      <div className="absolute top-2 left-2 text-2xl">
        {getEquipmentIcon()}
      </div>

      {/* Equipment Level */}
      {equipment.level && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1 rounded">
          Lv.{equipment.level}
        </div>
      )}

      {/* Equipment Name */}
      <div 
        className="absolute bottom-2 left-2 right-2 text-xs font-medium truncate"
        style={{ color: getColor('rarity', (equipment.rarity || 'common').toLowerCase()) }}
      >
        {equipment.name}
      </div>

      {/* Sockets */}
      {showSockets && socketPositions.map((position, index) => {
        const embeddedStone = stones.find(stone => stone.socketIndex === index)
        
        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Socket
              socketIndex={index}
              equipmentId={equipment.id}
              stone={embeddedStone}
              isEmpty={!embeddedStone}
              size="sm"
              onStoneEmbed={onStoneEmbed}
              onStoneRemove={onStoneRemove}
            />
          </div>
        )
      })}

      {/* Socket Count Indicator */}
      {equipment.sockets > 0 && (
        <div className="absolute bottom-2 right-2 bg-blue-600/80 text-white text-xs px-1 rounded">
          {stones.length}/{equipment.sockets}
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && interactive && (
        <div className="absolute inset-0 bg-white/10 rounded-lg flex items-center justify-center">
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
            Click for details
          </div>
        </div>
      )}

      {/* Enhancement Level Indicator */}
      {equipment.enhancement > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-yellow-500 text-black text-xs font-bold px-1 rounded">
            +{equipment.enhancement}
          </div>
        </div>
      )}
    </div>
  )
}

// Equipment Grid Component for inventory display
interface EquipmentGridProps {
  equipment: any[]
  stones: any[]
  className?: string
  onEquipmentClick?: (equipment: any) => void
  onStoneEmbed?: (equipmentId: string, stoneId: string, socketIndex: number) => void
  onStoneRemove?: (equipmentId: string, socketIndex: number) => void
  onEquipmentHover?: (event: React.MouseEvent, equipment: any) => void
  onEquipmentLeave?: () => void
}

export const EquipmentGrid: React.FC<EquipmentGridProps> = ({
  equipment,
  stones,
  className = '',
  onEquipmentClick,
  onStoneEmbed,
  onStoneRemove,
  onEquipmentHover,
  onEquipmentLeave
}) => {
  const handleStoneEmbed = (equipmentId: string) => (stoneId: string, socketIndex: number) => {
    if (onStoneEmbed) {
      onStoneEmbed(equipmentId, stoneId, socketIndex)
    }
  }

  const handleStoneRemove = (equipmentId: string) => (socketIndex: number) => {
    if (onStoneRemove) {
      onStoneRemove(equipmentId, socketIndex)
    }
  }

  return (
    <div className={`grid grid-cols-4 gap-4 ${className}`}>
      {equipment.map((item) => {
        const itemStones = stones.filter(stone => stone.equipmentId === item.id)
        
        return (
          <div
            key={item.id}
            onMouseEnter={(e) => onEquipmentHover?.(e, item)}
            onMouseLeave={onEquipmentLeave}
          >
            <EnhancedEquipmentView
              equipment={item}
              stones={itemStones}
              onEquipmentClick={() => onEquipmentClick?.(item)}
              onStoneEmbed={handleStoneEmbed(item.id)}
              onStoneRemove={handleStoneRemove(item.id)}
              interactive={true}
            />
          </div>
        )
      })}
    </div>
  )
}

// Equipment Slot Component for character sheet
interface EquipmentSlotProps {
  slotType: string
  equipment?: any
  stones?: any[]
  className?: string
  onEquipmentChange?: (equipment: any) => void
  onStoneEmbed?: (stoneId: string, socketIndex: number) => void
  onStoneRemove?: (socketIndex: number) => void
}

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slotType,
  equipment,
  stones = [],
  className = '',
  onEquipmentChange,
  onStoneEmbed,
  onStoneRemove
}) => {
  const getSlotIcon = () => {
    const iconMap: Record<string, string> = {
      weapon: '⚔️',
      helmet: '⛑️',
      armor: '🛡️',
      gloves: '🧤',
      boots: '👢',
      ring1: '💍',
      ring2: '💍',
      amulet: '📿',
      belt: '🔗'
    }
    return iconMap[slotType] || '📦'
  }

  if (!equipment) {
    return (
      <div className={`
        w-32 h-32 ${className}
        border-2 border-dashed border-gray-600
        rounded-lg bg-gray-800/50
        flex flex-col items-center justify-center
        text-gray-500 text-sm
        transition-all duration-200
        hover:border-blue-400 hover:bg-blue-400/10
      `}>
        <div className="text-2xl mb-1">{getSlotIcon()}</div>
        <div className="capitalize">{slotType}</div>
      </div>
    )
  }

  return (
    <EnhancedEquipmentView
      equipment={equipment}
      stones={stones}
      className={className}
      onEquipmentClick={() => onEquipmentChange?.(null)}
      onStoneEmbed={onStoneEmbed}
      onStoneRemove={onStoneRemove}
    />
  )
}

export default EnhancedEquipmentView