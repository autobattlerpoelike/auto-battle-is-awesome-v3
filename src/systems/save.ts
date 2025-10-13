const SAVE_KEY = 'idle-poe-phase2-save-v1'

export function saveState(payload:any) {
  const toSave = {...payload, __meta: { lastSaved: Date.now() }}
  localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
}

export function loadSave(): any | null {
  try {
    const txt = localStorage.getItem(SAVE_KEY)
    if (!txt) return null
    return JSON.parse(txt)
  } catch(e) {
    return null
  }
}
