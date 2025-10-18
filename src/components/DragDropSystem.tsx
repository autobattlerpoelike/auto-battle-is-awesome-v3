import React, { useState, useRef, useCallback, useEffect } from 'react'
import { DESIGN_TOKENS, getColor, getSpacing } from '../utils/designTokens'

// Drag and Drop Context
interface DragDropContextType {
  draggedItem: any | null
  draggedType: 'stone' | 'equipment' | 'skill' | null
  isDragging: boolean
  startDrag: (item: any, type: 'stone' | 'equipment' | 'skill') => void
  endDrag: () => void
  isValidDropTarget: (targetType: string, targetId: string) => boolean
}

const DragDropContext = React.createContext<DragDropContextType | null>(null)

export const useDragDrop = () => {
  const context = React.useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider')
  }
  return context
}

// Drag and Drop Provider
interface DragDropProviderProps {
  children: React.ReactNode
  onDrop?: (draggedItem: any, targetType: string, targetId: string) => void
  validateDrop?: (draggedItem: any, targetType: string, targetId: string) => boolean
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onDrop,
  validateDrop
}) => {
  const [draggedItem, setDraggedItem] = useState<any | null>(null)
  const [draggedType, setDraggedType] = useState<'stone' | 'equipment' | 'skill' | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const startDrag = useCallback((item: any, type: 'stone' | 'equipment' | 'skill') => {
    setDraggedItem(item)
    setDraggedType(type)
    setIsDragging(true)
  }, [])

  const endDrag = useCallback(() => {
    setDraggedItem(null)
    setDraggedType(null)
    setIsDragging(false)
  }, [])

  const isValidDropTarget = useCallback((targetType: string, targetId: string) => {
    if (!draggedItem || !validateDrop) return false
    return validateDrop(draggedItem, targetType, targetId)
  }, [draggedItem, validateDrop])

  const handleDrop = useCallback((targetType: string, targetId: string) => {
    if (draggedItem && onDrop && isValidDropTarget(targetType, targetId)) {
      onDrop(draggedItem, targetType, targetId)
    }
    endDrag()
  }, [draggedItem, onDrop, isValidDropTarget, endDrag])

  const value: DragDropContextType = {
    draggedItem,
    draggedType,
    isDragging,
    startDrag,
    endDrag,
    isValidDropTarget
  }

  return (
    <DragDropContext.Provider value={value}>
      <div onDragEnd={endDrag}>
        {children}
      </div>
    </DragDropContext.Provider>
  )
}

// Draggable Item Component
interface DraggableProps {
  item: any
  type: 'stone' | 'equipment' | 'skill'
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export const Draggable: React.FC<DraggableProps> = ({
  item,
  type,
  children,
  className = '',
  disabled = false
}) => {
  const { startDrag, isDragging, draggedItem } = useDragDrop()
  const [isBeingDragged, setIsBeingDragged] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsBeingDragged(isDragging && draggedItem?.id === item.id)
  }, [isDragging, draggedItem, item.id])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault()
      return
    }

    startDrag(item, type)
    
    // Create drag image
    if (dragRef.current) {
      const dragImage = dragRef.current.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(5deg)'
      dragImage.style.opacity = '0.8'
      e.dataTransfer.setDragImage(dragImage, 20, 20)
    }

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, type }))
  }, [disabled, startDrag, item, type])

  const handleDragEnd = useCallback(() => {
    setIsBeingDragged(false)
  }, [])

  return (
    <div
      ref={dragRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        ${className}
        ${!disabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}
        ${isBeingDragged ? 'opacity-50 scale-95' : ''}
        transition-all duration-200
      `}
      style={{
        transform: isBeingDragged ? 'rotate(5deg)' : 'none'
      }}
    >
      {children}
      
      {/* Drag indicator */}
      {!disabled && (
        <div className="absolute top-1 right-1 opacity-60">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 3h2v2H9V3zm4 0h2v2h-2V3zM9 7h2v2H9V7zm4 0h2v2h-2V7zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// Drop Zone Component
interface DropZoneProps {
  targetType: string
  targetId: string
  children: React.ReactNode
  className?: string
  onDrop?: (draggedItem: any) => void
  disabled?: boolean
}

export const DropZone: React.FC<DropZoneProps> = ({
  targetType,
  targetId,
  children,
  className = '',
  onDrop,
  disabled = false
}) => {
  const { isDragging, isValidDropTarget, endDrag, draggedItem } = useDragDrop()
  const [isHovered, setIsHovered] = useState(false)
  const [isValidTarget, setIsValidTarget] = useState(false)

  useEffect(() => {
    if (isDragging && !disabled) {
      setIsValidTarget(isValidDropTarget(targetType, targetId))
    } else {
      setIsValidTarget(false)
    }
  }, [isDragging, disabled, isValidDropTarget, targetType, targetId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled || !isValidTarget) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsHovered(true)
  }, [disabled, isValidTarget])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only hide hover if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsHovered(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsHovered(false)

    if (disabled || !isValidTarget) return

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (onDrop) {
        onDrop(data.item)
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error)
    }

    endDrag()
  }, [disabled, isValidTarget, onDrop, endDrag])

  const getDropZoneStyles = () => {
    if (disabled || !isDragging) return ''
    
    if (isValidTarget && isHovered) {
      return 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20'
    } else if (isValidTarget) {
      return 'border-blue-400 bg-blue-400/5'
    } else if (isDragging) {
      return 'border-red-400 bg-red-400/5'
    }
    
    return ''
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className}
        ${getDropZoneStyles()}
        transition-all duration-200
        ${isDragging ? 'border-2 border-dashed' : ''}
      `}
    >
      {children}
      
      {/* Drop indicator */}
      {isDragging && isValidTarget && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-400/20 rounded">
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Drop Here
          </div>
        </div>
      )}
      
      {/* Invalid drop indicator */}
      {isDragging && !isValidTarget && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-400/20 rounded">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Invalid Drop
          </div>
        </div>
      )}
    </div>
  )
}

// Socket Component for Equipment
interface SocketProps {
  socketIndex: number
  equipmentId: string
  stone?: any
  isEmpty?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onStoneEmbed?: (stoneId: string, socketIndex: number) => void
  onStoneRemove?: (socketIndex: number) => void
}

export const Socket: React.FC<SocketProps> = ({
  socketIndex,
  equipmentId,
  stone,
  isEmpty = true,
  className = '',
  size = 'md',
  onStoneEmbed,
  onStoneRemove
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const handleDrop = useCallback((draggedStone: any) => {
    if (onStoneEmbed && draggedStone.id) {
      onStoneEmbed(draggedStone.id, socketIndex)
    }
  }, [onStoneEmbed, socketIndex])

  const handleRemoveStone = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStoneRemove) {
      onStoneRemove(socketIndex)
    }
  }, [onStoneRemove, socketIndex])

  return (
    <DropZone
      targetType="socket"
      targetId={`${equipmentId}-${socketIndex}`}
      onDrop={handleDrop}
      className={`
        relative ${sizeClasses[size]} ${className}
        border-2 rounded-full
        ${isEmpty 
          ? 'border-gray-600 border-dashed bg-gray-800/50' 
          : 'border-gray-400 bg-gray-700'
        }
        flex items-center justify-center
        transition-all duration-200
        hover:border-blue-400
      `}
    >
      {stone ? (
        <div className="relative w-full h-full">
          {/* Stone representation */}
          <div 
            className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
            style={{ 
              backgroundColor: getColor('rarity', stone.rarity || 'common'),
              color: '#000'
            }}
          >
            {stone.type?.charAt(0).toUpperCase() || 'S'}
          </div>
          
          {/* Remove button */}
          <button
            onClick={handleRemoveStone}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 transition-colors"
            title="Remove stone"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="text-gray-500 text-xs">
          {isEmpty ? '+' : '○'}
        </div>
      )}
    </DropZone>
  )
}

// Stone Item Component (draggable)
interface DraggableStoneProps {
  stone: any
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const DraggableStone: React.FC<DraggableStoneProps> = ({
  stone,
  className = '',
  size = 'md',
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  return (
    <Draggable item={stone} type="stone" disabled={disabled}>
      <div 
        className={`
          ${sizeClasses[size]} ${className}
          rounded-lg border-2 flex items-center justify-center font-bold
          transition-all duration-200
          hover:scale-105 hover:shadow-lg
          ${disabled ? 'opacity-50' : ''}
        `}
        style={{ 
          backgroundColor: getColor('rarity', stone.rarity || 'common'),
          borderColor: getColor('rarity', stone.rarity || 'common'),
          color: '#000'
        }}
        title={stone.name}
      >
        {stone.type?.charAt(0).toUpperCase() || 'S'}
      </div>
    </Draggable>
  )
}

export default DragDropProvider