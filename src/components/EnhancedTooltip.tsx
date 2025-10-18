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
  children?: React.ReactNode
  item?: any
  content?: any
  type: 'equipment' | 'skillGem' | 'stone' | 'generic'
  delay?: number
  disabled?: boolean
  className?: string
  maxWidth?: number
  renderContent?: (content: any, level: string) => React.ReactNode
  position?: { x: number; y: number }
  onClose?: () => void
}

export const EnhancedTooltip = memo(function EnhancedTooltip({
  children,
  content,
  type,
  delay = 200,
  disabled = false,
  className = '',
  maxWidth = 450,
  renderContent,
  position,
  onClose
}: EnhancedTooltipProps) {
  const [tooltipState, setTooltipState] = useState<TooltipState>(createInitialTooltipState())
  const [informationLevel, setInformationLevel] = useState<'quick' | 'detailed' | 'comparison' | 'advanced'>('detailed')
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

  const showTooltip = useCallback((event: React.MouseEvent, level: 'quick' | 'detailed' = 'detailed') => {
    if (disabled || !content) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = window.setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect()
      const pos = calculateTooltipPosition(
        rect.right + 10,
        rect.top,
        maxWidth,
        200
      )

      setTooltipState({
        isVisible: true,
        position: pos,
        content,
        type: 'generic',
        level: level,
        isPersistent: false
      })
      setInformationLevel(level)
      manager.showTooltip(tooltipId.current)
    }, delay)
  }, [disabled, content, delay, maxWidth, manager])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
    
    setTooltipState(prev => ({ ...prev, isVisible: false }))
    manager.hideTooltip(tooltipId.current)
    if (onClose) onClose()
  }, [manager, onClose])

  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    showTooltip(event, 'detailed')
  }, [showTooltip])

  const handleMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  // If position is provided (for standalone tooltip), show it immediately
  useEffect(() => {
    if (position && content) {
      setTooltipState({
        isVisible: true,
        position,
        content,
        type: 'generic',
        level: 'detailed',
        isPersistent: false
      })
      setInformationLevel('detailed')
      manager.showTooltip(tooltipId.current)
    }
  }, [position, content, manager])

  const renderTooltipContent = () => {
    if (!tooltipState.content) return null

    if (renderContent) {
      return renderContent(tooltipState.content, informationLevel)
    }

    switch (informationLevel) {
      case 'quick':
        return <QuickTooltipContent content={tooltipState.content} type={type} />
      case 'detailed':
        return <DetailedTooltipContent content={tooltipState.content} type={type} />
      case 'comparison':
        return <ComparisonTooltipContent content={tooltipState.content} type={type} />
      case 'advanced':
        return <AdvancedTooltipContent content={tooltipState.content} type={type} />
      default:
        return <DetailedTooltipContent content={tooltipState.content} type={type} />
    }
  }

  // If no children provided, render as standalone tooltip
  if (!children) {
    return tooltipState.isVisible ? (
      <div
        ref={tooltipRef}
        className={`fixed z-50 pointer-events-none ${className}`}
        style={{
          left: tooltipState.position.x,
          top: tooltipState.position.y,
          maxWidth: `${maxWidth}px`
        }}
      >
        <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl p-4 text-white">
          {renderTooltipContent()}
        </div>
      </div>
    ) : null
  }

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {tooltipState.isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 pointer-events-none ${className}`}
          style={{
            left: tooltipState.position.x,
            top: tooltipState.position.y,
            maxWidth: `${maxWidth}px`
          }}
        >
          <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl p-4 text-white">
            {renderTooltipContent()}
          </div>
        </div>
      )}
    </>
  )
})

// Helper function to get equipment icon
function getEquipmentIcon(type: string): string {
  const icons: Record<string, string> = {
    // Weapons
    sword: '⚔️', axe: '🪓', bow: '🏹', staff: '🔮', dagger: '🗡️', mace: '🔨', wand: '✨',
    // Armor
    helm: '⛑️', chest: '🦺', legs: '👖', boots: '🥾', gloves: '🧤', shield: '🛡️',
    // Accessories
    ring: '💍', amulet: '📿', belt: '🔗'
  }
  return icons[type] || '❓'
}

// Helper function to format stat names
function formatStatName(stat: string): string {
  const statNames: Record<string, string> = {
    damage: 'Damage',
    armor: 'Armor',
    health: 'Health',
    mana: 'Mana',
    critChance: 'Critical Chance',
    critMultiplier: 'Critical Multiplier',
    dodgeChance: 'Dodge Chance',
    attackSpeed: 'Attack Speed',
    strength: 'Strength',
    dexterity: 'Dexterity',
    intelligence: 'Intelligence',
    vitality: 'Vitality',
    luck: 'Luck',
    fireResistance: 'Fire Resistance',
    iceResistance: 'Ice Resistance',
    lightningResistance: 'Lightning Resistance',
    poisonResistance: 'Poison Resistance',
    armorPenetration: 'Armor Penetration',
    damageMultiplier: 'Damage Multiplier',
    stunChance: 'Stun Chance',
    damageReduction: 'Damage Reduction',
    movementSpeed: 'Movement Speed',
    reflectDamage: 'Reflect Damage',
    doubleDropChance: 'Double Drop Chance',
    cleaveChance: 'Cleave Chance',
    spellResistance: 'Spell Resistance',
    stunResistance: 'Stun Resistance',
    cooldownReduction: 'Cooldown Reduction',
    goldFind: 'Gold Find',
    magicFind: 'Magic Find'
  }
  return statNames[stat] || stat.charAt(0).toUpperCase() + stat.slice(1)
}

// Helper function to format stat values
function formatStatValue(stat: string, value: number): string {
  const percentageStats = [
    'critChance', 'critMultiplier', 'dodgeChance', 'attackSpeed',
    'fireResistance', 'iceResistance', 'lightningResistance', 'poisonResistance',
    'armorPenetration', 'damageMultiplier', 'stunChance', 'damageReduction',
    'movementSpeed', 'reflectDamage', 'doubleDropChance', 'cleaveChance',
    'spellResistance', 'stunResistance', 'cooldownReduction', 'goldFind', 'magicFind'
  ]
  
  if (percentageStats.includes(stat)) {
    return `${(value * 100).toFixed(1)}%`
  }
  
  return value.toString()
}

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

const DetailedTooltipContent = memo(({ content, type }: { content: any; type: string }) => (
  <div className="space-y-3 min-w-[300px]">
    {/* Header with icon and basic info */}
    <div className="flex items-center gap-3 border-b border-gray-700 pb-2">
      <div className="text-3xl">
        {getEquipmentIcon(content.type)}
      </div>
      <div className="flex-1">
        <div className="font-bold text-lg" style={{ color: getColor('rarity', content.rarity || 'common') }}>
          {content.name || 'Unknown Item'}
        </div>
        <div className="text-sm text-gray-400">
          {formatStatName(content.type || content.category || type)}
        </div>
        {content.level && (
          <div className="text-sm text-blue-400">Level {content.level}</div>
        )}
        {content.equipped && (
          <div className="text-xs bg-green-600 text-white px-2 py-0.5 rounded mt-1 inline-block">
            Equipped
          </div>
        )}
      </div>
    </div>

    {/* Base Stats */}
    {content.baseStats && Object.keys(content.baseStats).length > 0 && (
      <div>
        <h4 className="text-blue-400 font-semibold text-sm mb-2">Base Stats:</h4>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(content.baseStats).map(([stat, value]) => (
            typeof value === 'number' && value > 0 && (
              <div key={stat} className="flex justify-between text-sm">
                <span className="text-gray-300">{formatStatName(stat)}:</span>
                <span className="text-green-400">+{formatStatValue(stat, value)}</span>
              </div>
            )
          ))}
        </div>
      </div>
    )}

    {/* Affixes */}
    {content.affixes && content.affixes.length > 0 && (
      <div>
        <h4 className="text-purple-400 font-semibold text-sm mb-2">Affixes:</h4>
        <div className="space-y-1">
          {content.affixes.map((affix: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-300">{formatStatName(affix.stat)}:</span>
              <span className="text-purple-400">+{formatStatValue(affix.stat, affix.value)}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Requirements */}
    {content.requirements && Object.keys(content.requirements).length > 0 && (
      <div>
        <h4 className="text-red-400 font-semibold text-sm mb-2">Requirements:</h4>
        <div className="space-y-1">
          {Object.entries(content.requirements).map(([attr, required]) => (
            <div key={attr} className="flex justify-between text-sm">
              <span className="text-gray-300">{formatStatName(attr)}:</span>
              <span className="text-red-400">{String(required)}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Damage Type */}
    {content.damageType && (
      <div>
        <h4 className="text-orange-400 font-semibold text-sm mb-2">Damage Type:</h4>
        <div className="text-sm text-orange-400 capitalize">
          {content.damageType}
        </div>
      </div>
    )}

    {/* Sockets */}
    {content.sockets && content.sockets.maxSockets > 0 && (
      <div>
        <h4 className="text-cyan-400 font-semibold text-sm mb-2">Sockets:</h4>
        <div className="flex gap-1">
          {Array.from({ length: content.sockets.maxSockets }).map((_, index) => (
            <div
              key={index}
              className={`w-6 h-6 border-2 rounded ${
                content.sockets.stones[index] 
                  ? 'border-cyan-400 bg-cyan-400/20' 
                  : 'border-gray-600 bg-gray-800'
              }`}
              title={content.sockets.stones[index] ? 'Socket filled' : 'Empty socket'}
            >
              {content.sockets.stones[index] && (
                <div className="w-full h-full flex items-center justify-center text-xs">💎</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Value */}
    {content.value && (
      <div className="border-t border-gray-700 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Value:</span>
          <span className="text-yellow-400">{content.value.toFixed(2)} 💰</span>
        </div>
      </div>
    )}

    {/* Description */}
    {content.description && (
      <div className="text-sm text-gray-300 italic border-t border-gray-700 pt-2">
        {content.description}
      </div>
    )}
  </div>
))

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