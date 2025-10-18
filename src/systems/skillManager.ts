// Skill Management System

import { Player } from './player'
import { 
  SkillGem, 
  SupportGem, 
  SkillBar, 
  getSkillLevelUpCost, 
  canLevelUpSkill,
  getSkillUnlockCost,
  getScaledSkillDamage,
  getScaledManaCost,
  getScaledCooldown,
  getScaledArea,
  getScaledDuration,
  getScaledSupportGemValue,
  getScaledSupportGemModifiers
} from './skillGems'

export interface SkillUnlockResult {
  success: boolean
  message: string
  updatedPlayer?: Player
}

export interface SkillEquipResult {
  success: boolean
  message: string
  updatedPlayer?: Player
}

export interface SkillLevelUpResult {
  success: boolean
  message: string
  updatedPlayer?: Player
}

// Skill Unlocking Functions
export function unlockSkillGem(player: Player, skillId: string): SkillUnlockResult {
  const skill = player.skillGems.find(s => s.id === skillId)
  
  if (!skill) {
    return { success: false, message: 'Skill not found' }
  }
  
  if (skill.isUnlocked) {
    return { success: false, message: 'Skill is already unlocked' }
  }
  
  if (player.level < skill.unlockLevel) {
    return { 
      success: false, 
      message: `Requires player level ${skill.unlockLevel}` 
    }
  }
  
  const cost = getSkillUnlockCost(skill)
  if (player.skillPoints < cost) {
    return { 
      success: false, 
      message: `Requires ${cost} skill points (you have ${player.skillPoints})` 
    }
  }
  
  // Create updated player
  const updatedPlayer = { ...player }
  updatedPlayer.skillPoints -= cost
  
  // Update the skill
  const skillIndex = updatedPlayer.skillGems.findIndex(s => s.id === skillId)
  updatedPlayer.skillGems[skillIndex] = { ...skill, isUnlocked: true }
  
  return {
    success: true,
    message: `${skill.name} unlocked!`,
    updatedPlayer
  }
}

export function unlockSupportGem(player: Player, supportId: string): SkillUnlockResult {
  const support = player.supportGems.find(s => s.id === supportId)
  
  if (!support) {
    return { success: false, message: 'Support gem not found' }
  }
  
  if (support.isUnlocked) {
    return { success: false, message: 'Support gem is already unlocked' }
  }
  
  if (player.level < support.unlockLevel) {
    return { 
      success: false, 
      message: `Requires player level ${support.unlockLevel}` 
    }
  }
  
  const cost = getSkillUnlockCost(support)
  if (player.skillPoints < cost) {
    return { 
      success: false, 
      message: `Requires ${cost} skill points (you have ${player.skillPoints})` 
    }
  }
  
  // Create updated player
  const updatedPlayer = { ...player }
  updatedPlayer.skillPoints -= cost
  
  // Update the support gem
  const supportIndex = updatedPlayer.supportGems.findIndex(s => s.id === supportId)
  updatedPlayer.supportGems[supportIndex] = { ...support, isUnlocked: true }
  
  return {
    success: true,
    message: `${support.name} unlocked!`,
    updatedPlayer
  }
}

// Skill Leveling Functions
export function levelUpSkillGem(player: Player, skillId: string): SkillLevelUpResult {
  const skill = player.skillGems.find(s => s.id === skillId)
  
  if (!skill) {
    return { success: false, message: 'Skill not found' }
  }
  
  if (!skill.isUnlocked) {
    return { success: false, message: 'Skill must be unlocked first' }
  }
  
  if (!canLevelUpSkill(skill, player.skillPoints)) {
    const cost = getSkillLevelUpCost(skill.level)
    if (skill.level >= skill.maxLevel) {
      return { success: false, message: 'Skill is already at maximum level' }
    }
    return { 
      success: false, 
      message: `Requires ${cost} skill points (you have ${player.skillPoints})` 
    }
  }
  
  const cost = getSkillLevelUpCost(skill.level)
  
  // Create updated player
  const updatedPlayer = { ...player }
  updatedPlayer.skillPoints -= cost
  
  // Update the skill
  const skillIndex = updatedPlayer.skillGems.findIndex(s => s.id === skillId)
  updatedPlayer.skillGems[skillIndex] = { 
    ...skill, 
    level: skill.level + 1 
  }
  
  return {
    success: true,
    message: `${skill.name} leveled up to ${skill.level + 1}!`,
    updatedPlayer
  }
}

export function levelUpSupportGem(player: Player, supportId: string): SkillLevelUpResult {
  const support = player.supportGems.find(s => s.id === supportId)
  
  if (!support) {
    return { success: false, message: 'Support gem not found' }
  }
  
  if (!support.isUnlocked) {
    return { success: false, message: 'Support gem must be unlocked first' }
  }
  
  if (!canLevelUpSkill(support, player.skillPoints)) {
    const cost = getSkillLevelUpCost(support.level)
    if (support.level >= support.maxLevel) {
      return { success: false, message: 'Support gem is already at maximum level' }
    }
    return { 
      success: false, 
      message: `Requires ${cost} skill points (you have ${player.skillPoints})` 
    }
  }
  
  const cost = getSkillLevelUpCost(support.level)
  
  // Create updated player
  const updatedPlayer = { ...player }
  updatedPlayer.skillPoints -= cost
  
  // Update the support gem
  const supportIndex = updatedPlayer.supportGems.findIndex(s => s.id === supportId)
  updatedPlayer.supportGems[supportIndex] = { 
    ...support, 
    level: support.level + 1 
  }
  
  return {
    success: true,
    message: `${support.name} leveled up to ${support.level + 1}!`,
    updatedPlayer
  }
}

// Skill Bar Management Functions
export function equipSkillToBar(player: Player, skillId: string, slotIndex: number): SkillEquipResult {
  if (slotIndex < 0 || slotIndex >= player.skillBar.maxSlots) {
    return { 
      success: false, 
      message: `Invalid slot index. Must be between 0 and ${player.skillBar.maxSlots - 1}` 
    }
  }
  
  const skill = player.skillGems.find(s => s.id === skillId)
  
  if (!skill) {
    return { success: false, message: 'Skill not found' }
  }
  
  if (!skill.isUnlocked) {
    return { success: false, message: 'Skill must be unlocked first' }
  }
  
  // Create updated player
  const updatedPlayer = { ...player }
  
  // Remove skill from any existing slot
  updatedPlayer.skillBar.slots = updatedPlayer.skillBar.slots.map(slot => 
    slot?.id === skillId ? null : slot
  )
  
  // Update skill equipped status
  updatedPlayer.skillGems = updatedPlayer.skillGems.map(s => 
    s.id === skillId ? { ...s, isEquipped: true } : s
  )
  
  // If there's already a skill in the target slot, unequip it
  const existingSkill = updatedPlayer.skillBar.slots[slotIndex]
  if (existingSkill) {
    updatedPlayer.skillGems = updatedPlayer.skillGems.map(s => 
      s.id === existingSkill.id ? { ...s, isEquipped: false } : s
    )
  }
  
  // Equip the skill to the slot
  updatedPlayer.skillBar.slots[slotIndex] = { ...skill, isEquipped: true }
  
  return {
    success: true,
    message: `${skill.name} equipped to slot ${slotIndex + 1}`,
    updatedPlayer
  }
}

export function unequipSkillFromBar(player: Player, slotIndex: number): SkillEquipResult {
  console.log(`🔧 unequipSkillFromBar called with slotIndex: ${slotIndex}`)
  
  if (slotIndex < 0 || slotIndex >= player.skillBar.maxSlots) {
    console.log(`❌ Invalid slot index: ${slotIndex}`)
    return { 
      success: false, 
      message: `Invalid slot index. Must be between 0 and ${player.skillBar.maxSlots - 1}` 
    }
  }
  
  const skill = player.skillBar.slots[slotIndex]
  console.log(`🔧 Skill in slot ${slotIndex}:`, skill)
  
  if (!skill) {
    console.log(`❌ No skill equipped in slot ${slotIndex}`)
    return { success: false, message: 'No skill equipped in this slot' }
  }
  
  // Create updated player
  const updatedPlayer = { ...player }
  console.log(`🔧 Creating updated player for unequipping ${skill.name}`)
  
  // Remove skill from slot
  updatedPlayer.skillBar.slots[slotIndex] = null
  console.log(`🔧 Removed skill from slot ${slotIndex}`)
  
  // Update skill equipped status
  updatedPlayer.skillGems = updatedPlayer.skillGems.map(s => 
    s.id === skill.id ? { ...s, isEquipped: false } : s
  )
  console.log(`🔧 Updated skill equipped status for ${skill.name}`)
  
  console.log(`✅ Successfully unequipped ${skill.name} from slot ${slotIndex + 1}`)
  return {
    success: true,
    message: `${skill.name} unequipped from slot ${slotIndex + 1}`,
    updatedPlayer
  }
}

// Support Gem Management Functions
export function attachSupportGem(player: Player, skillId: string, supportId: string): SkillEquipResult {
  const skill = player.skillGems.find(s => s.id === skillId)
  const support = player.supportGems.find(s => s.id === supportId)
  
  if (!skill) {
    return { success: false, message: 'Skill not found' }
  }
  
  if (!support) {
    return { success: false, message: 'Support gem not found' }
  }
  
  if (!skill.isUnlocked) {
    return { success: false, message: 'Skill must be unlocked first' }
  }
  
  if (!support.isUnlocked) {
    return { success: false, message: 'Support gem must be unlocked first' }
  }
  
  if (skill.supportGems.length >= 6) {
    return { success: false, message: 'Skill already has maximum support gems (6)' }
  }
  
  if (skill.supportGems.some(s => s.id === supportId)) {
    return { success: false, message: 'Support gem is already attached to this skill' }
  }
  
  // Check tag compatibility - support gem must have at least one matching tag with the skill
  const hasMatchingTag = support.tags.some(supportTag => skill.tags.includes(supportTag))
  if (!hasMatchingTag) {
    return { 
      success: false, 
      message: `${support.name} is not compatible with ${skill.name}. Support gem tags (${support.tags.join(', ')}) must match at least one skill tag (${skill.tags.join(', ')}).` 
    }
  }
  
  // Create updated player
  const updatedPlayer = { ...player }
  
  // Update the skill with the new support gem
  const skillIndex = updatedPlayer.skillGems.findIndex(s => s.id === skillId)
  updatedPlayer.skillGems[skillIndex] = {
    ...skill,
    supportGems: [...skill.supportGems, support]
  }
  
  // Update skill bar if this skill is equipped
  const barSlotIndex = updatedPlayer.skillBar.slots.findIndex(s => s?.id === skillId)
  if (barSlotIndex !== -1) {
    updatedPlayer.skillBar.slots[barSlotIndex] = updatedPlayer.skillGems[skillIndex]
  }
  
  return {
    success: true,
    message: `${support.name} attached to ${skill.name}`,
    updatedPlayer
  }
}

export function detachSupportGem(player: Player, skillId: string, supportId: string): SkillEquipResult {
  const skill = player.skillGems.find(s => s.id === skillId)
  
  if (!skill) {
    return { success: false, message: 'Skill not found' }
  }
  
  const supportIndex = skill.supportGems.findIndex(s => s.id === supportId)
  if (supportIndex === -1) {
    return { success: false, message: 'Support gem is not attached to this skill' }
  }
  
  const support = skill.supportGems[supportIndex]
  
  // Create updated player
  const updatedPlayer = { ...player }
  
  // Update the skill by removing the support gem
  const skillIndex = updatedPlayer.skillGems.findIndex(s => s.id === skillId)
  updatedPlayer.skillGems[skillIndex] = {
    ...skill,
    supportGems: skill.supportGems.filter(s => s.id !== supportId)
  }
  
  // Update skill bar if this skill is equipped
  const barSlotIndex = updatedPlayer.skillBar.slots.findIndex(s => s?.id === skillId)
  if (barSlotIndex !== -1) {
    updatedPlayer.skillBar.slots[barSlotIndex] = updatedPlayer.skillGems[skillIndex]
  }
  
  return {
    success: true,
    message: `${support.name} detached from ${skill.name}`,
    updatedPlayer
  }
}

// Utility Functions
export function getAvailableSkills(player: Player): SkillGem[] {
  return player.skillGems.filter(skill => 
    !skill.isUnlocked && player.level >= skill.unlockLevel
  )
}

export function getUnlockedSkills(player: Player): SkillGem[] {
  return player.skillGems.filter(skill => skill.isUnlocked)
}

export function getEquippedSkills(player: Player): SkillGem[] {
  return player.skillGems.filter(skill => skill.isEquipped)
}

export function getAvailableSupportGems(player: Player): SupportGem[] {
  return player.supportGems.filter(support => 
    !support.isUnlocked && player.level >= support.unlockLevel
  )
}

export function getUnlockedSupportGems(player: Player): SupportGem[] {
  return player.supportGems.filter(support => support.isUnlocked)
}

export function canUseSkill(player: Player, skillId: string): boolean {
  const skill = player.skillGems.find(s => s.id === skillId)
  if (!skill || !skill.isUnlocked || !skill.isEquipped) {
    return false
  }
  
  // Check mana cost
  const manaCost = skill.manaCost // TODO: Apply support gem modifiers
  return player.mana >= manaCost
}