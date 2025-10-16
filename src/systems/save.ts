import { Player } from './player'
import { Enemy } from './enemy'

const SAVE_KEY = 'idle-poe-phase2-save-v1'

interface SaveData {
  player: Player
  enemies: Enemy[]
  inventory: any[] // Keep as any[] for now since loot system returns mixed types
  skills: Record<string, number>
  __meta?: { lastSaved: number }
}

export function saveState(payload: Omit<SaveData, '__meta'>) {
  const toSave: SaveData = {...payload, __meta: { lastSaved: Date.now() }}
  localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
}

export function loadSave(): SaveData | null {
  try {
    const txt = localStorage.getItem(SAVE_KEY)
    if (!txt) return null
    return JSON.parse(txt) as SaveData
  } catch(e) {
    return null
  }
}
