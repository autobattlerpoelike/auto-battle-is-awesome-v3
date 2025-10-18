// Passive Skill Tree System
import { EquipmentStats } from './equipment'

export type PassiveNodeType = 'travel' | 'small' | 'notable'

export interface PassiveNode {
  id: string
  name: string
  description: string
  type: PassiveNodeType
  position: { x: number; y: number }
  connections: string[] // IDs of connected nodes
  requirements: string[] // IDs of prerequisite nodes
  stats: EquipmentStats
  skillModifiers?: SkillModifier[]
  cost: number // Passive skill points required
  maxRank: number
  icon?: string
}

export interface SkillModifier {
  skillId: string
  property: string
  value: number
  type: 'additive' | 'multiplicative' | 'override'
}

export interface PassiveTreeState {
  allocatedNodes: Record<string, number> // nodeId -> rank
  availablePoints: number
}

export interface PassiveTreeData {
  nodes: Record<string, PassiveNode>
  startingNode: string
  clusters: PassiveCluster[]
}

export interface PassiveCluster {
  id: string
  name: string
  centerPosition: { x: number; y: number }
  nodeIds: string[]
  theme: 'combat' | 'defense' | 'magic' | 'utility' | 'attributes'
}

// Generate the initial passive tree with 150 nodes
export function generatePassiveTree(): PassiveTreeData {
  const nodes: Record<string, PassiveNode> = {}
  const clusters: PassiveCluster[] = []
  
  // Starting node
  const startingNode: PassiveNode = {
    id: 'start',
    name: 'Origin',
    description: 'The beginning of your journey',
    type: 'travel',
    position: { x: 0, y: 0 },
    connections: ['str_path_1', 'dex_path_1', 'int_path_1', 'vit_path_1'],
    requirements: [],
    stats: {},
    cost: 0,
    maxRank: 1
  }
  nodes[startingNode.id] = startingNode
  
  // Generate main attribute paths
  generateStrengthPath(nodes)
  generateDexterityPath(nodes)
  generateIntelligencePath(nodes)
  generateVitalityPath(nodes)
  
  // Generate combat clusters
  generateCombatClusters(nodes, clusters)
  
  // Generate defense clusters
  generateDefenseClusters(nodes, clusters)
  
  // Generate magic clusters
  generateMagicClusters(nodes, clusters)
  
  // Generate utility clusters
  generateUtilityClusters(nodes, clusters)
  
  return {
    nodes,
    startingNode: 'start',
    clusters
  }
}

function generateStrengthPath(nodes: Record<string, PassiveNode>) {
  // Strength path - focused on damage and health
  const strengthNodes = [
    {
      id: 'str_path_1',
      name: 'Might',
      description: '+5 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 100, y: 0 },
      connections: ['start', 'str_small_1'],
      requirements: ['start'],
      stats: { strength: 5 }
    },
    {
      id: 'str_small_1',
      name: 'Physical Power',
      description: '+3% increased damage',
      type: 'small' as PassiveNodeType,
      position: { x: 150, y: 0 },
      connections: ['str_path_1', 'str_notable_1'],
      requirements: ['str_path_1'],
      stats: { damage: 0.03 }
    },
    {
      id: 'str_notable_1',
      name: 'Berserker\'s Rage',
      description: '+25% increased damage, +50 health',
      type: 'notable' as PassiveNodeType,
      position: { x: 200, y: 0 },
      connections: ['str_small_1', 'str_path_2'],
      requirements: ['str_small_1'],
      stats: { damage: 0.25, health: 50 }
    },
    {
      id: 'str_path_2',
      name: 'Fortitude',
      description: '+8 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 250, y: 0 },
      connections: ['str_notable_1', 'str_small_2'],
      requirements: ['str_notable_1'],
      stats: { strength: 8 }
    },
    {
      id: 'str_small_2',
      name: 'Weapon Mastery',
      description: '+5% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 300, y: 0 },
      connections: ['str_path_2', 'str_notable_2'],
      requirements: ['str_path_2'],
      stats: { attackSpeed: 0.05 }
    },
    {
      id: 'str_notable_2',
      name: 'Devastating Blows',
      description: '+50% critical strike damage, +10% critical chance',
      type: 'notable' as PassiveNodeType,
      position: { x: 350, y: 0 },
      connections: ['str_small_2'],
      requirements: ['str_small_2'],
      stats: { critChance: 0.1 },
      skillModifiers: [
        { skillId: 'all', property: 'criticalDamage', value: 0.5, type: 'additive' as const }
      ]
    }
  ]
  
  strengthNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
  })
}

function generateDexterityPath(nodes: Record<string, PassiveNode>) {
  // Dexterity path - focused on speed and critical strikes
  const dexterityNodes = [
    {
      id: 'dex_path_1',
      name: 'Agility',
      description: '+5 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 100 },
      connections: ['start', 'dex_small_1'],
      requirements: ['start'],
      stats: { dexterity: 5 }
    },
    {
      id: 'dex_small_1',
      name: 'Swift Strikes',
      description: '+4% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: 150 },
      connections: ['dex_path_1', 'dex_notable_1'],
      requirements: ['dex_path_1'],
      stats: { attackSpeed: 0.04 }
    },
    {
      id: 'dex_notable_1',
      name: 'Precision',
      description: '+15% critical chance, +8% dodge chance',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: 200 },
      connections: ['dex_small_1', 'dex_path_2'],
      requirements: ['dex_small_1'],
      stats: { critChance: 0.15, dodgeChance: 0.08 }
    },
    {
      id: 'dex_path_2',
      name: 'Finesse',
      description: '+8 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 250 },
      connections: ['dex_notable_1', 'dex_small_2'],
      requirements: ['dex_notable_1'],
      stats: { dexterity: 8 }
    },
    {
      id: 'dex_small_2',
      name: 'Evasion',
      description: '+3% dodge chance',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: 300 },
      connections: ['dex_path_2', 'dex_notable_2'],
      requirements: ['dex_path_2'],
      stats: { dodgeChance: 0.03 }
    },
    {
      id: 'dex_notable_2',
      name: 'Shadow Dancer',
      description: '+20% dodge chance, +15% attack speed',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: 350 },
      connections: ['dex_small_2'],
      requirements: ['dex_small_2'],
      stats: { dodgeChance: 0.2, attackSpeed: 0.15 }
    }
  ]
  
  dexterityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
  })
}

function generateIntelligencePath(nodes: Record<string, PassiveNode>) {
  // Intelligence path - focused on mana and magical effects
  const intelligenceNodes = [
    {
      id: 'int_path_1',
      name: 'Wisdom',
      description: '+5 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -100, y: 0 },
      connections: ['start', 'int_small_1'],
      requirements: ['start'],
      stats: { intelligence: 5 }
    },
    {
      id: 'int_small_1',
      name: 'Mental Clarity',
      description: '+15 mana, +0.5 mana regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: -150, y: 0 },
      connections: ['int_path_1', 'int_notable_1'],
      requirements: ['int_path_1'],
      stats: { mana: 15, manaRegen: 0.5 }
    },
    {
      id: 'int_notable_1',
      name: 'Arcane Mastery',
      description: '+50 mana, +25% spell damage',
      type: 'notable' as PassiveNodeType,
      position: { x: -200, y: 0 },
      connections: ['int_small_1', 'int_path_2'],
      requirements: ['int_small_1'],
      stats: { mana: 50 },
      skillModifiers: [
        { skillId: 'fireball', property: 'damage', value: 0.25, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'damage', value: 0.25, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'damage', value: 0.25, type: 'additive' as const }
      ]
    },
    {
      id: 'int_path_2',
      name: 'Scholarly Pursuit',
      description: '+8 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -250, y: 0 },
      connections: ['int_notable_1', 'int_small_2'],
      requirements: ['int_notable_1'],
      stats: { intelligence: 8 }
    },
    {
      id: 'int_small_2',
      name: 'Mana Efficiency',
      description: '+1.0 mana regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: -300, y: 0 },
      connections: ['int_path_2', 'int_notable_2'],
      requirements: ['int_path_2'],
      stats: { manaRegen: 1.0 }
    },
    {
      id: 'int_notable_2',
      name: 'Elemental Convergence',
      description: '+50% area of effect for spells',
      type: 'notable' as PassiveNodeType,
      position: { x: -350, y: 0 },
      connections: ['int_small_2'],
      requirements: ['int_small_2'],
      stats: {},
      skillModifiers: [
        { skillId: 'fireball', property: 'area', value: 0.5, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'area', value: 0.5, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'area', value: 0.5, type: 'additive' as const }
      ]
    }
  ]
  
  intelligenceNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
  })
}

function generateVitalityPath(nodes: Record<string, PassiveNode>) {
  // Vitality path - focused on health and survivability
  const vitalityNodes = [
    {
      id: 'vit_path_1',
      name: 'Constitution',
      description: '+5 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -100 },
      connections: ['start', 'vit_small_1'],
      requirements: ['start'],
      stats: { vitality: 5 }
    },
    {
      id: 'vit_small_1',
      name: 'Robust Health',
      description: '+25 health',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: -150 },
      connections: ['vit_path_1', 'vit_notable_1'],
      requirements: ['vit_path_1'],
      stats: { health: 25 }
    },
    {
      id: 'vit_notable_1',
      name: 'Iron Will',
      description: '+100 health, +5 armor',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: -200 },
      connections: ['vit_small_1', 'vit_path_2'],
      requirements: ['vit_small_1'],
      stats: { health: 100, armor: 5 }
    },
    {
      id: 'vit_path_2',
      name: 'Endurance',
      description: '+8 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -250 },
      connections: ['vit_notable_1', 'vit_small_2'],
      requirements: ['vit_notable_1'],
      stats: { vitality: 8 }
    },
    {
      id: 'vit_small_2',
      name: 'Regeneration',
      description: '+1.0 health regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: -300 },
      connections: ['vit_path_2', 'vit_notable_2'],
      requirements: ['vit_path_2'],
      stats: { healthRegen: 1.0 }
    },
    {
      id: 'vit_notable_2',
      name: 'Undying',
      description: '+200 health, +3% life steal',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: -350 },
      connections: ['vit_small_2'],
      requirements: ['vit_small_2'],
      stats: { health: 200, lifeSteal: 0.03 }
    }
  ]
  
  vitalityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
  })
}

function generateCombatClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Combat cluster in the upper right
  const combatCluster: PassiveCluster = {
    id: 'combat_cluster_1',
    name: 'Weapon Expertise',
    centerPosition: { x: 200, y: -150 },
    nodeIds: [],
    theme: 'combat'
  }
  
  const combatNodes = [
    {
      id: 'combat_travel_1',
      name: 'Weapon Training',
      description: '+3% attack speed',
      type: 'travel' as PassiveNodeType,
      position: { x: 150, y: -100 },
      connections: ['str_path_1', 'combat_small_1'],
      requirements: ['str_path_1'], // Only requires str_path_1 as prerequisite
      stats: { attackSpeed: 0.03 }
    },
    {
      id: 'combat_small_1',
      name: 'Blade Dance',
      description: '+2% critical chance',
      type: 'small' as PassiveNodeType,
      position: { x: 180, y: -130 },
      connections: ['combat_travel_1', 'combat_notable_1'],
      requirements: ['combat_travel_1'], // Only requires combat_travel_1 as prerequisite
      stats: { critChance: 0.02 }
    },
    {
      id: 'combat_notable_1',
      name: 'Master of Arms',
      description: '+20% attack speed, +10% critical chance',
      type: 'notable' as PassiveNodeType,
      position: { x: 200, y: -150 },
      connections: ['combat_small_1', 'combat_small_2'],
      requirements: ['combat_small_1'], // Only requires combat_small_1 as prerequisite
      stats: { attackSpeed: 0.2, critChance: 0.1 }
    },
    {
      id: 'combat_small_2',
      name: 'Lethal Precision',
      description: '+3% critical chance',
      type: 'small' as PassiveNodeType,
      position: { x: 220, y: -170 },
      connections: ['combat_notable_1'],
      requirements: ['combat_notable_1'], // Only requires combat_notable_1 as prerequisite
      stats: { critChance: 0.03 }
    }
  ]
  
  combatNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
    combatCluster.nodeIds.push(node.id)
  })
  
  clusters.push(combatCluster)
}

function generateDefenseClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Defense cluster in the lower left
  const defenseCluster: PassiveCluster = {
    id: 'defense_cluster_1',
    name: 'Fortification',
    centerPosition: { x: -150, y: 150 },
    nodeIds: [],
    theme: 'defense'
  }
  
  const defenseNodes = [
    {
      id: 'defense_travel_1',
      name: 'Shield Training',
      description: '+2 armor',
      type: 'travel' as PassiveNodeType,
      position: { x: -100, y: 100 },
      connections: ['vit_path_1', 'defense_small_1'],
      requirements: ['vit_path_1'], // Only requires vit_path_1 as prerequisite
      stats: { armor: 2 }
    },
    {
      id: 'defense_small_1',
      name: 'Thick Skin',
      description: '+3 armor',
      type: 'small' as PassiveNodeType,
      position: { x: -130, y: 130 },
      connections: ['defense_travel_1', 'defense_notable_1'],
      requirements: ['defense_travel_1'], // Only requires defense_travel_1 as prerequisite
      stats: { armor: 3 }
    },
    {
      id: 'defense_notable_1',
      name: 'Fortress',
      description: '+15 armor, +5% block chance',
      type: 'notable' as PassiveNodeType,
      position: { x: -150, y: 150 },
      connections: ['defense_small_1', 'defense_small_2'],
      requirements: ['defense_small_1'], // Only requires defense_small_1 as prerequisite
      stats: { armor: 15, blockChance: 0.05 }
    },
    {
      id: 'defense_small_2',
      name: 'Damage Reduction',
      description: '+5 armor',
      type: 'small' as PassiveNodeType,
      position: { x: -170, y: 170 },
      connections: ['defense_notable_1'],
      requirements: ['defense_notable_1'], // Only requires defense_notable_1 as prerequisite
      stats: { armor: 5 }
    }
  ]
  
  defenseNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
    defenseCluster.nodeIds.push(node.id)
  })
  
  clusters.push(defenseCluster)
}

function generateMagicClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Magic cluster connecting intelligence path
  const magicCluster: PassiveCluster = {
    id: 'magic_cluster_1',
    name: 'Elemental Mastery',
    centerPosition: { x: -200, y: -150 },
    nodeIds: [],
    theme: 'magic'
  }
  
  const magicNodes = [
    {
      id: 'magic_travel_1',
      name: 'Elemental Affinity',
      description: '+10 mana',
      type: 'travel' as PassiveNodeType,
      position: { x: -150, y: -100 },
      connections: ['int_path_1', 'magic_small_1'],
      requirements: ['int_path_1'], // Only requires int_path_1 as prerequisite
      stats: { mana: 10 }
    },
    {
      id: 'magic_small_1',
      name: 'Spell Power',
      description: '+5% spell damage',
      type: 'small' as PassiveNodeType,
      position: { x: -180, y: -130 },
      connections: ['magic_travel_1', 'magic_notable_1'],
      requirements: ['magic_travel_1'], // Only requires magic_travel_1 as prerequisite
      stats: {},
      skillModifiers: [
        { skillId: 'fireball', property: 'damage', value: 0.05, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'damage', value: 0.05, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'damage', value: 0.05, type: 'additive' as const }
      ]
    },
    {
      id: 'magic_notable_1',
      name: 'Elemental Overload',
      description: '+30% spell damage, -10% mana costs',
      type: 'notable' as PassiveNodeType,
      position: { x: -200, y: -150 },
      connections: ['magic_small_1', 'magic_small_2'],
      requirements: ['magic_small_1'], // Only requires magic_small_1 as prerequisite
      stats: {},
      skillModifiers: [
        { skillId: 'fireball', property: 'damage', value: 0.3, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'damage', value: 0.3, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'damage', value: 0.3, type: 'additive' as const },
        { skillId: 'fireball', property: 'manaCost', value: -0.1, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'manaCost', value: -0.1, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'manaCost', value: -0.1, type: 'additive' as const }
      ]
    },
    {
      id: 'magic_small_2',
      name: 'Mana Efficiency',
      description: '+0.8 mana regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: -220, y: -170 },
      connections: ['magic_notable_1'],
      requirements: ['magic_notable_1'], // Only requires magic_notable_1 as prerequisite
      stats: { manaRegen: 0.8 }
    }
  ]
  
  magicNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
    magicCluster.nodeIds.push(node.id)
  })
  
  clusters.push(magicCluster)
}

function generateUtilityClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Utility cluster for quality of life improvements
  const utilityCluster: PassiveCluster = {
    id: 'utility_cluster_1',
    name: 'Fortune\'s Favor',
    centerPosition: { x: 150, y: 150 },
    nodeIds: [],
    theme: 'utility'
  }
  
  const utilityNodes = [
    {
      id: 'utility_travel_1',
      name: 'Lucky Find',
      description: '+2 luck',
      type: 'travel' as PassiveNodeType,
      position: { x: 100, y: 100 },
      connections: ['dex_path_1', 'utility_small_1'],
      requirements: ['dex_path_1'], // Only requires dex_path_1 as prerequisite
      stats: { luck: 2 }
    },
    {
      id: 'utility_small_1',
      name: 'Treasure Hunter',
      description: '+8% magic find',
      type: 'small' as PassiveNodeType,
      position: { x: 130, y: 130 },
      connections: ['utility_travel_1', 'utility_notable_1'],
      requirements: ['utility_travel_1'], // Only requires utility_travel_1 as prerequisite
      stats: { magicFind: 0.08 }
    },
    {
      id: 'utility_notable_1',
      name: 'Master Looter',
      description: '+25% magic find, +20% gold find',
      type: 'notable' as PassiveNodeType,
      position: { x: 150, y: 150 },
      connections: ['utility_small_1', 'utility_small_2'],
      requirements: ['utility_small_1'], // Only requires utility_small_1 as prerequisite
      stats: { magicFind: 0.25, goldFind: 0.2 }
    },
    {
      id: 'utility_small_2',
      name: 'Experience Gain',
      description: '+12% experience bonus',
      type: 'small' as PassiveNodeType,
      position: { x: 170, y: 170 },
      connections: ['utility_notable_1'],
      requirements: ['utility_notable_1'], // Only requires utility_notable_1 as prerequisite
      stats: { experienceBonus: 0.12 }
    }
  ]
  
  utilityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: nodeData.type === 'notable' ? 3 : 1,
      maxRank: 1
    }
    nodes[node.id] = node
    utilityCluster.nodeIds.push(node.id)
  })
  
  clusters.push(utilityCluster)
}

// Helper functions for passive tree management
export function canAllocateNode(
  nodeId: string,
  treeData: PassiveTreeData,
  treeState: PassiveTreeState
): boolean {
  const node = treeData.nodes[nodeId]
  if (!node) return false
  
  // Check if already allocated
  if (treeState.allocatedNodes[nodeId] >= node.maxRank) return false
  
  // Check if player has enough points
  if (treeState.availablePoints < node.cost) return false
  
  // Check prerequisites
  if (node.requirements.length === 0) return true // Starting node
  
  return node.requirements.every(reqId => 
    treeState.allocatedNodes[reqId] > 0
  )
}

export function allocateNode(
  nodeId: string,
  treeData: PassiveTreeData,
  treeState: PassiveTreeState
): PassiveTreeState {
  if (!canAllocateNode(nodeId, treeData, treeState)) {
    return treeState
  }
  
  const node = treeData.nodes[nodeId]
  const newState = { ...treeState }
  
  newState.allocatedNodes = {
    ...newState.allocatedNodes,
    [nodeId]: (newState.allocatedNodes[nodeId] || 0) + 1
  }
  newState.availablePoints -= node.cost
  
  return newState
}

export function calculatePassiveTreeStats(
  treeData: PassiveTreeData,
  treeState: PassiveTreeState
): EquipmentStats {
  const stats: EquipmentStats = {}
  
  Object.entries(treeState.allocatedNodes).forEach(([nodeId, rank]) => {
    if (rank > 0) {
      const node = treeData.nodes[nodeId]
      if (node) {
        // Apply node stats
        Object.entries(node.stats).forEach(([stat, value]) => {
          if (typeof value === 'number') {
            stats[stat as keyof EquipmentStats] = 
              (stats[stat as keyof EquipmentStats] as number || 0) + (value * rank)
          }
        })
      }
    }
  })
  
  return stats
}

export function getSkillModifiersFromTree(
  treeData: PassiveTreeData,
  treeState: PassiveTreeState
): SkillModifier[] {
  const modifiers: SkillModifier[] = []
  
  Object.entries(treeState.allocatedNodes).forEach(([nodeId, rank]) => {
    if (rank > 0) {
      const node = treeData.nodes[nodeId]
      if (node && node.skillModifiers) {
        node.skillModifiers.forEach(modifier => {
          modifiers.push({
            ...modifier,
            value: modifier.value * rank
          })
        })
      }
    }
  })
  
  return modifiers
}