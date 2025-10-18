import React, { createContext, useContext, useEffect, useReducer, ReactNode, useMemo, useCallback } from 'react'
import { Player, defaultPlayer, calculatePlayerStats } from './player'

// Memoization cache for player stats calculation
const playerStatsCache = new Map<string, { player: Player; timestamp: number }>()
const CACHE_DURATION = 1000 // 1 second cache duration

// Optimized player stats calculation with memoization
function calculatePlayerStatsMemoized(player: Player): Player {
  // Create a cache key based on critical player properties
  const cacheKey = JSON.stringify({
    level: player.level,
    equipment: player.equipment,
    skillGems: player.skillGems?.map(s => ({ id: s.id, level: s.level, isEquipped: s.isEquipped })),
    supportGems: player.supportGems?.map(s => ({ id: s.id, level: s.level })),
    passiveTreeState: player.passiveTreeState,
    stones: player.stones?.map(s => ({ id: s.id, type: s.type, level: s.level, rarity: s.rarity }))
  })
  
  const now = Date.now()
  const cached = playerStatsCache.get(cacheKey)
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.player
  }
  
  // Calculate stats and cache the result
  const calculatedPlayer = calculatePlayerStats(player)
  playerStatsCache.set(cacheKey, { player: calculatedPlayer, timestamp: now })
  
  // Clean old cache entries (keep cache size manageable)
  if (playerStatsCache.size > 10) {
    const oldestKey = Array.from(playerStatsCache.keys())[0]
    playerStatsCache.delete(oldestKey)
  }
  
  return calculatedPlayer
}
import { Enemy, EnemyType, spawnEnemyForLevel } from './enemy'
import { simulateCombatTick } from './combat'
import { generateLoot } from './loot'
import { loadSave, saveState } from './save'
import { Equipment, EquipmentSlot } from './equipment'
import { 
  unlockSkillGem, 
  unlockSupportGem, 
  levelUpSkillGem, 
  levelUpSupportGem, 
  equipSkillToBar, 
  unequipSkillFromBar, 
  attachSupportGem, 
  detachSupportGem 
} from './skillManager'
import { 
  createDefaultSkillBar, 
  createDefaultSkillGem, 
  createDefaultSupportGem, 
  MAIN_SKILL_GEMS, 
  SUPPORT_GEMS,
  getScaledRange,
  calculateSkillDamageWithStats,
  SkillGem
} from './skillGems'

import { allocateNode } from './passiveTree'
import { testStoneStatsIntegration } from './player'
import { migratePlayerStones, forceMigrateAllStones } from './stoneGenerator'

// Type definitions
interface GameState {
  player: Player
  enemies: Enemy[]
  inventory: any[] // Keep as any[] for now since loot system returns mixed types
  log: string[]
  skills: Record<string, number>
  activeCombinations: any[]
  activeSynergies: any[]
  autoCombat?: boolean
  playerPosition?: { x: number; y: number }
  enemyPositions?: Record<string, { x: number; y: number }>

  lastStatsUpdate: number // Track when stats were last calculated
}

type GameAction = 
  | { type: 'LOAD'; payload?: any }
  | { type: 'SPAWN'; payload?: { level?: number; kind?: EnemyType } }
  | { type: 'TICK'; payload?: { enemyId: string } }
  | { type: 'REMOVE'; payload: string }
  | { type: 'EQUIP'; payload: string }
  | { type: 'UNEQUIP'; payload: string }
  | { type: 'DISCARD'; payload: string }
  | { type: 'SELL_ALL' }

  | { type: 'TOGGLE_AUTO' }
  | { type: 'RESET' }
  | { type: 'LOG'; payload: string }
  | { type: 'UNLOCK_SKILL_GEM'; payload: string }
  | { type: 'UNLOCK_SUPPORT_GEM'; payload: string }
  | { type: 'LEVEL_UP_SKILL_GEM'; payload: string }
  | { type: 'LEVEL_UP_SUPPORT_GEM'; payload: string }
  | { type: 'EQUIP_SKILL_TO_BAR'; payload: { skillId: string; slotIndex: number } }
  | { type: 'UNEQUIP_SKILL_FROM_BAR'; payload: number }
  | { type: 'ATTACH_SUPPORT_GEM'; payload: { skillId: string; supportId: string } }
  | { type: 'DETACH_SUPPORT_GEM'; payload: { skillId: string; supportId: string } }
  | { type: 'USE_SKILL'; payload: string }
  | { type: 'UPDATE_ENEMY_POSITIONS'; payload: Record<string, { x: number; y: number }> }
  | { type: 'UPDATE_PLAYER_POSITION'; payload: { x: number; y: number } }
  | { type: 'CHANNEL_WHIRLWIND' }
  | { type: 'AUTO_SKILLS' }
  | { type: 'MANA_REGEN' }
  | { type: 'ALLOCATE_PASSIVE_NODE'; payload: string }
  | { type: 'ADD_STONE'; payload: any }
  | { type: 'REMOVE_STONE'; payload: string }
  | { type: 'UPDATE_EQUIPMENT'; payload: { slot: string; equipment: Equipment } }
  | { type: 'FORCE_MIGRATE_STONES' }
  | { type: 'UPDATE_CHARACTER_MODEL'; payload: string }

interface GameActions {
  spawnEnemy: (level?: number, kind?: EnemyType) => void
  simulateTick: (enemyId: string) => void
  removeEnemy: (id: string) => void
  equipItem: (id: string) => void
  discardItem: (id: string) => void
  sellAll: () => void

  resetAll: () => void
  log: (message: string) => void
  
  // Skill Gem Management
  unlockSkillGem: (skillId: string) => void
  unlockSupportGem: (supportId: string) => void
  levelUpSkillGem: (skillId: string) => void
  levelUpSupportGem: (supportId: string) => void
  equipSkillToBar: (skillId: string, slotIndex: number) => void
  unequipSkillFromBar: (slotIndex: number) => void
  attachSupportGem: (skillId: string, supportId: string) => void
  detachSupportGem: (skillId: string, supportId: string) => void
  
  // Skill Execution
  useSkill: (skillId: string) => void
  
  // Position updates
  updateEnemyPositions: (positions: Record<string, { x: number; y: number }>) => void
  updatePlayerPosition: (position: { x: number; y: number }) => void
  
  // Passive Tree Management
  allocatePassiveNode: (nodeId: string) => void
  
  // Stone Management
  addStone: (stone: any) => void
  removeStone: (stoneId: string) => void
  forceMigrateStones: () => void
  
  // Character Model Management
  updateCharacterModel: (characterModel: string) => void
}

interface GameContextType {
  state: GameState
  actions: GameActions
  dispatch: React.Dispatch<GameAction>
}

interface GameProviderProps {
  children: ReactNode
}

const initialState: GameState = {
  player: calculatePlayerStatsMemoized(defaultPlayer()),
  enemies: [spawnEnemyForLevel(1)],
  inventory: [],
  log: [],
  skills: {},
  activeCombinations: [],
  activeSynergies: [],

  lastStatsUpdate: Date.now(),
  autoCombat: true // Enable auto-combat by default for testing
}



// Helper function to preserve equipped items during reset
function preserveEquippedItems(currentPlayer: Player): Partial<Record<EquipmentSlot, Equipment>> {
  // Return a copy of the current player's equipped items
  const preservedEquipment: Partial<Record<EquipmentSlot, Equipment>> = {}
  
  if (currentPlayer.equipment) {
    // Copy all equipped items
    Object.entries(currentPlayer.equipment).forEach(([slot, equipment]) => {
      if (equipment) {
        preservedEquipment[slot as EquipmentSlot] = { ...equipment }
      }
    })
  }
  
  return preservedEquipment
}

// Helper function to check if stats need recalculation
function needsStatsUpdate(state: GameState, action: GameAction): boolean {
  const statsUpdateActions = ['LOAD', 'EQUIP', 'UNEQUIP', 'SELL_ALL', 'UNLOCK_SKILL_GEM', 'UNLOCK_SUPPORT_GEM', 'LEVEL_UP_SKILL_GEM', 'LEVEL_UP_SUPPORT_GEM', 'EQUIP_SKILL_TO_BAR', 'UNEQUIP_SKILL_FROM_BAR', 'ATTACH_SUPPORT_GEM', 'DETACH_SUPPORT_GEM']
  return statsUpdateActions.includes(action.type)
}

function reducer(state: GameState, action: GameAction): GameState {
  switch(action.type) {
    case 'LOAD': {
      const payload = action.payload || {}
      // Ensure player data is valid before loading
      if (payload.player && typeof payload.player === 'object') {
        // Ensure critical properties exist
        if (typeof payload.player.gold !== 'number') {
          payload.player.gold = 0
        }
        if (!payload.player.equipment || typeof payload.player.equipment !== 'object') {
          payload.player.equipment = {}
        }
        // Migrate skillBar if missing (for old saves)
        // More robust skillBar validation - only reset if truly missing or corrupted
        if (!payload.player.skillBar) {
          payload.player.skillBar = createDefaultSkillBar()
        } else if (!payload.player.skillBar.slots) {
          payload.player.skillBar.slots = createDefaultSkillBar().slots
        } else if (!Array.isArray(payload.player.skillBar.slots)) {
          payload.player.skillBar.slots = createDefaultSkillBar().slots
        } else if (payload.player.skillBar.slots.length !== 6) {
          // Preserve existing skills but ensure we have exactly 6 slots
          const existingSlots = [...payload.player.skillBar.slots.slice(0, 6)]
          while (existingSlots.length < 6) {
            existingSlots.push(null)
          }
          payload.player.skillBar.slots = existingSlots
        }
        
        // Ensure maxSlots is set correctly
        if (!payload.player.skillBar.maxSlots) {
          payload.player.skillBar.maxSlots = 6
        }
        
        // Sync skillBar with skillGems to ensure equipped skills are properly referenced
        if (payload.player.skillGems && Array.isArray(payload.player.skillGems)) {
          payload.player.skillBar.slots = payload.player.skillBar.slots.map((slotSkill: SkillGem | null) => {
            if (slotSkill && slotSkill.id) {
              // Find the corresponding skill in skillGems array
              const actualSkill = payload.player.skillGems.find((skill: SkillGem) => skill.id === slotSkill.id)
              if (actualSkill && actualSkill.isEquipped) {
                return actualSkill // Use the actual skill reference
              }
            }
            return slotSkill
          })
        }
        // Ensure skillGems and supportGems exist
        if (!Array.isArray(payload.player.skillGems)) {
          payload.player.skillGems = MAIN_SKILL_GEMS.map(template => createDefaultSkillGem(template))
        }
        if (!Array.isArray(payload.player.supportGems)) {
          payload.player.supportGems = SUPPORT_GEMS.map(template => createDefaultSupportGem(template))
        }
        // Ensure stones array exists (for backward compatibility)
        if (!Array.isArray(payload.player.stones)) {
          payload.player.stones = []
        } else {
          // Migrate stone IDs to ensure uniqueness
          payload.player.stones = migratePlayerStones(payload.player.stones)
        }
        // Recalculate player stats to ensure consistency
        payload.player = calculatePlayerStatsMemoized(payload.player)
      }
      return { ...state, ...payload, lastStatsUpdate: Date.now() }
    }
    case 'SPAWN': {
      const level = action.payload?.level ?? Math.max(1, state.player.level + (Math.random() > 0.5 ? 1 : 0))
      const kind = action.payload?.kind
      const enemy = spawnEnemyForLevel(level, kind)
      const enemies = [...state.enemies, enemy].slice(0,25)
      const newLog = [`Spawned ${enemy.name}`, ...state.log].slice(0,200)
      saveState({ player: state.player, inventory: state.inventory, enemies, skills: state.skills })
      return { ...state, enemies, log: newLog }
    }
    case 'TICK': {
      const enemyId = action.payload?.enemyId
      const enemies = [...state.enemies]
      const targetIndex = enemies.findIndex(e => e.id === enemyId)
      if (targetIndex === -1) return state
      const target = { ...enemies[targetIndex] }
      
      // Automatic Whirlwind activation - always active during combat
      let updatedPlayer = { ...state.player }
      let skillLog: string[] = []
      
      // Initialize skill cooldowns if not present
      if (!updatedPlayer.skillCooldowns) {
        updatedPlayer.skillCooldowns = {}
      }
      
      const currentTime = Date.now()
      const whirlwindSkill = updatedPlayer.skillBar.slots.find((s: any) => s?.id === 'whirlwind')
      
      // Automatic Whirlwind activation every tick (continuous channeling behavior)
      if (whirlwindSkill && whirlwindSkill.isUnlocked) {
        const lastUsed = updatedPlayer.skillCooldowns['whirlwind'] || 0
        const cooldownTime = whirlwindSkill.scaling.baseCooldown || whirlwindSkill.cooldown
        
        // With zero cooldown, Whirlwind can activate every tick for true channeling
        if (cooldownTime === 0 || currentTime - lastUsed >= cooldownTime) {
          // Activate Whirlwind automatically
          updatedPlayer.skillCooldowns['whirlwind'] = currentTime
          
          // Calculate Whirlwind area of effect
          const whirlwindArea = whirlwindSkill.scaling.baseArea! + (whirlwindSkill.level - 1) * whirlwindSkill.scaling.areaPerLevel!
          const whirlwindRange = whirlwindArea * 30 // Convert area to pixel range (base area 2.5 = ~75 pixel range)
          
          // Apply Whirlwind effects only to enemies within range
          skillLog.push(`ANIM_SKILL|whirlwind|${currentTime}|3000`)
          const damage = Math.floor(whirlwindSkill.scaling.baseDamage! + (whirlwindSkill.level - 1) * whirlwindSkill.scaling.damagePerLevel!)
          
          // Player position (use actual position from state, fallback to default if not set)
          const playerPosition = state.playerPosition || { x: 150, y: 300 }
          
          let enemiesHit = 0
          enemies.forEach(enemy => {
            if (enemy.hp > 0 && enemy.position) {
              // Calculate distance between player and enemy
              const distance = Math.hypot(
                enemy.position.x - playerPosition.x,
                enemy.position.y - playerPosition.y
              )
              
              const isInRange = distance <= whirlwindRange
              
              if (isInRange) {
                enemy.hp = Math.max(0, enemy.hp - damage)
                skillLog.push(`Whirlwind spins through ${enemy.name} for ${damage} damage! (distance: ${Math.round(distance)})`)
                enemiesHit++
              }
            }
          })
          
          skillLog.push(`🌪️ Whirlwind channels continuously! (${enemiesHit} enemies hit, range: ${Math.round(whirlwindRange)})`)
        }
      }
      
      // Basic attacks disabled - combat now relies solely on skills
      // Auto-skill triggering is now handled by a separate AUTO_SKILLS action
      
      // Skip basic attack logic - no simulateCombatTick call
      // const res = simulateCombatTick(updatedPlayer, target)
      const newPlayer = { ...updatedPlayer }
      let newEnemies = [...enemies]
      // newEnemies[targetIndex] = res.enemy
      let newLog = [...skillLog, ...state.log].slice(0,200)

      // Basic attack animations disabled
      // if (res.didPlayerHit) {
      //   const w = newPlayer.equipped ?? { type: 'melee', rarity: 'Common' }
      //   newLog.unshift(`ANIM_PLAYER|${target.id}|${w.type}|${w.rarity}|${res.crit ? 'crit' : 'hit'}|${res.damage}`)
      // }

      // if (res.crit && res.didPlayerHit) {
      //   newLog.unshift(`🔥 Critical Hit! -${res.damage} to ${target.name}`)
      // }

      // Check if any enemies were defeated by skills (like Whirlwind)
      const defeatedEnemies = newEnemies.filter(e => e.hp <= 0)
      if (defeatedEnemies.length > 0) {
        // Generate loot and XP for all defeated enemies
        let totalLoot: any[] = []
        let totalXpGain = 0
        
        defeatedEnemies.forEach(enemy => {
          const lootArray = generateLoot(enemy.level, enemy.isBoss)
          totalLoot = [...totalLoot, ...lootArray]
          
          // Bosses give more XP
          const xpGain = enemy.isBoss ? Math.floor(enemy.level * 12) : Math.max(1, Math.floor(enemy.level * 4))
          totalXpGain += xpGain
        })
        
        // Mark defeated enemies as dying instead of immediately removing them
        const currentTime = Date.now()
        newEnemies = newEnemies.map(enemy => {
          if (enemy.hp <= 0 && enemy.state !== 'dying') {
            return { ...enemy, state: 'dying' as const, alpha: 1, deathTime: currentTime }
          }
          return enemy
        })
        newPlayer.xp += totalXpGain
        
        // Implement inventory limit with automatic gold conversion
        const maxInventoryItems = 10 * 4 // 10 pages * 4 items per page (list view)
        let newInventory = [...state.inventory]
        
        // Process all loot items
        let totalGoldFromLoot = 0
        let itemsAdded = 0
        let itemsConverted = 0
        
        totalLoot.forEach(loot => {
          totalGoldFromLoot += loot.value
          
          if (newInventory.length >= maxInventoryItems) {
            // Convert excess items to gold automatically
            newPlayer.gold += loot.value
            itemsConverted++
          } else {
            // Add item to inventory normally
            newInventory.push(loot)
            itemsAdded++
          }
        })
        
        // Create appropriate loot messages
        const bossesDefeated = defeatedEnemies.filter(e => e.isBoss).length
        if (bossesDefeated > 0) {
          newLog.unshift(`🎉 ${bossesDefeated} BOSS(ES) DEFEATED! ${totalLoot.length} Epic Items Found!`)
        } else {
          newLog.unshift(`${defeatedEnemies.length} enemies defeated! ${totalLoot.length} items dropped`)
        }
        
        if (itemsAdded > 0) {
          newLog.unshift(`📦 ${itemsAdded} items added to inventory`)
        }
        if (itemsConverted > 0) {
          newLog.unshift(`💰 Inventory full! ${itemsConverted} items converted to ${itemsConverted * Math.floor(totalGoldFromLoot / totalLoot.length)} gold`)
        }
        
        // level up loop
        while (newPlayer.xp >= newPlayer.nextLevelXp) {
          newPlayer.xp -= newPlayer.nextLevelXp
          newPlayer.level += 1
          newPlayer.skillPoints += 1
          newPlayer.passiveTreeState.availablePoints += 1 // Add 1 passive skill point per level
          newPlayer.maxHp += 8
          newPlayer.hp = newPlayer.maxHp
          newPlayer.nextLevelXp = Math.floor(newPlayer.nextLevelXp * 1.25)
          newLog.unshift(`Leveled up! Now level ${newPlayer.level}`)
        }

        saveState({ player: newPlayer, inventory: newInventory, enemies: newEnemies, skills: state.skills })
        return { ...state, player: newPlayer, enemies: newEnemies, inventory: newInventory, log: newLog, skills: state.skills }
      }

      saveState({ player: newPlayer, inventory: state.inventory, enemies: newEnemies, skills: state.skills })
      return { ...state, player: newPlayer, enemies: newEnemies, log: newLog, skills: state.skills }
    }
    case 'REMOVE': {
      const id = action.payload
      const enemies = state.enemies.filter(e => e.id !== id)
      saveState({ player: state.player, inventory: state.inventory, enemies, skills: state.skills })
      return { ...state, enemies }
    }
    case 'EQUIP': {
      const itemId = action.payload
      const item = state.inventory.find(i => i.id === itemId)
      if (!item) return state
      
      // Handle new equipment system
      if (item.slot && item.category) {
        // Check if player can equip this item
        const canEquipItem = !item.requirements || Object.entries(item.requirements).every(([attr, req]) => {
          const playerAttr = state.player.attributes?.[attr as keyof typeof state.player.attributes] ?? 0
          return playerAttr >= (req as number)
        })
        
        if (!canEquipItem) {
          return state
        }
        
        // Equip the item in the appropriate slot
        const newEquipment = { ...state.player.equipment }
        newEquipment[item.slot as EquipmentSlot] = item
        
        const player = { ...state.player, equipment: newEquipment }
        const calculatedPlayer = calculatePlayerStatsMemoized(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer, lastStatsUpdate: Date.now() }
      } else {
        // Legacy equipment system fallback
        const player = { ...state.player, equipped: item }
        const calculatedPlayer = calculatePlayerStatsMemoized(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer, lastStatsUpdate: Date.now() }
      }
    }
    case 'UNEQUIP': {
      const slot = action.payload as EquipmentSlot
      if (!slot || !state.player.equipment?.[slot]) return state
      
      // Get the item being unequipped
      const unequippedItem = state.player.equipment[slot]
      
      // Remove the item from the equipment slot
      const newEquipment = { ...state.player.equipment }
      delete newEquipment[slot]
      
      // Add the unequipped item back to inventory
      const newInventory = [...state.inventory, unequippedItem]
      
      const player = { ...state.player, equipment: newEquipment }
      const calculatedPlayer = calculatePlayerStatsMemoized(player)
      saveState({ player: calculatedPlayer, inventory: newInventory, enemies: state.enemies, skills: state.skills })
      return { 
        ...state, 
        player: calculatedPlayer, 
        inventory: newInventory,
        lastStatsUpdate: Date.now(),
        log: [...state.log, `Unequipped ${unequippedItem.name} from ${slot} slot`]
      }
    }
    case 'DISCARD': {
      const id = action.payload
      const inv = state.inventory.filter(i => i.id !== id)
      saveState({ player: state.player, inventory: inv, enemies: state.enemies, skills: state.skills })
      return { ...state, inventory: inv }
    }
    case 'SELL_ALL': {
      // Get equipped item IDs to protect them from selling
      const equippedItemIds = new Set(Object.values(state.player.equipment).filter(Boolean).map(item => item!.id))
      
      // Filter out equipped items from inventory
      const itemsToSell = state.inventory.filter(item => !equippedItemIds.has(item.id))
      const itemsToKeep = state.inventory.filter(item => equippedItemIds.has(item.id))
      
      // Calculate total value of sellable items only
      const totalValue = itemsToSell.reduce((sum, item) => sum + (item.value || 0), 0)
      
      // Add gold to player and keep equipped items in inventory
      const player = { ...state.player, gold: (state.player.gold || 0) + totalValue }
      const calculatedPlayer = calculatePlayerStatsMemoized(player)
      
      const soldCount = itemsToSell.length
      const protectedCount = itemsToKeep.length
      
      saveState({ player: calculatedPlayer, inventory: itemsToKeep, enemies: state.enemies, skills: state.skills })
      return { 
        ...state, 
        player: calculatedPlayer, 
        inventory: itemsToKeep, 
        log: [
          `Sold ${soldCount} items for ${totalValue} gold${protectedCount > 0 ? ` (${protectedCount} equipped items protected)` : ''}`, 
          ...state.log
        ].slice(0, 200),
        lastStatsUpdate: Date.now()
      }
    }

    case 'TOGGLE_AUTO': {
      return { ...state, autoCombat: !state.autoCombat }
    }
    case 'RESET': {
      // Preserve equipped items before reset
      const preservedEquipment = preserveEquippedItems(state.player)
      
      // Create a fresh player with default stats
      const freshPlayer = defaultPlayer()
      
      // Restore the preserved equipment to the fresh player
      freshPlayer.equipment = preservedEquipment
      
      // Recalculate player stats with the preserved equipment
      const playerWithEquipment = calculatePlayerStatsMemoized(freshPlayer)
      
      saveState({ player: playerWithEquipment, inventory: [], enemies: [spawnEnemyForLevel(1)], skills: {} })
      return { 
        player: playerWithEquipment, 
        enemies: [spawnEnemyForLevel(1)], 
        inventory: [], 
        log: [`Progress reset! Equipped items preserved for testing.`, ...state.log].slice(0, 200), 
        skills: {},
        activeCombinations: [],
        activeSynergies: [],
        lastStatsUpdate: Date.now(),
        autoCombat: true,
        playerPosition: undefined, // Will be initialized by GameCanvas
        enemyPositions: undefined // Will be initialized by GameCanvas
      }
    }
    case 'LOG': {
      return { ...state, log: [action.payload, ...state.log].slice(0,200) }
    }
    
    // Skill Gem Management Cases
    case 'UNLOCK_SKILL_GEM': {
      const result = unlockSkillGem(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'UNLOCK_SUPPORT_GEM': {
      const result = unlockSupportGem(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'LEVEL_UP_SKILL_GEM': {
      const result = levelUpSkillGem(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'LEVEL_UP_SUPPORT_GEM': {
      const result = levelUpSupportGem(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'EQUIP_SKILL_TO_BAR': {
      const { skillId, slotIndex } = action.payload
      const result = equipSkillToBar(state.player, skillId, slotIndex)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'UNEQUIP_SKILL_FROM_BAR': {
      const result = unequipSkillFromBar(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'ATTACH_SUPPORT_GEM': {
      const { skillId, supportId } = action.payload
      const result = attachSupportGem(state.player, skillId, supportId)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'DETACH_SUPPORT_GEM': {
      const { skillId, supportId } = action.payload
      const result = detachSupportGem(state.player, skillId, supportId)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStatsMemoized(result.updatedPlayer)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      } else {
        return { 
          ...state, 
          log: [result.message, ...state.log].slice(0, 200) 
        }
      }
    }
    
    case 'USE_SKILL': {
      const skillId = action.payload
      const skill = state.player.skillGems.find(s => s.id === skillId && s.isEquipped)
      
      if (!skill) {
        return { 
          ...state, 
          log: [`Skill not found or not equipped`, ...state.log].slice(0, 200) 
        }
      }
      
      // For testing purposes, disable mana consumption
      const manaCost = 0 // skill.manaCost
      
      if (state.player.mana < manaCost) {
        return { 
          ...state, 
          log: [`Not enough mana to use ${skill.name}! (${manaCost} required, ${state.player.mana} available)`, ...state.log].slice(0, 200) 
        }
      }
      
      const updatedPlayer = { ...state.player, mana: Math.max(0, state.player.mana - manaCost) }
      let newLog = [`Used ${skill.name}!`, ...state.log]
      
      // Apply skill effects based on skill type
      if (skill.id === 'whirlwind') {
        // Whirlwind hits all nearby enemies
        newLog.unshift(`ANIM_SKILL|whirlwind|${Date.now()}|3000`) // 3 second duration
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        state.enemies.forEach(enemy => {
          if (enemy.hp > 0) {
            newLog.unshift(`ANIM_PLAYER|${enemy.id}|whirlwind|Unique|hit|${damage}`)
          }
        })
      } else if (skill.id === 'fireball') {
        // Fireball targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          newLog.unshift(`ANIM_SKILL|fireball|${nearestEnemy.id}|${Date.now()}`)
          const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|magic|Rare|hit|${damage}`)
        }
      } else if (skill.id === 'lightning_bolt') {
        // Lightning bolt targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          newLog.unshift(`ANIM_SKILL|lightning_bolt|${nearestEnemy.id}|${Date.now()}`)
          const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|magic|Magic|hit|${damage}`)
        }
      } else if (skill.id === 'power_strike') {
        // Power strike targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|melee|Unique|hit|${damage}`)
        }
      } else if (skill.id === 'ice_shard') {
        // Ice shard targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          newLog.unshift(`ANIM_SKILL|ice_shard|${nearestEnemy.id}|${Date.now()}`)
          const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|magic|Magic|hit|${damage}`)
        }
      } else if (skill.id === 'ground_slam') {
        // Ground slam hits all nearby enemies
        newLog.unshift(`ANIM_SKILL|ground_slam|${Date.now()}|800`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        state.enemies.forEach(enemy => {
          if (enemy.hp > 0) {
            newLog.unshift(`ANIM_PLAYER|${enemy.id}|melee|Rare|hit|${damage}`)
          }
        })
      } else if (skill.id === 'poison_arrow') {
        // Poison arrow targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          newLog.unshift(`ANIM_SKILL|poison_arrow|${nearestEnemy.id}|${Date.now()}`)
          const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|ranged|Magic|hit|${damage}`)
        }
      } else if (skill.id === 'chain_lightning') {
        // Chain lightning hits multiple enemies
        newLog.unshift(`ANIM_SKILL|chain_lightning|${Date.now()}|800`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        const aliveEnemies = state.enemies.filter(e => e.hp > 0).slice(0, 3) // Chain to up to 3 enemies
        aliveEnemies.forEach(enemy => {
          newLog.unshift(`ANIM_PLAYER|${enemy.id}|magic|Rare|hit|${damage}`)
        })
      } else if (skill.id === 'meteor') {
        // Meteor hits all enemies in area
        newLog.unshift(`ANIM_SKILL|meteor|${Date.now()}|1200`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        state.enemies.forEach(enemy => {
          if (enemy.hp > 0) {
            newLog.unshift(`ANIM_PLAYER|${enemy.id}|magic|Unique|hit|${damage}`)
          }
        })
      } else if (skill.id === 'blade_vortex') {
        // Blade vortex creates spinning blades around player
        newLog.unshift(`ANIM_SKILL|blade_vortex|${Date.now()}|5000`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        state.enemies.forEach(enemy => {
          if (enemy.hp > 0) {
            newLog.unshift(`ANIM_PLAYER|${enemy.id}|magic|Rare|hit|${damage}`)
          }
        })
      } else if (skill.id === 'frost_nova') {
        // Frost nova freezes and damages all nearby enemies
        newLog.unshift(`ANIM_SKILL|frost_nova|${Date.now()}|1000`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        state.enemies.forEach(enemy => {
          if (enemy.hp > 0) {
            newLog.unshift(`ANIM_PLAYER|${enemy.id}|magic|Magic|hit|${damage}`)
          }
        })
      } else if (skill.id === 'cleave') {
        // Cleave hits enemies in front of player
        newLog.unshift(`ANIM_SKILL|cleave|${Date.now()}|600`)
        const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
        const nearbyEnemies = state.enemies.filter(e => e.hp > 0).slice(0, 3) // Hit up to 3 enemies
        nearbyEnemies.forEach(enemy => {
          newLog.unshift(`ANIM_PLAYER|${enemy.id}|melee|Rare|hit|${damage}`)
        })
      } else if (skill.id === 'summon_skeletons') {
        // Summon skeletons creates minions
        newLog.unshift(`ANIM_SKILL|summon_skeletons|${Date.now()}|2000`)
        newLog.unshift(`Summoned skeleton minions!`)
      } else if (skill.id === 'heal') {
        // Heal restores player health
        const healAmount = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
        updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + healAmount)
        newLog.unshift(`ANIM_SKILL|heal|player|${Date.now()}`)
        newLog.unshift(`Healed for ${healAmount} HP!`)
      }
      
      const calculatedPlayer = calculatePlayerStatsMemoized(updatedPlayer)
      saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
      
      return { 
        ...state, 
        player: calculatedPlayer, 
        log: newLog.slice(0, 200) 
      }
    }
    
    case 'UPDATE_ENEMY_POSITIONS': {
      return { ...state, enemyPositions: action.payload }
    }
    
    case 'UPDATE_PLAYER_POSITION': {
      return { ...state, playerPosition: action.payload }
    }
    
    case 'UPDATE_CHARACTER_MODEL': {
      const updatedPlayer = { 
        ...state.player, 
        characterModel: action.payload 
      }
      return { 
        ...state, 
        player: calculatePlayerStatsMemoized(updatedPlayer),
        lastStatsUpdate: Date.now()
      }
    }
    
    case 'CHANNEL_WHIRLWIND': {
      // Continuous whirlwind channeling - independent of combat ticks
      const whirlwindSkill = state.player.skillBar.slots.find((s: any) => s?.id === 'whirlwind')
      
      if (!whirlwindSkill || !whirlwindSkill.isUnlocked) {
        return state
      }
      
      let updatedPlayer = { ...state.player }
      let skillLog: string[] = []
      
      // Initialize skill cooldowns if not present
      if (!updatedPlayer.skillCooldowns) {
        updatedPlayer.skillCooldowns = {}
      }
      
      const currentTime = Date.now()
      const lastUsed = updatedPlayer.skillCooldowns['whirlwind'] || 0
      const cooldownTime = whirlwindSkill.scaling.baseCooldown || whirlwindSkill.cooldown
      
      // With zero cooldown, Whirlwind can activate every channel tick for true continuous channeling
      if (cooldownTime === 0 || currentTime - lastUsed >= cooldownTime) {
        // Activate Whirlwind automatically
        updatedPlayer.skillCooldowns['whirlwind'] = currentTime
        
        // Calculate Whirlwind area of effect
        const whirlwindArea = whirlwindSkill.scaling.baseArea! + (whirlwindSkill.level - 1) * whirlwindSkill.scaling.areaPerLevel!
        const whirlwindRange = whirlwindArea * 30 // Convert area to pixel range (base area 2.5 = ~75 pixel range)
        
        // Apply Whirlwind effects only to enemies within range
        const damage = Math.floor(whirlwindSkill.scaling.baseDamage! + (whirlwindSkill.level - 1) * whirlwindSkill.scaling.damagePerLevel!)
        
        // Player position (use actual position from state, fallback to default if not set)
        const playerPosition = state.playerPosition || { x: 150, y: 300 }
        
        let enemiesHit = 0
        let updatedEnemies = [...state.enemies]
        
        updatedEnemies.forEach(enemy => {
          if (enemy.hp > 0 && enemy.position) {
            // Calculate distance between player and enemy
            const distance = Math.hypot(
              enemy.position.x - playerPosition.x,
              enemy.position.y - playerPosition.y
            )
            
            const isInRange = distance <= whirlwindRange
            
            if (isInRange) {
              enemy.hp = Math.max(0, enemy.hp - damage)
              enemiesHit++
            }
          }
        })
        
        // Only emit visual effects and logs if enemies were hit
        if (enemiesHit > 0) {
          skillLog.push(`ANIM_SKILL|whirlwind|${currentTime}|1000`) // 1 second visual duration
          skillLog.push(`🌪️ Whirlwind channels continuously! (${enemiesHit} enemies hit, range: ${Math.round(whirlwindRange)})`)
        }
        
        // Mark defeated enemies as dying and generate loot/experience
        const defeatedEnemies = updatedEnemies.filter(e => e.hp <= 0)
        updatedEnemies = updatedEnemies.map(enemy => {
          if (enemy.hp <= 0 && enemy.state !== 'dying') {
            return { ...enemy, state: 'dying' as const, alpha: 1, deathTime: currentTime }
          }
          return enemy
        })
        let newInventory = [...state.inventory]
        
        if (defeatedEnemies.length > 0) {
          // Generate loot and XP for all defeated enemies
          let totalLoot: any[] = []
          let totalXpGain = 0
          
          defeatedEnemies.forEach(enemy => {
            const lootArray = generateLoot(enemy.level, enemy.isBoss)
            totalLoot = [...totalLoot, ...lootArray]
            
            // Bosses give more XP
            const xpGain = enemy.isBoss ? Math.floor(enemy.level * 12) : Math.max(1, Math.floor(enemy.level * 4))
            totalXpGain += xpGain
          })
          
          updatedPlayer.xp += totalXpGain
          
          // Implement inventory limit with automatic gold conversion
          const maxInventoryItems = 10 * 4 // 10 pages * 4 items per page (list view)
          
          // Process all loot items
          let totalGoldFromLoot = 0
          let itemsAdded = 0
          let itemsConverted = 0
          
          totalLoot.forEach(loot => {
            totalGoldFromLoot += loot.value
            
            if (newInventory.length >= maxInventoryItems) {
              // Convert excess items to gold automatically
              updatedPlayer.gold += loot.value
              itemsConverted++
            } else {
              // Add item to inventory normally
              newInventory.push(loot)
              itemsAdded++
            }
          })
          
          // Create appropriate loot messages
          const bossesDefeated = defeatedEnemies.filter(e => e.isBoss).length
          if (bossesDefeated > 0) {
            skillLog.push(`🎉 ${bossesDefeated} BOSS(ES) DEFEATED by Whirlwind! ${totalLoot.length} Epic Items Found!`)
          } else {
            skillLog.push(`${defeatedEnemies.length} enemies defeated by Whirlwind! ${totalLoot.length} items dropped`)
          }
          
          if (itemsAdded > 0) {
            skillLog.push(`📦 ${itemsAdded} items added to inventory`)
          }
          if (itemsConverted > 0) {
            skillLog.push(`💰 Inventory full! ${itemsConverted} items converted to ${itemsConverted * Math.floor(totalGoldFromLoot / totalLoot.length)} gold`)
          }
          
          // level up loop
          while (updatedPlayer.xp >= updatedPlayer.nextLevelXp) {
            updatedPlayer.xp -= updatedPlayer.nextLevelXp
            updatedPlayer.level += 1
            updatedPlayer.skillPoints += 1
            updatedPlayer.passiveTreeState.availablePoints += 1 // Add 1 passive skill point per level
            updatedPlayer.maxHp += 8
            updatedPlayer.hp = updatedPlayer.maxHp
            updatedPlayer.nextLevelXp = Math.floor(updatedPlayer.nextLevelXp * 1.25)
            skillLog.push(`Leveled up! Now level ${updatedPlayer.level}`)
          }
        }
        
        const calculatedPlayer = calculatePlayerStatsMemoized(updatedPlayer)
        
        // Save state with updated inventory
        saveState({ player: calculatedPlayer, inventory: newInventory, enemies: updatedEnemies, skills: state.skills })
        
        return {
          ...state,
          player: calculatedPlayer,
          enemies: updatedEnemies,
          inventory: newInventory,
          log: [...skillLog, ...state.log].slice(0, 200)
        }
      }
      
      return state
    }
    
    case 'AUTO_SKILLS': {
      // Automatic skill triggering for all equipped skills (except whirlwind which is handled separately)
      if (!state.autoCombat || state.enemies.length === 0) {
        console.log('🚫 AUTO_SKILLS skipped - autoCombat:', state.autoCombat, 'enemies:', state.enemies.length)
        return state
      }
      
      let updatedPlayer = { ...state.player }
      let skillLog: string[] = []
      let enemies = [...state.enemies]
      
      // Initialize skill cooldowns if not present
      if (!updatedPlayer.skillCooldowns) {
        updatedPlayer.skillCooldowns = {}
      }
      
      const currentTime = Date.now()

      

      
      // Find the nearest alive enemy for projectile targeting with forward-facing priority
      const aliveEnemies = enemies.filter(e => e.hp > 0)
      let nearestEnemy = null
      
      if (aliveEnemies.length > 0 && state.playerPosition) {
        const playerPos = state.playerPosition
        
        // Calculate distances and find the nearest enemy
        const enemiesWithDistance = aliveEnemies.map(enemy => {
          const enemyPos = state.enemyPositions?.[enemy.id]
          if (!enemyPos) return null
          
          const dx = enemyPos.x - playerPos.x
          const dy = enemyPos.y - playerPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          return {
            enemy,
            distance,
            position: enemyPos
          }
        }).filter(Boolean)
        
        if (enemiesWithDistance.length > 0) {
          // Sort by distance only - prioritize nearest enemies
          enemiesWithDistance.sort((a, b) => a!.distance - b!.distance)
          
          nearestEnemy = enemiesWithDistance[0]!.enemy
        }
      }
      
      // Fallback to first alive enemy if no position data available
      if (!nearestEnemy && aliveEnemies.length > 0) {
        nearestEnemy = aliveEnemies[0]
      }
      
      console.log(`🎯 Nearest enemy for targeting:`, nearestEnemy ? `${nearestEnemy.name} (${nearestEnemy.id})` : 'none')
      
      for (let index = 0; index < updatedPlayer.skillBar.slots.length; index++) {
        const skill = updatedPlayer.skillBar.slots[index]
        console.log(`🔍 Slot ${index}:`, skill ? {
          id: skill.id,
          isUnlocked: skill.isUnlocked,
          isEquipped: skill.isEquipped
        } : 'empty')
        
        if (skill && skill.isEquipped && skill.id !== 'whirlwind') {
          console.log(`🎯 Checking skill ${skill.id} in slot ${index}:`, {
            isUnlocked: skill.isUnlocked,
            currentMana: updatedPlayer.mana,
            manaCost: skill.scaling?.baseManaCost || skill.manaCost || 0
          })
          
          const lastUsed = updatedPlayer.skillCooldowns?.[skill.id] ?? 0
          const cooldownTime = skill.scaling?.baseCooldown ?? skill.cooldown ?? 0 // Use actual cooldown, default to 0
          
          // Check if skill is off cooldown and player has enough mana
          const manaCost = skill.scaling?.baseManaCost || skill.manaCost || 0
          console.log(`🔍 Skill ${skill.id} check details:`, {
            lastUsed,
            currentTime,
            cooldownTime,
            timeSinceLastUse: currentTime - lastUsed,
            cooldownReady: currentTime - lastUsed >= cooldownTime,
            manaReady: updatedPlayer.mana >= manaCost,
            hasTarget: !!nearestEnemy
          })
          
          if (currentTime - lastUsed >= cooldownTime && updatedPlayer.mana >= manaCost) {
            // For projectile skills, we need a target. For AOE skills, we can proceed without a specific target
            const projectileSkills = ['fireball', 'lightning_bolt', 'ice_shard', 'poison_arrow']
            const needsTarget = projectileSkills.includes(skill.id)
            
            if (needsTarget && !nearestEnemy) {
               console.log(`❌ Skill ${skill.id} needs a target but none available`)
               continue
             }
             
             // Check if target is within skill range for projectile skills (with lenient fallback)
             if (needsTarget && nearestEnemy) {
               const skillRange = getScaledRange(skill)
               const enemyPos = state.enemyPositions?.[nearestEnemy.id]
               const playerPos = state.playerPosition
               
               if (enemyPos && playerPos) {
                 const dx = enemyPos.x - playerPos.x
                 const dy = enemyPos.y - playerPos.y
                 const distance = Math.sqrt(dx * dx + dy * dy)
                 
                 // Use a more lenient range check (add 20% buffer) to prevent skills from being blocked
                 const effectiveRange = skillRange * 1.2
                 
                 if (distance > effectiveRange) {
                   console.log(`❌ Skill ${skill.id} target too far: ${distance.toFixed(0)}px > ${effectiveRange.toFixed(0)}px effective range`)
                   continue
                 }
                 
                 console.log(`✅ Skill ${skill.id} target in range: ${distance.toFixed(0)}px <= ${effectiveRange.toFixed(0)}px`)
               } else {
                 // If position data is missing, allow skill usage (fallback for position sync issues)
                 console.log(`⚠️ Position data missing for ${skill.id}, allowing skill usage as fallback`)
               }
             }
             console.log(`🚀 Triggering skill ${skill.id}${nearestEnemy ? ` on ${nearestEnemy.name}` : ''}!`)
             console.log(`✅ SKILL TRIGGERED SUCCESSFULLY: ${skill.id} - This confirms the AUTO_SKILLS bug fix is working!`)
            
            // Use the skill automatically
            updatedPlayer.skillCooldowns = updatedPlayer.skillCooldowns || {}
            updatedPlayer.skillCooldowns[skill.id] = currentTime
            updatedPlayer.mana = Math.max(0, updatedPlayer.mana - manaCost)
            
            // Apply skill effects based on skill type - use new character stats integration
            const damage = calculateSkillDamageWithStats(skill, updatedPlayer)
            
            // Add skill animation log with target information for projectile skills
            if (projectileSkills.includes(skill.id) && nearestEnemy) {
              const animLog = `ANIM_SKILL|${skill.id}|${nearestEnemy.id}`
              console.log(`📝 Adding projectile animation log: ${animLog}`)
              skillLog.push(animLog)
              
              // Apply damage to the target and add damage animation
              const targetIndex = enemies.findIndex(e => e.id === nearestEnemy.id)
              if (targetIndex !== -1 && enemies[targetIndex].hp > 0) {
                enemies[targetIndex].hp = Math.max(0, enemies[targetIndex].hp - damage)
                skillLog.push(`ANIM_PLAYER|${nearestEnemy.id}|magic|Rare|hit|${damage}`)
                skillLog.push(`⚡ ${skill.name} hits ${nearestEnemy.name} for ${damage} damage!`)
              }
            } else {
              const animLog = `ANIM_SKILL|${skill.id}|${currentTime}|${skill.scaling?.baseDuration ?? 1000}`

              console.log(`📝 Adding AOE animation log: ${animLog}`)
              skillLog.push(animLog)
              
              // For AOE skills, apply damage to all nearby enemies
              let enemiesHit = 0
              enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                  enemies[index].hp = Math.max(0, enemy.hp - damage)
                  enemiesHit++
                }
              })
              
              if (enemiesHit > 0) {
                skillLog.push(`⚡ ${skill.name} hits ${enemiesHit} enemies for ${damage} damage each!`)
              }
            }
            
            console.log(`📋 Current skillLog after adding ${skill.id}:`, skillLog)
          } else {
            const reason = !nearestEnemy ? 'no target' : `cooldown: ${currentTime - lastUsed}/${cooldownTime}, mana: ${updatedPlayer.mana}/${manaCost}`
            console.log(`❌ Skill ${skill.id} not ready - ${reason}`)
          }
        }
      }
      
      // Check if any enemies were defeated by skills and award loot/experience
      const defeatedEnemies = enemies.filter(e => e.hp <= 0)
      let newInventory = [...state.inventory]
      
      if (defeatedEnemies.length > 0) {
        // Generate loot and XP for all defeated enemies
        let totalLoot: any[] = []
        let totalXpGain = 0
        
        defeatedEnemies.forEach(enemy => {
          const lootArray = generateLoot(enemy.level, enemy.isBoss)
          totalLoot = [...totalLoot, ...lootArray]
          
          // Bosses give more XP
          const xpGain = enemy.isBoss ? Math.floor(enemy.level * 12) : Math.max(1, Math.floor(enemy.level * 4))
          totalXpGain += xpGain
        })
        
        updatedPlayer.xp += totalXpGain
        
        // Implement inventory limit with automatic gold conversion
        const maxInventoryItems = 10 * 4 // 10 pages * 4 items per page (list view)
        
        // Process all loot items
        let totalGoldFromLoot = 0
        let itemsAdded = 0
        let itemsConverted = 0
        
        totalLoot.forEach(loot => {
          totalGoldFromLoot += loot.value
          
          if (newInventory.length >= maxInventoryItems) {
            // Convert excess items to gold automatically
            updatedPlayer.gold += loot.value
            itemsConverted++
          } else {
            // Add item to inventory normally
            newInventory.push(loot)
            itemsAdded++
          }
        })
        
        // Create appropriate loot messages
        const bossesDefeated = defeatedEnemies.filter(e => e.isBoss).length
        if (bossesDefeated > 0) {
          skillLog.unshift(`🎉 ${bossesDefeated} BOSS(ES) DEFEATED! ${totalLoot.length} Epic Items Found!`)
        } else {
          skillLog.unshift(`${defeatedEnemies.length} enemies defeated! ${totalLoot.length} items dropped`)
        }
        
        if (itemsAdded > 0) {
          skillLog.unshift(`📦 ${itemsAdded} items added to inventory`)
        }
        if (itemsConverted > 0) {
          skillLog.unshift(`💰 Inventory full! ${itemsConverted} items converted to ${itemsConverted * Math.floor(totalGoldFromLoot / totalLoot.length)} gold`)
        }
        
        // level up loop
        while (updatedPlayer.xp >= updatedPlayer.nextLevelXp) {
          updatedPlayer.xp -= updatedPlayer.nextLevelXp
          updatedPlayer.level += 1
          updatedPlayer.skillPoints += 1
          updatedPlayer.passiveTreeState.availablePoints += 1 // Add 1 passive skill point per level
          updatedPlayer.maxHp += 8
          updatedPlayer.hp = updatedPlayer.maxHp
          updatedPlayer.nextLevelXp = Math.floor(updatedPlayer.nextLevelXp * 1.25)
          skillLog.unshift(`Leveled up! Now level ${updatedPlayer.level}`)
        }
      }
      
      // Mark defeated enemies as dying instead of immediately removing them
      const now = Date.now()
      const updatedEnemiesWithDeathState = enemies.map(enemy => {
        if (enemy.hp <= 0 && enemy.state !== 'dying') {
          return { ...enemy, state: 'dying' as const, alpha: 1, deathTime: now }
        }
        return enemy
      })
      
      // Only remove enemies that have been dying for more than 2 seconds
      const filteredEnemies = updatedEnemiesWithDeathState.filter(e => {
        if (e.state === 'dying' && e.deathTime) {
          // Keep dying enemies for 2 seconds to allow death animations
          return (now - e.deathTime) < 2000
        }
        return e.hp > 0
      })
      
      // Save state with updated inventory
      saveState({ player: updatedPlayer, inventory: newInventory, enemies: filteredEnemies, skills: state.skills })
      
      return {
        ...state,
        player: updatedPlayer,
        enemies: filteredEnemies,
        inventory: newInventory,
        log: [...skillLog, ...state.log].slice(0, 200)
      }
    }
    
    case 'MANA_REGEN': {
      const updatedPlayer = { ...state.player }
      const manaRegenPerSecond = updatedPlayer.manaRegen || 0
      
      // Regenerate mana (assuming this is called every 100ms, so divide by 10)
      const manaToRestore = manaRegenPerSecond / 10
      updatedPlayer.mana = Math.min(updatedPlayer.maxMana, updatedPlayer.mana + manaToRestore)
      
      return {
        ...state,
        player: updatedPlayer
      }
    }
    
    case 'ALLOCATE_PASSIVE_NODE': {
      const nodeId = action.payload
      const player = { ...state.player }
      
      if (player.passiveTreeData && player.passiveTreeState) {
        const newTreeState = allocateNode(nodeId, player.passiveTreeData, player.passiveTreeState)
        player.passiveTreeState = newTreeState
        
        // Recalculate player stats with new passive tree
        const calculatedPlayer = calculatePlayerStatsMemoized(player)
        
        saveState({ 
          player: calculatedPlayer, 
          inventory: state.inventory, 
          enemies: state.enemies, 
          skills: state.skills 
        })
        
        return {
          ...state,
          player: calculatedPlayer,
          log: [`Allocated passive node: ${player.passiveTreeData.nodes[nodeId]?.name || nodeId}`, ...state.log].slice(0, 200),
          lastStatsUpdate: Date.now()
        }
      }
      
      return state
    }
    
    case 'ADD_STONE': {
      const stone = action.payload
      const updatedPlayer = {
        ...state.player,
        stones: [...state.player.stones, stone]
      }
      
      saveState({ 
        player: updatedPlayer, 
        inventory: state.inventory, 
        enemies: state.enemies, 
        skills: state.skills 
      })
      
      return {
        ...state,
        player: updatedPlayer,
        log: [`Generated stone: ${stone.name}`, ...state.log].slice(0, 200)
      }
    }
    
    case 'FORCE_MIGRATE_STONES': {
      const stonesCopy = [...state.player.stones]
      forceMigrateAllStones(stonesCopy)
      
      const updatedPlayer = {
        ...state.player,
        stones: stonesCopy
      }
      
      saveState({ 
        player: updatedPlayer, 
        inventory: state.inventory, 
        enemies: state.enemies, 
        skills: state.skills 
      })
      
      return {
        ...state,
        player: updatedPlayer,
        log: [`Force migrated all stone IDs for uniqueness`, ...state.log].slice(0, 200)
      }
    }
    
    case 'REMOVE_STONE': {
      const stoneId = action.payload
      const updatedPlayer = {
        ...state.player,
        stones: state.player.stones.filter(stone => stone.id !== stoneId)
      }
      
      saveState({ 
        player: updatedPlayer, 
        inventory: state.inventory, 
        enemies: state.enemies, 
        skills: state.skills 
      })
      
      return {
        ...state,
        player: updatedPlayer,
        log: [`Removed stone`, ...state.log].slice(0, 200)
      }
    }
    
    case 'UPDATE_EQUIPMENT': {
      const { slot, equipment } = action.payload
      const newEquipment = { ...state.player.equipment }
      newEquipment[slot as EquipmentSlot] = equipment
      
      const updatedPlayer = { ...state.player, equipment: newEquipment }
      const calculatedPlayer = calculatePlayerStatsMemoized(updatedPlayer)
      
      saveState({ 
        player: calculatedPlayer, 
        inventory: state.inventory, 
        enemies: state.enemies, 
        skills: state.skills 
      })
      
      return {
        ...state,
        player: calculatedPlayer,
        lastStatsUpdate: Date.now()
      }
    }
    
    default:
      return state
  }
}

const GameContext = createContext<GameContextType>({
  state: initialState,
  actions: {} as GameActions,
  dispatch: () => {}
})

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const hasLoadedRef = React.useRef(false)

  useEffect(() => {
    // Prevent multiple loads during development hot reloading
    if (hasLoadedRef.current) {
      return
    }
    
    const saved = loadSave()
    if (saved) {
      hasLoadedRef.current = true
      dispatch({ type: 'LOAD', payload: saved })
    } else {
      hasLoadedRef.current = true
    }
  }, [])

  const updateEnemyPositions = useCallback((positions: Record<string, { x: number; y: number }>) => {
    dispatch({ type: 'UPDATE_ENEMY_POSITIONS', payload: positions })
  }, [])

  const updatePlayerPosition = useCallback((position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: position })
  }, [])

  const updateCharacterModel = useCallback((characterModel: string) => {
    dispatch({ type: 'UPDATE_CHARACTER_MODEL', payload: characterModel })
  }, [])

  // auto-spawn loop - spawn monsters more frequently
  useEffect(() => {
    const tid = setInterval(() => {
      // Count only alive enemies for spawning logic
      const aliveEnemies = state.enemies.filter(e => e.hp > 0).length
      if (aliveEnemies < 25) {
        // Spawn up to 3 monsters at once, but don't exceed the 25 limit
        const spawnCount = Math.min(3, 25 - aliveEnemies)
        for (let i = 0; i < spawnCount; i++) {
          dispatch({ type: 'SPAWN' })
        }
      }
    }, 1500) // Reduced from 2200ms to 1500ms for more responsive spawning
    return () => clearInterval(tid)
  }, [])

  // auto-combat loop: interval scales with Quick Reflexes skill
  useEffect(() => {
    const quick = state.skills['quick'] ?? 0
    const baseInterval = 1000
    const interval = Math.max(300, Math.round(baseInterval / (1 + quick * 0.05)))
    const tid = setInterval(() => {
      // Trigger auto-skills once per combat cycle - skill-only combat
      dispatch({ type: 'AUTO_SKILLS' })
      
      // Basic attacks disabled - combat now relies solely on skills
      // ids.forEach(id => dispatch({ type: 'TICK', payload: { enemyId: id } }))
    }, interval)
    return () => clearInterval(tid)
  }, [state.skills])

  // Continuous channeling loop for whirlwind - runs independently of combat
  useEffect(() => {
    const whirlwindSkill = state.player.skillBar.slots.find((s: any) => s?.id === 'whirlwind')
    
    if (whirlwindSkill && whirlwindSkill.isUnlocked) {
      const channelInterval = 100 // 10 times per second for smooth channeling
      const tid = setInterval(() => {
        dispatch({ type: 'CHANNEL_WHIRLWIND' })
      }, channelInterval)
      return () => clearInterval(tid)
    }
  }, [state.player.skillBar])

  // Mana regeneration loop - runs every 100ms for smooth mana restoration
  useEffect(() => {
    const manaRegenInterval = 100 // 10 times per second
    const tid = setInterval(() => {
      dispatch({ type: 'MANA_REGEN' })
    }, manaRegenInterval)
    return () => clearInterval(tid)
  }, [])

  const actions: GameActions = useMemo(() => ({
    spawnEnemy: (level?: number, kind?: EnemyType) => dispatch({ type: 'SPAWN', payload: { level, kind } }),
    simulateTick: (enemyId: string) => dispatch({ type: 'TICK', payload: { enemyId } }),
    removeEnemy: (id: string) => dispatch({ type: 'REMOVE', payload: id }),
    equipItem: (id: string) => dispatch({ type: 'EQUIP', payload: id }),
    discardItem: (id: string) => dispatch({ type: 'DISCARD', payload: id }),
    sellAll: () => dispatch({ type: 'SELL_ALL' }),

    resetAll: () => dispatch({ type: 'RESET' }),
    log: (message: string) => dispatch({ type: 'LOG', payload: message }),
    
    // Skill Gem Management Actions
    unlockSkillGem: (skillId: string) => dispatch({ type: 'UNLOCK_SKILL_GEM', payload: skillId }),
    unlockSupportGem: (supportId: string) => dispatch({ type: 'UNLOCK_SUPPORT_GEM', payload: supportId }),
    levelUpSkillGem: (skillId: string) => dispatch({ type: 'LEVEL_UP_SKILL_GEM', payload: skillId }),
    levelUpSupportGem: (supportId: string) => dispatch({ type: 'LEVEL_UP_SUPPORT_GEM', payload: supportId }),
    equipSkillToBar: (skillId: string, slotIndex: number) => dispatch({ type: 'EQUIP_SKILL_TO_BAR', payload: { skillId, slotIndex } }),
    unequipSkillFromBar: (slotIndex: number) => dispatch({ type: 'UNEQUIP_SKILL_FROM_BAR', payload: slotIndex }),
    attachSupportGem: (skillId: string, supportId: string) => dispatch({ type: 'ATTACH_SUPPORT_GEM', payload: { skillId, supportId } }),
    detachSupportGem: (skillId: string, supportId: string) => dispatch({ type: 'DETACH_SUPPORT_GEM', payload: { skillId, supportId } }),
    
    // Skill Execution
    useSkill: (skillId: string) => dispatch({ type: 'USE_SKILL', payload: skillId }),
    updateEnemyPositions,
    updatePlayerPosition,
    
    // Passive Tree Management
    allocatePassiveNode: (nodeId: string) => dispatch({ type: 'ALLOCATE_PASSIVE_NODE', payload: nodeId }),
    
    // Stone Management
    addStone: (stone: any) => dispatch({ type: 'ADD_STONE', payload: stone }),
    removeStone: (stoneId: string) => dispatch({ type: 'REMOVE_STONE', payload: stoneId }),
    forceMigrateStones: () => dispatch({ type: 'FORCE_MIGRATE_STONES' }),
    
    // Character Model Management
    updateCharacterModel,
  }), [updateEnemyPositions, updatePlayerPosition, updateCharacterModel])

  const contextValue = useMemo(() => ({ state, actions, dispatch }), [state, actions])

  // Make state available globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gameState = state;
      (window as any).testStoneStatsNow = () => testStoneStatsIntegration(state.player);
      (window as any).forceMigrateStones = actions.forceMigrateStones;
    }
  }, [state])

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
}

export function useGame() { 
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
