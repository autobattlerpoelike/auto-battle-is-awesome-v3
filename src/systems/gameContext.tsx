import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { Player, defaultPlayer, calculatePlayerStats } from './player'
import { spawnEnemyForLevel } from './enemy'
import { simulateCombatTick } from './combat'
import { generateLoot } from './loot'
import { loadSave, saveState } from './save'

const initialState = {
  player: defaultPlayer(),
  enemies: [spawnEnemyForLevel(1)],
  inventory: [],
  log: [],
  skills: {}
}

function reducer(state, action) {
  switch(action.type) {
    case 'LOAD':
      return { ...state, ...action.payload }
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
        const loot = generateLoot(target.level, target.isBoss)
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
      const player = { ...state.player, equipped: item }
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
    default:
      return state
  }
}

const GameContext = createContext({
  state: initialState,
  actions: {},
  dispatch: () => {}
})

export function GameProvider({ children }) {
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

  const actions = {
    spawnEnemy: (level, kind) => dispatch({ type: 'SPAWN', payload: { level, kind } }),
    simulateTick: (enemyId) => dispatch({ type: 'TICK', payload: { enemyId } }),
    removeEnemy: (id) => dispatch({ type: 'REMOVE', payload: id }),
    equipItem: (id) => dispatch({ type: 'EQUIP', payload: id }),
    discardItem: (id) => dispatch({ type: 'DISCARD', payload: id }),
    upgradeSkill: (key) => dispatch({ type: 'UPGRADE_SKILL', payload: key }),
    resetAll: () => dispatch({ type: 'RESET' }),
    log: (m) => dispatch({ type: 'LOG', payload: m })
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
