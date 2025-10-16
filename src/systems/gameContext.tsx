import React, { createContext, useContext, useEffect, useReducer, ReactNode, useMemo, useCallback } from 'react'
import { Player, defaultPlayer, calculatePlayerStats } from './player'
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
  SUPPORT_GEMS 
} from './skillGems'
import { 
  getActiveCombinations, 
  getActiveSynergies, 
  calculateCombinationBonuses,
  type SkillCombination,
  type SkillSynergy
} from './skillCombinations'

// Type definitions
interface GameState {
  player: Player
  enemies: Enemy[]
  inventory: any[] // Keep as any[] for now since loot system returns mixed types
  log: string[]
  skills: Record<string, number>
  autoCombat?: boolean
  playerPosition?: { x: number; y: number }
  activeCombinations?: SkillCombination[]
  activeSynergies?: SkillSynergy[]
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
  | { type: 'UPGRADE_SKILL'; payload: string }
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

interface GameActions {
  spawnEnemy: (level?: number, kind?: EnemyType) => void
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
  
  // Skill Execution
  useSkill: (skillId: string) => void
  
  // Position Management
  updateEnemyPositions: (positions: Record<string, { x: number; y: number }>) => void
  updatePlayerPosition: (position: { x: number; y: number }) => void
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
  skills: {},
  activeCombinations: [],
  activeSynergies: [],
  lastStatsUpdate: Date.now()
}

// Helper function to update skill combinations and synergies
function updateSkillCombinations(state: GameState): GameState {
  const equippedSkills = state.player.skillBar.slots.filter(skill => skill !== null)
  const activeCombinations = getActiveCombinations(equippedSkills)
  const activeSynergies = getActiveSynergies(equippedSkills)
  
  return {
    ...state,
    activeCombinations,
    activeSynergies
  }
}

// Helper function to check if stats need recalculation
function needsStatsUpdate(state: GameState, action: GameAction): boolean {
  const statsUpdateActions = ['LOAD', 'EQUIP', 'UNEQUIP', 'SELL_ALL', 'UPGRADE_SKILL', 'UNLOCK_SKILL_GEM', 'UNLOCK_SUPPORT_GEM', 'LEVEL_UP_SKILL_GEM', 'LEVEL_UP_SUPPORT_GEM', 'EQUIP_SKILL_TO_BAR', 'UNEQUIP_SKILL_FROM_BAR', 'ATTACH_SUPPORT_GEM', 'DETACH_SUPPORT_GEM']
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
      
      const res = simulateCombatTick(updatedPlayer, target)
      const newPlayer = { ...res.player }
      let newEnemies = [...enemies]
      newEnemies[targetIndex] = res.enemy
      let newLog = [...skillLog, res.message, ...state.log].slice(0,200)

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
        newEnemies = newEnemies.filter(e => e.id !== enemyId)
        
        // Bosses give more XP
        const xpGain = target.isBoss ? Math.floor(target.level * 12) : Math.max(1, Math.floor(target.level * 4))
        newPlayer.xp += xpGain
        
        // Implement inventory limit with automatic gold conversion
        const maxInventoryItems = 10 * 4 // 10 pages * 4 items per page (list view)
        let newInventory = [...state.inventory]
        
        // Process all loot items
        let totalGoldFromLoot = 0
        let itemsAdded = 0
        let itemsConverted = 0
        
        lootArray.forEach(loot => {
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
        if (target.isBoss) {
          newLog.unshift(`🎉 BOSS DEFEATED! ${lootArray.length} Epic Items Found!`)
        } else {
          newLog.unshift(`Enemy defeated! ${lootArray.length} items dropped`)
        }
        
        if (itemsAdded > 0) {
          newLog.unshift(`📦 ${itemsAdded} items added to inventory`)
        }
        if (itemsConverted > 0) {
          newLog.unshift(`💰 Inventory full! ${itemsConverted} items converted to ${itemsConverted * Math.floor(totalGoldFromLoot / lootArray.length)} gold`)
        }
        
        newPlayer.gold += totalGoldFromLoot

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
        const calculatedPlayer = calculatePlayerStats(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer, lastStatsUpdate: Date.now() }
      } else {
        // Legacy equipment system fallback
        const player = { ...state.player, equipped: item }
        const calculatedPlayer = calculatePlayerStats(player)
        saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
        return { ...state, player: calculatedPlayer, lastStatsUpdate: Date.now() }
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
      return { ...state, player: calculatedPlayer, lastStatsUpdate: Date.now() }
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
        log: [`Sold all items for ${totalValue} gold`, ...state.log].slice(0, 200),
        lastStatsUpdate: Date.now()
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
      return { 
        player: defaultPlayer(), 
        enemies: [spawnEnemyForLevel(1)], 
        inventory: [], 
        log: [], 
        skills: {},
        activeCombinations: [],
        activeSynergies: [],
        lastStatsUpdate: Date.now()
      }
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
        const updatedState = updateSkillCombinations({ 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        })
        return updatedState
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
        const updatedState = updateSkillCombinations({ 
          ...state, 
          player: calculatedPlayer, 
          log: [result.message, ...state.log].slice(0, 200) 
        })
        return updatedState
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
        const damage = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
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
          const damage = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|magic|Rare|hit|${damage}`)
        }
      } else if (skill.id === 'lightning_bolt') {
        // Lightning bolt targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          newLog.unshift(`ANIM_SKILL|lightning|${nearestEnemy.id}|${Date.now()}`)
          const damage = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|magic|Magic|hit|${damage}`)
        }
      } else if (skill.id === 'power_strike') {
        // Power strike targets nearest enemy
        const nearestEnemy = state.enemies.find(e => e.hp > 0)
        if (nearestEnemy) {
          const damage = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
          newLog.unshift(`ANIM_PLAYER|${nearestEnemy.id}|melee|Unique|hit|${damage}`)
        }
      } else if (skill.id === 'heal') {
        // Heal restores player health
        const healAmount = Math.floor(skill.scaling.baseDamage! + (skill.level - 1) * skill.scaling.damagePerLevel!)
        updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + healAmount)
        newLog.unshift(`ANIM_SKILL|heal|player|${Date.now()}`)
        newLog.unshift(`Healed for ${healAmount} HP!`)
      }
      
      const calculatedPlayer = calculatePlayerStats(updatedPlayer)
      saveState({ player: calculatedPlayer, inventory: state.inventory, enemies: state.enemies, skills: state.skills })
      
      return { 
        ...state, 
        player: calculatedPlayer, 
        log: newLog.slice(0, 200) 
      }
    }
    
    case 'UPDATE_ENEMY_POSITIONS': {
      const positions = action.payload
      const updatedEnemies = state.enemies.map(enemy => ({
        ...enemy,
        position: positions[enemy.id] || enemy.position
      }))
      return { ...state, enemies: updatedEnemies }
    }
    
    case 'UPDATE_PLAYER_POSITION': {
      return { ...state, playerPosition: action.payload }
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
        
        // Remove defeated enemies and generate loot
        const defeatedEnemies = updatedEnemies.filter(e => e.hp <= 0)
        updatedEnemies = updatedEnemies.filter(e => e.hp > 0)
        
        defeatedEnemies.forEach(enemy => {
          const lootArray = generateLoot(enemy.level, enemy.isBoss)
          lootArray.forEach(loot => {
            updatedPlayer.gold += loot.value
          })
          if (lootArray.length > 0) {
            skillLog.push(`Enemy defeated by Whirlwind! ${lootArray.length} items dropped`)
          }
        })
        
        const calculatedPlayer = calculatePlayerStats(updatedPlayer)
        
        return {
          ...state,
          player: calculatedPlayer,
          enemies: updatedEnemies,
          log: [...skillLog, ...state.log].slice(0, 200)
        }
      }
      
      return state
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

  const updateEnemyPositions = useCallback((positions: Record<string, { x: number; y: number }>) => {
    dispatch({ type: 'UPDATE_ENEMY_POSITIONS', payload: positions })
  }, [])

  const updatePlayerPosition = useCallback((position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: position })
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

  const actions: GameActions = useMemo(() => ({
    spawnEnemy: (level?: number, kind?: EnemyType) => dispatch({ type: 'SPAWN', payload: { level, kind } }),
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
    detachSupportGem: (skillId: string, supportId: string) => dispatch({ type: 'DETACH_SUPPORT_GEM', payload: { skillId, supportId } }),
    
    // Skill Execution
    useSkill: (skillId: string) => dispatch({ type: 'USE_SKILL', payload: skillId }),
    updateEnemyPositions,
    updatePlayerPosition,
  }), [updateEnemyPositions, updatePlayerPosition])

  const contextValue = useMemo(() => ({ state, actions, dispatch }), [state, actions])

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
}

export function useGame() { 
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
