import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { Player, defaultPlayer, calculatePlayerStats } from './player'
import { Enemy, spawnEnemyForLevel } from './enemy'
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
  SUPPORT_GEMS 
} from './skillGems'

// Type definitions
interface GameState {
  player: Player
  enemies: Enemy[]
  inventory: any[] // Keep as any[] for now since loot system returns mixed types
  log: string[]
  skills: Record<string, number>
  autoCombat?: boolean
}

interface GameAction {
  type: string
  payload?: any
}

interface GameActions {
  spawnEnemy: (level?: number, kind?: string) => void
  simulateTick: (enemyId: string) => void
  removeEnemy: (id: string) => void
  equipItem: (id: string) => void
  discardItem: (id: string) => void
  sellAll: () => void
  upgradeSkill: (key: string) => void
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
  player: calculatePlayerStats(defaultPlayer()),
  enemies: [spawnEnemyForLevel(1)],
  inventory: [],
  log: [],
  skills: {}
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
        if (!payload.player.skillBar) {
          payload.player.skillBar = createDefaultSkillBar()
        }
        // Ensure skillGems and supportGems exist
        if (!Array.isArray(payload.player.skillGems)) {
          payload.player.skillGems = MAIN_SKILL_GEMS.map(template => createDefaultSkillGem(template))
        }
        if (!Array.isArray(payload.player.supportGems)) {
          payload.player.supportGems = SUPPORT_GEMS.map(template => createDefaultSupportGem(template))
        }
        // Recalculate player stats to ensure consistency
        payload.player = calculatePlayerStats(payload.player)
      }
      return { ...state, ...payload }
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
      const res = simulateCombatTick(state.player, target)
      const newPlayer = { ...res.player }
      let newEnemies = [...enemies]
      newEnemies[targetIndex] = res.enemy
      let newLog = [res.message, ...state.log].slice(0,200)

      // If player hit (res.didPlayerHit), emit ANIM_PLAYER marker so visuals spawn
      if (res.didPlayerHit) {
        const w = newPlayer.equipped ?? { type: 'melee', rarity: 'Common' }
        newLog.unshift(`ANIM_PLAYER|${target.id}|${w.type}|${w.rarity}|${res.crit ? 'crit' : 'hit'}|${res.damage}`)
      }

      if (res.crit && res.didPlayerHit) {
        newLog.unshift(`🔥 Critical Hit! -${res.damage} to ${target.name}`)
      }

      if (res.enemyDefeated) {
        const lootArray = generateLoot(target.level, target.isBoss)
        const loot = lootArray[0] // Take the first item from the loot array
        newEnemies = newEnemies.filter(e => e.id !== enemyId)
        const lootMessage = target.isBoss ? `🎉 BOSS DEFEATED! Epic Loot: ${loot.name}` : `Enemy defeated! Loot: ${loot.name}`
        newLog.unshift(lootMessage)
        newPlayer.gold += loot.value
        // Bosses give more XP
        const xpGain = target.isBoss ? Math.floor(target.level * 12) : Math.max(1, Math.floor(target.level * 4))
        newPlayer.xp += xpGain
        
        // Implement inventory limit with automatic gold conversion
        const maxInventoryItems = 10 * 4 // 10 pages * 4 items per page (list view)
        let newInventory = [...state.inventory]
        
        if (newInventory.length >= maxInventoryItems) {
          // Convert excess items to gold automatically
          const excessGold = loot.value
          newPlayer.gold += excessGold
          newLog.unshift(`💰 Inventory full! ${loot.name} converted to ${excessGold} gold`)
        } else {
          // Add item to inventory normally
          newInventory = [...newInventory, loot]
        }

        // level up loop
        while (newPlayer.xp >= newPlayer.nextLevelXp) {
          newPlayer.xp -= newPlayer.nextLevelXp
          newPlayer.level += 1
          newPlayer.skillPoints += 1
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
      
      // Debug logging
      console.log('EQUIP action - item:', item)
      console.log('Item slot:', item.slot)
      console.log('Item category:', item.category)
      
      // Handle new equipment system
      if (item.slot && item.category) {
        console.log('Using new equipment system for slot:', item.slot)
        
        // Check if player can equip this item
        const canEquipItem = !item.requirements || Object.entries(item.requirements).every(([attr, req]) => {
          const playerAttr = state.player.attributes?.[attr as keyof typeof state.player.attributes] ?? 0
          return playerAttr >= (req as number)
        })
        
        if (!canEquipItem) {
          console.log('Cannot equip item - requirements not met')
          return state
        }
        
        // Equip the item in the appropriate slot
        const newEquipment = { ...state.player.equipment }
        newEquipment[item.slot as EquipmentSlot] = item
        
        console.log('New equipment state:', newEquipment)
        
        const player = { ...state.player, equipment: newEquipment }
        const calculatedPlayer = calculatePlayerStats(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer }
      } else {
        console.log('Using legacy equipment system')
        // Legacy equipment system fallback
        const player = { ...state.player, equipped: item }
        const calculatedPlayer = calculatePlayerStats(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer }
      }
    }
    case 'UNEQUIP': {
      const slot = action.payload as EquipmentSlot
      if (!slot || !state.player.equipment?.[slot]) return state
      
      // Remove the item from the equipment slot
      const newEquipment = { ...state.player.equipment }
      delete newEquipment[slot]
      
      const player = { ...state.player, equipment: newEquipment }
      const calculatedPlayer = calculatePlayerStats(player)
      saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
      return { ...state, player: calculatedPlayer }
    }
    case 'DISCARD': {
      const id = action.payload
      const inv = state.inventory.filter(i => i.id !== id)
      saveState({ player: state.player, inventory: inv, enemies: state.enemies, skills: state.skills })
      return { ...state, inventory: inv }
    }
    case 'SELL_ALL': {
      // Calculate total value of all equipment items
      const totalValue = state.inventory.reduce((sum, item) => sum + (item.value || 0), 0)
      
      // Clear inventory and add gold to player
      const player = { ...state.player, gold: (state.player.gold || 0) + totalValue }
      const calculatedPlayer = calculatePlayerStats(player)
      
      saveState({ player: calculatedPlayer, inventory: [], enemies: state.enemies, skills: state.skills })
      return { 
        ...state, 
        player: calculatedPlayer, 
        inventory: [], 
        log: [`Sold all items for ${totalValue} gold`, ...state.log].slice(0, 200) 
      }
    }
    case 'UPGRADE_SKILL': {
      const key = action.payload
      const cost = 1
      if (state.player.skillPoints < cost) return state
      const rank = (state.skills[key] ?? 0) + 1
      if (rank > 10) return state
      const newSkills = { ...state.skills, [key]: rank }
      const player = { ...state.player }
      player.skillPoints -= cost
      player.skills = newSkills
      // immediate simple application: adjust base fields
      if (key === 'endurance') {
        player.maxHp += 10
        player.hp += 10
      }
      const calculatedPlayer = calculatePlayerStats(player)
      saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: newSkills })
      return { ...state, player: calculatedPlayer, skills: newSkills, log: [`Upgraded ${key} to ${rank}`, ...state.log].slice(0,200) }
    }
    case 'TOGGLE_AUTO': {
      return { ...state, autoCombat: !state.autoCombat }
    }
    case 'RESET': {
      saveState({ player: defaultPlayer(), inventory: [], enemies: [spawnEnemyForLevel(1)], skills: {} })
      return { player: defaultPlayer(), enemies: [spawnEnemyForLevel(1)], inventory: [], log: [], skills: {} }
    }
    case 'LOG': {
      return { ...state, log: [action.payload, ...state.log].slice(0,200) }
    }
    
    // Skill Gem Management Cases
    case 'UNLOCK_SKILL_GEM': {
      const result = unlockSkillGem(state.player, action.payload)
      if (result.success && result.updatedPlayer) {
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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
        const calculatedPlayer = calculatePlayerStats(result.updatedPlayer)
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

  useEffect(() => {
    const saved = loadSave()
    if (saved) {
      dispatch({ type: 'LOAD', payload: saved })
    }
  }, [])

  // auto-spawn loop
  useEffect(() => {
    const tid = setInterval(() => {
      if (state.enemies.length < 25) dispatch({ type: 'SPAWN' })
    }, 2200)
    return () => clearInterval(tid)
  }, [state.enemies.length])

  // auto-combat loop: interval scales with Quick Reflexes skill
  useEffect(() => {
    const quick = state.skills['quick'] ?? 0
    const baseInterval = 1000
    const interval = Math.max(300, Math.round(baseInterval / (1 + quick * 0.05)))
    const tid = setInterval(() => {
      // run ticks for a shallow copy of current enemies (to avoid mid-loop mutation issues)
      const ids = state.enemies.map(e => e.id)
      ids.forEach(id => dispatch({ type: 'TICK', payload: { enemyId: id } }))
    }, interval)
    return () => clearInterval(tid)
  }, [state.enemies.length, state.skills])

  const actions: GameActions = {
    spawnEnemy: (level?: number, kind?: string) => dispatch({ type: 'SPAWN', payload: { level, kind } }),
    simulateTick: (enemyId: string) => dispatch({ type: 'TICK', payload: { enemyId } }),
    removeEnemy: (id: string) => dispatch({ type: 'REMOVE', payload: id }),
    equipItem: (id: string) => dispatch({ type: 'EQUIP', payload: id }),
    discardItem: (id: string) => dispatch({ type: 'DISCARD', payload: id }),
    sellAll: () => dispatch({ type: 'SELL_ALL' }),
    upgradeSkill: (key: string) => dispatch({ type: 'UPGRADE_SKILL', payload: key }),
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
    detachSupportGem: (skillId: string, supportId: string) => dispatch({ type: 'DETACH_SUPPORT_GEM', payload: { skillId, supportId } })
  }

  return <GameContext.Provider value={{ state, actions, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() { 
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
