import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import { 
  DESIGN_TOKENS, 
  calculateTooltipPosition, 
  INFORMATION_PRIORITIES, 
  TooltipState,
  createInitialTooltipState,
  getColor,
  getFontSize,
  getSpacing
} from '../utils/designTokens'

// Global tooltip manager to ensure only one tooltip is visible at a time
class TooltipManager {
  private static instance: TooltipManager
  private activeTooltip: string | null = null
  private callbacks: Map<string, () => void> = new Map()

  static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager()
    }
    return TooltipManager.instance
  }

  registerTooltip(id: string, hideCallback: () => void) {
    this.callbacks.set(id, hideCallback)
  }

  unregisterTooltip(id: string) {
    this.callbacks.delete(id)
    if (this.activeTooltip === id) {
      this.activeTooltip = null
    }
  }

  showTooltip(id: string) {
    // Hide any currently active tooltip
    if (this.activeTooltip && this.activeTooltip !== id) {
      const hideCallback = this.callbacks.get(this.activeTooltip)
      if (hideCallback) {
        hideCallback()
      }
    }
    this.activeTooltip = id
  }

  hideTooltip(id: string) {
    if (this.activeTooltip === id) {
      this.activeTooltip = null
    }
  }
}

interface EnhancedTooltipProps {
  children: React.ReactNode
  item?: any
  content?: any
  type: 'equipment' | 'skillGem' | 'stone' | 'generic'
  delay?: number
  disabled?: boolean
  className?: string
  maxWidth?: number
  renderContent?: (content: any, level: string) => React.ReactNode
}

export const EnhancedTooltip = memo(function EnhancedTooltip({
  children,
  content,
  type,
  delay = 200,
  disabled = false,
  className = '',
  maxWidth = 400,
  renderContent
}: EnhancedTooltipProps) {
  const [tooltipState, setTooltipState] = useState<TooltipState>(createInitialTooltipState())
  const [informationLevel, setInformationLevel] = useState<'quick' | 'detailed' | 'comparison' | 'advanced'>('quick')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | undefined>()
  const holdTimeoutRef = useRef<number | undefined>()
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`)
  const manager = TooltipManager.getInstance()

  useEffect(() => {
    const id = tooltipId.current
    manager.registerTooltip(id, () => {
      setTooltipState(prev => ({ ...prev, isVisible: false }))
    })

    return () => {
      manager.unregisterTooltip(id)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
    }
  }, [manager])

  const showTooltip = useCallback((event: React.MouseEvent, level: 'quick' | 'detailed' = 'quick') => {
    if (disabled || !content) return

    const rect = tooltipRef.current?.getBoundingClientRect()
    const tooltipWidth = rect?.width || maxWidth
    const tooltipHeight = rect?.height || 300

    const position = calculateTooltipPosition(
      event.clientX,
      event.clientY,
      tooltipWidth,
      tooltipHeight
    )

    manager.showTooltip(tooltipId.current)
    setInformationLevel(level)
    setTooltipState({
      isVisible: true,
      position,
      content,
      type,
      level,
      isPersistent: false
    })
  }, [disabled, content, type, maxWidth, manager])

  const hideTooltip = useCallback(() => {
    if (tooltipState.isPersistent) return
    
    manager.hideTooltip(tooltipId.current)
    setTooltipState(prev => ({ ...prev, isVisible: false }))
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
  }, [tooltipState.isPersistent, manager])

  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    if (disabled) return

    timeoutRef.current = setTimeout(() => {
      showTooltip(event, 'quick')
      
      // Set up timer for detailed view
      holdTimeoutRef.current = setTimeout(() => {
        showTooltip(event, 'detailed')
      }, 1000)
    }, delay)
  }, [disabled, delay, showTooltip])

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
    hideTooltip()
  }, [hideTooltip])

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    if (disabled) return

    // Toggle persistent mode
    if (tooltipState.isVisible && tooltipState.isPersistent) {
      hideTooltip()
    } else {
      showTooltip(event, 'detailed')
      setTooltipState(prev => ({ ...prev, isPersistent: true }))
    }
  }, [disabled, tooltipState.isVisible, tooltipState.isPersistent, showTooltip, hideTooltip])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && tooltipState.isVisible) {
      hideTooltip()
    }
  }, [tooltipState.isVisible, hideTooltip])

  const toggleInformationLevel = useCallback(() => {
    const levels: Array<'quick' | 'detailed' | 'comparison' | 'advanced'> = ['quick', 'detailed', 'comparison', 'advanced']
    const currentIndex = levels.indexOf(informationLevel)
    const nextLevel = levels[(currentIndex + 1) % levels.length]
    setInformationLevel(nextLevel)
  }, [informationLevel])

  const renderTooltipContent = () => {
    if (renderContent) {
      return renderContent(content, informationLevel)
    }

    const priorities = INFORMATION_PRIORITIES[type] || INFORMATION_PRIORITIES.equipment
    
    return (
      <div className="space-y-3">
        {/* Header with level indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
              {informationLevel}
            </span>
            {tooltipState.isPersistent && (
              <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">
                Pinned
              </span>
            )}
          </div>
          {tooltipState.isPersistent && (
            <button
              onClick={hideTooltip}
              className="text-gray-400 hover:text-white text-xl leading-none p-1 hover:bg-gray-700 rounded"
              title="Close tooltip"
            >
              ×
            </button>
          )}
        </div>

        {/* Content based on information level */}
        {informationLevel === 'quick' && (
          <QuickTooltipContent content={content} type={type} />
        )}
        
        {informationLevel === 'detailed' && (
          <DetailedTooltipContent content={content} type={type} />
        )}
        
        {informationLevel === 'comparison' && (
          <ComparisonTooltipContent content={content} type={type} />
        )}
        
        {informationLevel === 'advanced' && (
          <AdvancedTooltipContent content={content} type={type} />
        )}

        {/* Level toggle hint */}
        {tooltipState.isPersistent && (
          <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
            Click the level badge to cycle through information levels
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="inline-block"
        tabIndex={0}
      >
        {children}
      </div>

      {tooltipState.isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 bg-gray-900 border-2 border-gray-600 rounded-lg shadow-2xl transition-opacity duration-200 ${className}`}
          style={{
            left: tooltipState.position.x,
            top: tooltipState.position.y,
            maxWidth: `${maxWidth}px`,
            padding: getSpacing('md'),
            zIndex: DESIGN_TOKENS.components.tooltip.zIndex
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderTooltipContent()}
        </div>
      )}
    </>
  )
})

// Quick tooltip content (minimal information)
const QuickTooltipContent = memo(({ content, type }: { content: any; type: string }) => (
  <div className="space-y-1">
    <div className="font-bold text-lg" style={{ color: getColor('rarity', content.rarity || 'common') }}>
      {content.name || 'Unknown Item'}
    </div>
    <div className="text-sm text-gray-400">
      {content.type || content.category || type}
    </div>
    {content.level && (
      <div className="text-sm text-blue-400">Level {content.level}</div>
    )}
  </div>
))

// Detailed tooltip content (full information)
const DetailedTooltipContent = memo(({ content, type }: { content: any; type: string }) => (
  <div className="space-y-3">
    <QuickTooltipContent content={content} type={type} />
    
    {/* Stats section */}
    {content.baseStats && Object.keys(content.baseStats).length > 0 && (
      <div>
        <h4 className="text-blue-400 font-semibold text-sm mb-2">Stats:</h4>
        <div className="space-y-1">
          {Object.entries(content.baseStats).map(([stat, value]) => (
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

    {/* Description */}
    {content.description && (
      <div className="text-sm text-gray-300 italic">
        {content.description}
      </div>
    )}
  </div>
))

// Comparison tooltip content (vs equipped item)
const ComparisonTooltipContent = memo(({ content, type }: { content: any; type: string }) => (
  <div className="space-y-3">
    <DetailedTooltipContent content={content} type={type} />
    
    <div className="border-t border-gray-600 pt-2">
      <div className="text-yellow-400 text-sm font-semibold">
        Comparison vs Equipped
      </div>
      <div className="text-xs text-gray-400">
        Comparison functionality would be implemented here
      </div>
    </div>
  </div>
))

// Advanced tooltip content (calculations and metadata)
const AdvancedTooltipContent = memo(({ content, type }: { content: any; type: string }) => (
  <div className="space-y-3">
    <DetailedTooltipContent content={content} type={type} />
    
    <div className="border-t border-gray-600 pt-2">
      <div className="text-purple-400 text-sm font-semibold">
        Advanced Information
      </div>
      <div className="text-xs text-gray-400 space-y-1">
        <div>Item ID: {content.id || 'N/A'}</div>
        <div>Generated: {content.timestamp || 'Unknown'}</div>
        {content.seed && <div>Seed: {content.seed}</div>}
      </div>
    </div>
  </div>
))

export default EnhancedTooltip