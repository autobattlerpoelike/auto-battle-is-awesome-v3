// Cosmetic System Types
export interface CosmeticItem {
  id: string
  name: string
  description: string
  slot: CosmeticSlot
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  spriteId?: string
  unlockCondition?: UnlockCondition
  price?: number
  currency?: 'gold' | 'gems' | 'tokens'
  tags?: string[]
}

export type CosmeticSlot = 
  | 'back'        // Capes, wings, backpacks
  | 'head'        // Hats, crowns, masks (cosmetic only)
  | 'face'        // Face paint, tattoos, scars
  | 'body'        // Body paint, tattoos
  | 'aura'        // Magical auras, glows
  | 'trail'       // Movement trails, footsteps
  | 'pet'         // Companion pets
  | 'mount'       // Mounts for travel
  | 'weapon_skin' // Weapon appearance overrides
  | 'armor_skin'  // Armor appearance overrides

export interface UnlockCondition {
  type: 'level' | 'achievement' | 'quest' | 'purchase' | 'event' | 'time_played'
  value: number | string
  description: string
}

export interface CosmeticCollection {
  owned: string[]           // IDs of owned cosmetics
  equipped: Record<CosmeticSlot, string | null> // Currently equipped cosmetics
  favorites: string[]       // Favorited cosmetics
  unlocked: string[]        // Unlocked but not purchased cosmetics
}

export interface CharacterCustomization {
  baseCharacter: string     // Character model ID
  cosmetics: CosmeticCollection
  colorOverrides: Record<string, string> // Part -> color hex
  preferences: {
    autoEquipNewCosmetics: boolean
    showCosmeticsInCombat: boolean
    cosmeticAnimationSpeed: number
  }
}

// Predefined cosmetic items
export const COSMETIC_ITEMS: Record<string, CosmeticItem> = {
  red_cape: {
    id: 'red_cape',
    name: 'Crimson Cape',
    description: 'A flowing red cape that billows dramatically in the wind.',
    slot: 'back',
    rarity: 'common',
    spriteId: 'red_cape',
    unlockCondition: {
      type: 'level',
      value: 5,
      description: 'Reach level 5'
    },
    tags: ['cape', 'red', 'flowing']
  },
  blue_cape: {
    id: 'blue_cape',
    name: 'Azure Mantle',
    description: 'A mystical blue cape imbued with arcane energy.',
    slot: 'back',
    rarity: 'uncommon',
    spriteId: 'blue_cape',
    unlockCondition: {
      type: 'level',
      value: 15,
      description: 'Reach level 15'
    },
    tags: ['cape', 'blue', 'magical']
  },
  golden_aura: {
    id: 'golden_aura',
    name: 'Golden Radiance',
    description: 'A shimmering golden aura that surrounds your character.',
    slot: 'aura',
    rarity: 'rare',
    unlockCondition: {
      type: 'achievement',
      value: 'defeat_100_enemies',
      description: 'Defeat 100 enemies'
    },
    tags: ['aura', 'golden', 'radiance']
  },
  shadow_trail: {
    id: 'shadow_trail',
    name: 'Shadow Steps',
    description: 'Leave dark, smoky footprints wherever you walk.',
    slot: 'trail',
    rarity: 'epic',
    unlockCondition: {
      type: 'achievement',
      value: 'stealth_master',
      description: 'Complete 50 battles without taking damage'
    },
    tags: ['trail', 'shadow', 'stealth']
  },
  flame_weapon_skin: {
    id: 'flame_weapon_skin',
    name: 'Flaming Blade',
    description: 'Your weapons burn with eternal flames.',
    slot: 'weapon_skin',
    rarity: 'legendary',
    unlockCondition: {
      type: 'achievement',
      value: 'fire_master',
      description: 'Deal 10,000 fire damage'
    },
    tags: ['weapon', 'fire', 'flames']
  }
}

// Helper functions for cosmetic management
export function getCosmeticsBySlot(slot: CosmeticSlot): CosmeticItem[] {
  return Object.values(COSMETIC_ITEMS).filter(item => item.slot === slot)
}

export function getCosmeticsByRarity(rarity: CosmeticItem['rarity']): CosmeticItem[] {
  return Object.values(COSMETIC_ITEMS).filter(item => item.rarity === rarity)
}

export function isUnlocked(cosmetic: CosmeticItem, player: any): boolean {
  if (!cosmetic.unlockCondition) return true

  const condition = cosmetic.unlockCondition
  
  switch (condition.type) {
    case 'level':
      return player.level >= (condition.value as number)
    
    case 'achievement':
      return player.achievements?.includes(condition.value as string) || false
    
    case 'quest':
      return player.completedQuests?.includes(condition.value as string) || false
    
    case 'time_played':
      return (player.timePlayed || 0) >= (condition.value as number)
    
    case 'purchase':
    case 'event':
    default:
      return false
  }
}

export function getUnlockedCosmetics(player: any): CosmeticItem[] {
  return Object.values(COSMETIC_ITEMS).filter(cosmetic => isUnlocked(cosmetic, player))
}

export function getRarityColor(rarity: CosmeticItem['rarity']): string {
  const colors = {
    common: '#9CA3AF',     // Gray
    uncommon: '#10B981',   // Green
    rare: '#3B82F6',       // Blue
    epic: '#8B5CF6',       // Purple
    legendary: '#F59E0B'   // Orange/Gold
  }
  return colors[rarity]
}