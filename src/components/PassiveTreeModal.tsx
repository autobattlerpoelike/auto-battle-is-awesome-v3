import React, { useState, useRef, useEffect, useCallback } from 'react'
import { PassiveTreeData, PassiveTreeState, PassiveNode, PassiveNodeType, canAllocateNode, allocateNode } from '../systems/passiveTree'

interface PassiveTreeModalProps {
  isOpen: boolean
  onClose: () => void
  treeData: PassiveTreeData
  treeState: PassiveTreeState
  onAllocateNode: (nodeId: string) => void
  availablePoints: number
}

interface ViewState {
  zoom: number
  offsetX: number
  offsetY: number
}

const PassiveTreeModal: React.FC<PassiveTreeModalProps> = ({
  isOpen,
  onClose,
  treeData,
  treeState,
  onAllocateNode,
  availablePoints
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY
      }))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, viewState.zoom * zoomFactor))
    
    setViewState(prev => ({
      ...prev,
      zoom: newZoom
    }))
  }, [viewState.zoom])

  const handleNodeClick = useCallback((nodeId: string) => {
    if (canAllocateNode(nodeId, treeData, treeState)) {
      onAllocateNode(nodeId)
    }
  }, [treeData, treeState, onAllocateNode])

  const getNodeColor = (node: PassiveNode): string => {
    const isAllocated = (treeState.allocatedNodes[node.id] || 0) > 0
    const canAllocate = canAllocateNode(node.id, treeData, treeState)
    
    // Use archetype colors when available
    const archetypeColors = {
      'combat': { allocated: '#dc2626', available: '#b91c1c' }, // red
      'defensive': { allocated: '#2563eb', available: '#1d4ed8' }, // blue
      'utility': { allocated: '#16a34a', available: '#15803d' }, // green
      'magic': { allocated: '#7c3aed', available: '#6d28d9' }, // purple
      'mastery': { allocated: '#f59e0b', available: '#d97706' } // amber
    }
    
    if (node.archetype && archetypeColors[node.archetype as keyof typeof archetypeColors]) {
      const colors = archetypeColors[node.archetype as keyof typeof archetypeColors]
      if (isAllocated) return colors.allocated
      if (canAllocate) return colors.available
      return '#374151' // dark gray for unavailable
    }
    
    // Fallback to type-based colors
    if (isAllocated) {
      switch (node.type) {
        case 'travel': return '#4ade80' // green
        case 'small': return '#60a5fa' // blue
        case 'notable': return '#f59e0b' // amber
        default: return '#6b7280' // gray
      }
    } else if (canAllocate) {
      switch (node.type) {
        case 'travel': return '#22c55e' // darker green
        case 'small': return '#3b82f6' // darker blue
        case 'notable': return '#d97706' // darker amber
        default: return '#4b5563' // darker gray
      }
    } else {
      return '#374151' // dark gray for unavailable
    }
  }

  const getNodeSize = (node: PassiveNode): number => {
    switch (node.type) {
      case 'travel': return 8
      case 'small': return 12
      case 'notable': return 18
      default: return 10
    }
  }

  const renderArchetypeBackgrounds = () => {
    if (!treeData.archetypes) return null
    
    return treeData.archetypes.map(archetype => (
      <circle
        key={archetype.id}
        cx={archetype.position.x}
        cy={archetype.position.y}
        r={archetype.radius}
        fill={archetype.color}
        opacity="0.1"
        stroke={archetype.color}
        strokeWidth="2"
        strokeOpacity="0.3"
        pointerEvents="none"
      />
    ))
  }

  const renderArchetypeLabels = () => {
    if (!treeData.archetypes) return null
    
    return treeData.archetypes.map(archetype => (
      <g key={`label-${archetype.id}`}>
        <text
          x={archetype.position.x}
          y={archetype.position.y - archetype.radius + 20}
          textAnchor="middle"
          fill={archetype.color}
          fontSize="14"
          fontWeight="bold"
          pointerEvents="none"
        >
          {archetype.name}
        </text>
        <text
          x={archetype.position.x}
          y={archetype.position.y - archetype.radius + 35}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
          pointerEvents="none"
        >
          {archetype.description}
        </text>
      </g>
    ))
  }

  const renderConnections = () => {
    return Object.values(treeData.nodes).map(node => 
      node.connections.map(connectionId => {
        const connectedNode = treeData.nodes[connectionId]
        if (!connectedNode) return null
        
        const isAllocated = (treeState.allocatedNodes[node.id] || 0) > 0
        const isConnectedAllocated = (treeState.allocatedNodes[connectionId] || 0) > 0
        const strokeColor = (isAllocated && isConnectedAllocated) ? '#4ade80' : '#6b7280'
        
        return (
          <line
            key={`${node.id}-${connectionId}`}
            x1={node.position.x}
            y1={node.position.y}
            x2={connectedNode.position.x}
            y2={connectedNode.position.y}
            stroke={strokeColor}
            strokeWidth="2"
            opacity="0.6"
          />
        )
      })
    ).flat().filter(Boolean)
  }

  const renderNodes = () => {
    return Object.values(treeData.nodes).map(node => {
      const isAllocated = (treeState.allocatedNodes[node.id] || 0) > 0
      const canAllocate = canAllocateNode(node.id, treeData, treeState)
      const nodeSize = getNodeSize(node)
      
      return (
        <g key={node.id}>
          <circle
            cx={node.position.x}
            cy={node.position.y}
            r={nodeSize}
            fill={getNodeColor(node)}
            stroke={hoveredNode === node.id ? '#ffffff' : '#000000'}
            strokeWidth={hoveredNode === node.id ? '3' : '1'}
            style={{ 
              cursor: canAllocate ? 'pointer' : 'default',
              filter: isAllocated ? 'brightness(1.2)' : 'none'
            }}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          />
          {node.type === 'notable' && (
            <circle
              cx={node.position.x}
              cy={node.position.y}
              r={nodeSize - 4}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.8"
              pointerEvents="none"
            />
          )}
        </g>
      )
    })
  }

  const renderTooltip = () => {
    if (!hoveredNode) return null
    
    const node = treeData.nodes[hoveredNode]
    if (!node) return null
    
    const isAllocated = (treeState.allocatedNodes[node.id] || 0) > 0
    const canAllocate = canAllocateNode(node.id, treeData, treeState)
    
    return (
      <div className="absolute top-4 left-4 bg-gray-900 border border-gray-600 rounded-lg p-4 max-w-sm z-50">
        <div className="text-white">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg">{node.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              node.type === 'travel' ? 'bg-green-600' :
              node.type === 'small' ? 'bg-blue-600' :
              'bg-amber-600'
            }`}>
              {node.type}
            </span>
            {node.archetype && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                node.archetype === 'combat' ? 'bg-red-600' :
                node.archetype === 'defensive' ? 'bg-blue-600' :
                node.archetype === 'utility' ? 'bg-green-600' :
                node.archetype === 'magic' ? 'bg-purple-600' :
                'bg-amber-600'
              }`}>
                {node.archetype}
              </span>
            )}
          </div>
          <p className="text-gray-300 mb-2">{node.description}</p>
          
          {/* Skill Modifiers */}
          {node.skillModifiers && node.skillModifiers.length > 0 && (
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-cyan-400 mb-1">Special Effects:</h4>
              {node.skillModifiers.map((modifier, index) => (
                <div key={index} className="text-xs text-cyan-300">
                  • {modifier.skillId}: {modifier.property} {modifier.type === 'additive' ? '+' : '×'}{modifier.value}
                </div>
              ))}
            </div>
          )}
          
          <div className="text-sm">
            <div className="text-yellow-400">Cost: {node.cost} points</div>
            {isAllocated && (
              <div className="text-green-400">✓ Allocated</div>
            )}
            {!isAllocated && canAllocate && (
              <div className="text-blue-400">Available</div>
            )}
            {!isAllocated && !canAllocate && (
              <div className="text-red-400">Requirements not met</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
      <div className="bg-gray-800 rounded-lg w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white">Passive Skill Tree</h2>
          <div className="flex items-center gap-4">
            <span className="text-white">Available Points: {availablePoints}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 relative overflow-hidden bg-gray-900">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ userSelect: 'none' }}
          >
            <g
              transform={`translate(${viewState.offsetX + 400}, ${viewState.offsetY + 300}) scale(${viewState.zoom})`}
            >
              {renderArchetypeBackgrounds()}
              {renderArchetypeLabels()}
              {renderConnections()}
              {renderNodes()}
            </g>
          </svg>
          
          {renderTooltip()}
          
          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
            >
              +
            </button>
            <button
              onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom * 0.8) }))}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
            >
              -
            </button>
            <button
              onClick={() => setViewState({ zoom: 1, offsetX: 0, offsetY: 0 })}
              className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-600 bg-gray-800">
          <div className="flex gap-6 text-sm text-white">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Travel Node</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Small Node</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
              <span>Notable Node</span>
            </div>
            <div className="text-gray-400 ml-4">
              Left click and drag to pan • Mouse wheel to zoom • Click nodes to allocate
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PassiveTreeModal