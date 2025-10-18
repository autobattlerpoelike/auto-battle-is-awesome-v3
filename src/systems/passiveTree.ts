// Passive Skill Tree System - Expanded to 1000 Nodes
import { EquipmentStats } from './equipment'

export type PassiveNodeType = 'travel' | 'small' | 'notable' | 'keystone' | 'mastery'

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
  tier?: number // For scaling purposes (1-10)
  archetype?: string // Visual grouping indicator
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
  archetypes: ArchetypeInfo[]
}

export interface ArchetypeInfo {
  id: string
  name: string
  description: string
  color: string
  position: { x: number; y: number }
  radius: number
}

export interface PassiveCluster {
  id: string
  name: string
  centerPosition: { x: number; y: number }
  nodeIds: string[]
  theme: 'combat' | 'defense' | 'magic' | 'utility' | 'attributes' | 'elemental' | 'critical' | 'speed' | 'survival' | 'mastery'
  tier: number // 1-10 for progression scaling
  archetype: string
}

// Generate the massive passive tree with 1000 nodes
export function generatePassiveTree(): PassiveTreeData {
  const nodes: Record<string, PassiveNode> = {}
  const clusters: PassiveCluster[] = []
  
  // Define archetype areas for better organization
  const archetypes: ArchetypeInfo[] = [
    {
      id: 'combat',
      name: 'Combat Mastery',
      description: 'Damage, attack speed, critical strikes, and attack modifiers',
      color: '#ef4444',
      position: { x: 300, y: -200 },
      radius: 250
    },
    {
      id: 'defense',
      name: 'Defensive Arts',
      description: 'Health, armor, resistances, and survival',
      color: '#3b82f6',
      position: { x: -300, y: -200 },
      radius: 250
    },
    {
      id: 'utility',
      name: 'Utility & Wealth',
      description: 'Experience gain, gold find, magic find, and loot bonuses',
      color: '#10b981',
      position: { x: 300, y: 200 },
      radius: 250
    },
    {
      id: 'magic',
      name: 'Arcane Arts',
      description: 'Spell damage, mana, elemental effects, and magical abilities',
      color: '#8b5cf6',
      position: { x: -300, y: 200 },
      radius: 250
    },
    {
      id: 'mastery',
      name: 'Ultimate Mastery',
      description: 'Endgame keystones and transcendent abilities',
      color: '#f59e0b',
      position: { x: 0, y: 0 },
      radius: 150
    }
  ]
  
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
    maxRank: 1,
    tier: 1,
    archetype: 'mastery'
  }
  nodes[startingNode.id] = startingNode
  
  // Generate main attribute paths (expanded)
  generateExpandedStrengthPath(nodes)
  generateExpandedDexterityPath(nodes)
  generateExpandedIntelligencePath(nodes)
  generateExpandedVitalityPath(nodes)
  
  // Generate tier 1-3 clusters (early game)
  generateEarlyGameClusters(nodes, clusters)
  
  // Generate tier 4-6 clusters (mid game)
  generateMidGameClusters(nodes, clusters)
  
  // Generate tier 7-9 clusters (late game)
  generateLateGameClusters(nodes, clusters)
  
  // Generate tier 10 clusters (endgame mastery)
  generateEndGameClusters(nodes, clusters)
  
  // Generate specialized paths
  generateElementalMasteryPaths(nodes, clusters)
  generateCriticalStrikePaths(nodes, clusters)
  generateSurvivalPaths(nodes, clusters)
  generateSpeedPaths(nodes, clusters)
  
  // Generate cross-connections between paths
  generateCrossConnections(nodes)
  
  return {
    nodes,
    startingNode: 'start',
    clusters,
    archetypes
  }
}

function generateExpandedStrengthPath(nodes: Record<string, PassiveNode>) {
  // Tier 1-3 Strength Path
  const strengthNodes = [
    // Tier 1
    {
      id: 'str_path_1',
      name: 'Might',
      description: '+5 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 100, y: 0 },
      connections: ['start', 'str_small_1'],
      requirements: ['start'],
      stats: { strength: 5 },
      tier: 1
    },
    {
      id: 'str_small_1',
      name: 'Physical Power',
      description: '+3% increased damage',
      type: 'small' as PassiveNodeType,
      position: { x: 150, y: 0 },
      connections: ['str_path_1', 'str_notable_1'],
      requirements: ['str_path_1'],
      stats: { damage: 0.03 },
      tier: 1
    },
    {
      id: 'str_notable_1',
      name: 'Berserker\'s Rage',
      description: '+25% increased damage, +50 health',
      type: 'notable' as PassiveNodeType,
      position: { x: 200, y: 0 },
      connections: ['str_small_1', 'str_path_2'],
      requirements: ['str_small_1'],
      stats: { damage: 0.25, health: 50 },
      tier: 1
    },
    
    // Tier 2
    {
      id: 'str_path_2',
      name: 'Fortitude',
      description: '+8 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 250, y: 0 },
      connections: ['str_notable_1', 'str_small_2'],
      requirements: ['str_notable_1'],
      stats: { strength: 8 },
      tier: 2
    },
    {
      id: 'str_small_2',
      name: 'Weapon Mastery',
      description: '+5% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 300, y: 0 },
      connections: ['str_path_2', 'str_notable_2'],
      requirements: ['str_path_2'],
      stats: { attackSpeed: 0.05 },
      tier: 2
    },
    {
      id: 'str_notable_2',
      name: 'Devastating Blows',
      description: '+50% critical strike damage, +10% critical chance',
      type: 'notable' as PassiveNodeType,
      position: { x: 350, y: 0 },
      connections: ['str_small_2', 'str_path_3'],
      requirements: ['str_small_2'],
      stats: { critChance: 0.1 },
      skillModifiers: [
        { skillId: 'all', property: 'criticalDamage', value: 0.5, type: 'additive' as const }
      ],
      tier: 2
    },
    
    // Tier 3
    {
      id: 'str_path_3',
      name: 'Warrior\'s Resolve',
      description: '+12 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 400, y: 0 },
      connections: ['str_notable_2', 'str_small_3'],
      requirements: ['str_notable_2'],
      stats: { strength: 12 },
      tier: 3
    },
    {
      id: 'str_small_3',
      name: 'Brutal Efficiency',
      description: '+8% damage, +3% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 450, y: 0 },
      connections: ['str_path_3', 'str_notable_3'],
      requirements: ['str_path_3'],
      stats: { damage: 0.08, attackSpeed: 0.03 },
      tier: 3
    },
    {
      id: 'str_notable_3',
      name: 'Unstoppable Force',
      description: '+100% damage, +100 health, +5% life steal',
      type: 'notable' as PassiveNodeType,
      position: { x: 500, y: 0 },
      connections: ['str_small_3', 'str_keystone_1'],
      requirements: ['str_small_3'],
      stats: { damage: 1.0, health: 100, lifeSteal: 0.05 },
      tier: 3
    },
    
    // Tier 4 - Keystone
    {
      id: 'str_keystone_1',
      name: 'Avatar of Strength',
      description: '+20 Strength, +200% damage, +200 health, but -50% attack speed',
      type: 'keystone' as PassiveNodeType,
      position: { x: 550, y: 0 },
      connections: ['str_notable_3', 'str_mastery_path'],
      requirements: ['str_notable_3'],
      stats: { strength: 20, damage: 2.0, health: 200, attackSpeed: -0.5 },
      tier: 4
    },
    
    // Tier 5+ - Mastery Path
    {
      id: 'str_mastery_path',
      name: 'Path to Mastery',
      description: '+15 Strength',
      type: 'travel' as PassiveNodeType,
      position: { x: 600, y: 0 },
      connections: ['str_keystone_1', 'str_mastery_1'],
      requirements: ['str_keystone_1'],
      stats: { strength: 15 },
      tier: 5
    },
    {
      id: 'str_mastery_1',
      name: 'Strength Mastery I',
      description: '+25 Strength, +150% damage',
      type: 'mastery' as PassiveNodeType,
      position: { x: 650, y: 0 },
      connections: ['str_mastery_path', 'str_mastery_2'],
      requirements: ['str_mastery_path'],
      stats: { strength: 25, damage: 1.5 },
      tier: 5
    },
    {
      id: 'str_mastery_2',
      name: 'Strength Mastery II',
      description: '+35 Strength, +250% damage, +10% life steal',
      type: 'mastery' as PassiveNodeType,
      position: { x: 700, y: 0 },
      connections: ['str_mastery_1'],
      requirements: ['str_mastery_1'],
      stats: { strength: 35, damage: 2.5, lifeSteal: 0.1 },
      tier: 6
    }
  ]
  
  strengthNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
  })
}

function generateExpandedDexterityPath(nodes: Record<string, PassiveNode>) {
  const dexterityNodes = [
    // Tier 1
    {
      id: 'dex_path_1',
      name: 'Agility',
      description: '+5 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 100 },
      connections: ['start', 'dex_small_1'],
      requirements: ['start'],
      stats: { dexterity: 5 },
      tier: 1
    },
    {
      id: 'dex_small_1',
      name: 'Swift Strikes',
      description: '+5% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: 150 },
      connections: ['dex_path_1', 'dex_notable_1'],
      requirements: ['dex_path_1'],
      stats: { attackSpeed: 0.05 },
      tier: 1
    },
    {
      id: 'dex_notable_1',
      name: 'Evasion Training',
      description: '+15% dodge chance, +10% attack speed',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: 200 },
      connections: ['dex_small_1', 'dex_path_2'],
      requirements: ['dex_small_1'],
      stats: { dodgeChance: 0.15, attackSpeed: 0.1 },
      tier: 1
    },
    
    // Tier 2
    {
      id: 'dex_path_2',
      name: 'Precision',
      description: '+8 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 250 },
      connections: ['dex_notable_1', 'dex_small_2'],
      requirements: ['dex_notable_1'],
      stats: { dexterity: 8 },
      tier: 2
    },
    {
      id: 'dex_small_2',
      name: 'Nimble Fighter',
      description: '+3% dodge chance, +3% critical chance',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: 300 },
      connections: ['dex_path_2', 'dex_notable_2'],
      requirements: ['dex_path_2'],
      stats: { dodgeChance: 0.03, critChance: 0.03 },
      tier: 2
    },
    {
      id: 'dex_notable_2',
      name: 'Shadow Dancer',
      description: '+25% dodge chance, +15% attack speed, +10% critical chance',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: 350 },
      connections: ['dex_small_2', 'dex_path_3'],
      requirements: ['dex_small_2'],
      stats: { dodgeChance: 0.25, attackSpeed: 0.15, critChance: 0.1 },
      tier: 2
    },
    
    // Tier 3
    {
      id: 'dex_path_3',
      name: 'Master Assassin',
      description: '+12 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 400 },
      connections: ['dex_notable_2', 'dex_small_3'],
      requirements: ['dex_notable_2'],
      stats: { dexterity: 12 },
      tier: 3
    },
    {
      id: 'dex_small_3',
      name: 'Lethal Precision',
      description: '+12% critical chance, +8% attack speed',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: 450 },
      connections: ['dex_path_3', 'dex_notable_3'],
      requirements: ['dex_path_3'],
      stats: { critChance: 0.12, attackSpeed: 0.08 },
      tier: 3
    },
    {
      id: 'dex_notable_3',
      name: 'Perfect Balance',
      description: '+40% dodge chance, +25% critical chance, +20% attack speed',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: 500 },
      connections: ['dex_small_3', 'dex_keystone_1'],
      requirements: ['dex_small_3'],
      stats: { dodgeChance: 0.4, critChance: 0.25, attackSpeed: 0.2 },
      tier: 3
    },
    
    // Tier 4 - Keystone
    {
      id: 'dex_keystone_1',
      name: 'Avatar of Dexterity',
      description: '+20 Dexterity, +75% dodge chance, +50% critical chance, but -25% damage',
      type: 'keystone' as PassiveNodeType,
      position: { x: 0, y: 550 },
      connections: ['dex_notable_3', 'dex_mastery_path'],
      requirements: ['dex_notable_3'],
      stats: { dexterity: 20, dodgeChance: 0.75, critChance: 0.5, damage: -0.25 },
      tier: 4
    },
    
    // Tier 5+ - Mastery Path
    {
      id: 'dex_mastery_path',
      name: 'Path to Mastery',
      description: '+15 Dexterity',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: 600 },
      connections: ['dex_keystone_1', 'dex_mastery_1'],
      requirements: ['dex_keystone_1'],
      stats: { dexterity: 15 },
      tier: 5
    },
    {
      id: 'dex_mastery_1',
      name: 'Dexterity Mastery I',
      description: '+25 Dexterity, +100% critical chance',
      type: 'mastery' as PassiveNodeType,
      position: { x: 0, y: 650 },
      connections: ['dex_mastery_path', 'dex_mastery_2'],
      requirements: ['dex_mastery_path'],
      stats: { dexterity: 25, critChance: 1.0 },
      tier: 5
    },
    {
      id: 'dex_mastery_2',
      name: 'Dexterity Mastery II',
      description: '+35 Dexterity, +150% critical chance, +50% attack speed',
      type: 'mastery' as PassiveNodeType,
      position: { x: 0, y: 700 },
      connections: ['dex_mastery_1'],
      requirements: ['dex_mastery_1'],
      stats: { dexterity: 35, critChance: 1.5, attackSpeed: 0.5 },
      tier: 6
    }
  ]
  
  dexterityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
  })
}

function generateExpandedIntelligencePath(nodes: Record<string, PassiveNode>) {
  const intelligenceNodes = [
    // Tier 1
    {
      id: 'int_path_1',
      name: 'Wisdom',
      description: '+5 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -100, y: 0 },
      connections: ['start', 'int_small_1'],
      requirements: ['start'],
      stats: { intelligence: 5 },
      tier: 1
    },
    {
      id: 'int_small_1',
      name: 'Arcane Knowledge',
      description: '+25 mana, +0.5 mana regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: -150, y: 0 },
      connections: ['int_path_1', 'int_notable_1'],
      requirements: ['int_path_1'],
      stats: { mana: 25, manaRegen: 0.5 },
      tier: 1
    },
    {
      id: 'int_notable_1',
      name: 'Spell Power',
      description: '+20% spell damage, +50 mana',
      type: 'notable' as PassiveNodeType,
      position: { x: -200, y: 0 },
      connections: ['int_small_1', 'int_path_2'],
      requirements: ['int_small_1'],
      stats: { mana: 50 },
      skillModifiers: [
        { skillId: 'fireball', property: 'damage', value: 0.2, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'damage', value: 0.2, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'damage', value: 0.2, type: 'additive' as const }
      ],
      tier: 1
    },
    
    // Tier 2
    {
      id: 'int_path_2',
      name: 'Scholarly Pursuit',
      description: '+8 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -250, y: 0 },
      connections: ['int_notable_1', 'int_small_2'],
      requirements: ['int_notable_1'],
      stats: { intelligence: 8 },
      tier: 2
    },
    {
      id: 'int_small_2',
      name: 'Mana Efficiency',
      description: '+1.0 mana regeneration, -10% mana costs',
      type: 'small' as PassiveNodeType,
      position: { x: -300, y: 0 },
      connections: ['int_path_2', 'int_notable_2'],
      requirements: ['int_path_2'],
      stats: { manaRegen: 1.0 },
      skillModifiers: [
        { skillId: 'all', property: 'manaCost', value: -0.1, type: 'additive' as const }
      ],
      tier: 2
    },
    {
      id: 'int_notable_2',
      name: 'Elemental Convergence',
      description: '+50% spell damage, +50% area of effect for spells',
      type: 'notable' as PassiveNodeType,
      position: { x: -350, y: 0 },
      connections: ['int_small_2', 'int_path_3'],
      requirements: ['int_small_2'],
      stats: {},
      skillModifiers: [
        { skillId: 'fireball', property: 'damage', value: 0.5, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'damage', value: 0.5, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'damage', value: 0.5, type: 'additive' as const },
        { skillId: 'fireball', property: 'area', value: 0.5, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'area', value: 0.5, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'area', value: 0.5, type: 'additive' as const }
      ],
      tier: 2
    },
    
    // Tier 3
    {
      id: 'int_path_3',
      name: 'Archmage\'s Path',
      description: '+12 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -400, y: 0 },
      connections: ['int_notable_2', 'int_small_3'],
      requirements: ['int_notable_2'],
      stats: { intelligence: 12 },
      tier: 3
    },
    {
      id: 'int_small_3',
      name: 'Spell Mastery',
      description: '+100% spell damage, +2.0 mana regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: -450, y: 0 },
      connections: ['int_path_3', 'int_notable_3'],
      requirements: ['int_path_3'],
      stats: { manaRegen: 2.0 },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 1.0, type: 'additive' as const }
      ],
      tier: 3
    },
    {
      id: 'int_notable_3',
      name: 'Elemental Mastery',
      description: '+200% spell damage, +100% area of effect, -25% mana costs',
      type: 'notable' as PassiveNodeType,
      position: { x: -500, y: 0 },
      connections: ['int_small_3', 'int_keystone_1'],
      requirements: ['int_small_3'],
      stats: {},
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 2.0, type: 'additive' as const },
        { skillId: 'all', property: 'area', value: 1.0, type: 'additive' as const },
        { skillId: 'all', property: 'manaCost', value: -0.25, type: 'additive' as const }
      ],
      tier: 3
    },
    
    // Tier 4 - Keystone
    {
      id: 'int_keystone_1',
      name: 'Avatar of Intelligence',
      description: '+20 Intelligence, +500% spell damage, +200 mana, but +50% mana costs',
      type: 'keystone' as PassiveNodeType,
      position: { x: -550, y: 0 },
      connections: ['int_notable_3', 'int_mastery_path'],
      requirements: ['int_notable_3'],
      stats: { intelligence: 20, mana: 200 },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 5.0, type: 'additive' as const },
        { skillId: 'all', property: 'manaCost', value: 0.5, type: 'additive' as const }
      ],
      tier: 4
    },
    
    // Tier 5+ - Mastery Path
    {
      id: 'int_mastery_path',
      name: 'Path to Mastery',
      description: '+15 Intelligence',
      type: 'travel' as PassiveNodeType,
      position: { x: -600, y: 0 },
      connections: ['int_keystone_1', 'int_mastery_1'],
      requirements: ['int_keystone_1'],
      stats: { intelligence: 15 },
      tier: 5
    },
    {
      id: 'int_mastery_1',
      name: 'Intelligence Mastery I',
      description: '+25 Intelligence, +1000% spell damage',
      type: 'mastery' as PassiveNodeType,
      position: { x: -650, y: 0 },
      connections: ['int_mastery_path', 'int_mastery_2'],
      requirements: ['int_mastery_path'],
      stats: { intelligence: 25 },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 10.0, type: 'additive' as const }
      ],
      tier: 5
    },
    {
      id: 'int_mastery_2',
      name: 'Intelligence Mastery II',
      description: '+35 Intelligence, +2000% spell damage, +5.0 mana regeneration',
      type: 'mastery' as PassiveNodeType,
      position: { x: -700, y: 0 },
      connections: ['int_mastery_1'],
      requirements: ['int_mastery_1'],
      stats: { intelligence: 35, manaRegen: 5.0 },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 20.0, type: 'additive' as const }
      ],
      tier: 6
    }
  ]
  
  intelligenceNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
  })
}

function generateExpandedVitalityPath(nodes: Record<string, PassiveNode>) {
  const vitalityNodes = [
    // Tier 1
    {
      id: 'vit_path_1',
      name: 'Constitution',
      description: '+5 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -100 },
      connections: ['start', 'vit_small_1'],
      requirements: ['start'],
      stats: { vitality: 5 },
      tier: 1
    },
    {
      id: 'vit_small_1',
      name: 'Robust Health',
      description: '+25 health, +0.5 health regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: -150 },
      connections: ['vit_path_1', 'vit_notable_1'],
      requirements: ['vit_path_1'],
      stats: { health: 25, healthRegen: 0.5 },
      tier: 1
    },
    {
      id: 'vit_notable_1',
      name: 'Iron Will',
      description: '+100 health, +5 armor, +1.0 health regeneration',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: -200 },
      connections: ['vit_small_1', 'vit_path_2'],
      requirements: ['vit_small_1'],
      stats: { health: 100, armor: 5, healthRegen: 1.0 },
      tier: 1
    },
    
    // Tier 2
    {
      id: 'vit_path_2',
      name: 'Endurance',
      description: '+8 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -250 },
      connections: ['vit_notable_1', 'vit_small_2'],
      requirements: ['vit_notable_1'],
      stats: { vitality: 8 },
      tier: 2
    },
    {
      id: 'vit_small_2',
      name: 'Regeneration',
      description: '+1.5 health regeneration, +3% life steal',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: -300 },
      connections: ['vit_path_2', 'vit_notable_2'],
      requirements: ['vit_path_2'],
      stats: { healthRegen: 1.5, lifeSteal: 0.03 },
      tier: 2
    },
    {
      id: 'vit_notable_2',
      name: 'Undying',
      description: '+200 health, +5% life steal, +10 armor',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: -350 },
      connections: ['vit_small_2', 'vit_path_3'],
      requirements: ['vit_small_2'],
      stats: { health: 200, lifeSteal: 0.05, armor: 10 },
      tier: 2
    },
    
    // Tier 3
    {
      id: 'vit_path_3',
      name: 'Immortal Resolve',
      description: '+12 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -400 },
      connections: ['vit_notable_2', 'vit_small_3'],
      requirements: ['vit_notable_2'],
      stats: { vitality: 12 },
      tier: 3
    },
    {
      id: 'vit_small_3',
      name: 'Life Force',
      description: '+300 health, +3.0 health regeneration',
      type: 'small' as PassiveNodeType,
      position: { x: 0, y: -450 },
      connections: ['vit_path_3', 'vit_notable_3'],
      requirements: ['vit_path_3'],
      stats: { health: 300, healthRegen: 3.0 },
      tier: 3
    },
    {
      id: 'vit_notable_3',
      name: 'Eternal Guardian',
      description: '+500 health, +10% life steal, +25 armor',
      type: 'notable' as PassiveNodeType,
      position: { x: 0, y: -500 },
      connections: ['vit_small_3', 'vit_keystone_1'],
      requirements: ['vit_small_3'],
      stats: { health: 500, lifeSteal: 0.1, armor: 25 },
      tier: 3
    },
    
    // Tier 4 - Keystone
    {
      id: 'vit_keystone_1',
      name: 'Avatar of Vitality',
      description: '+20 Vitality, +1000 health, +20% life steal, but -50% damage',
      type: 'keystone' as PassiveNodeType,
      position: { x: 0, y: -550 },
      connections: ['vit_notable_3', 'vit_mastery_path'],
      requirements: ['vit_notable_3'],
      stats: { vitality: 20, health: 1000, lifeSteal: 0.2, damage: -0.5 },
      tier: 4
    },
    
    // Tier 5+ - Mastery Path
    {
      id: 'vit_mastery_path',
      name: 'Path to Mastery',
      description: '+15 Vitality',
      type: 'travel' as PassiveNodeType,
      position: { x: 0, y: -600 },
      connections: ['vit_keystone_1', 'vit_mastery_1'],
      requirements: ['vit_keystone_1'],
      stats: { vitality: 15 },
      tier: 5
    },
    {
      id: 'vit_mastery_1',
      name: 'Vitality Mastery I',
      description: '+25 Vitality, +2000 health, +50 armor',
      type: 'mastery' as PassiveNodeType,
      position: { x: 0, y: -650 },
      connections: ['vit_mastery_path', 'vit_mastery_2'],
      requirements: ['vit_mastery_path'],
      stats: { vitality: 25, health: 2000, armor: 50 },
      tier: 5
    },
    {
      id: 'vit_mastery_2',
      name: 'Vitality Mastery II',
      description: '+35 Vitality, +3000 health, +100 armor, +10.0 health regeneration',
      type: 'mastery' as PassiveNodeType,
      position: { x: 0, y: -700 },
      connections: ['vit_mastery_1'],
      requirements: ['vit_mastery_1'],
      stats: { vitality: 35, health: 3000, armor: 100, healthRegen: 10.0 },
      tier: 6
    }
  ]
  
  vitalityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
  })
}

// Helper function to determine node costs based on type and tier
function getCostByType(type: PassiveNodeType, tier: number): number {
  // All nodes now cost 1 point for simplified progression
  return 1
}

// Generate early game clusters (Tier 1-3)
function generateEarlyGameClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Combat cluster in the upper right
  generateCombatCluster(nodes, clusters, 1, { x: 150, y: -150 })
  
  // Defense cluster in the lower left
  generateDefenseCluster(nodes, clusters, 1, { x: -150, y: 150 })
  
  // Magic cluster in the upper left
  generateMagicCluster(nodes, clusters, 1, { x: -200, y: -150 })
  
  // Utility cluster in the lower right
  generateUtilityCluster(nodes, clusters, 1, { x: 150, y: 150 })
}

// Generate mid game clusters (Tier 4-6)
function generateMidGameClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Advanced Combat cluster
  generateCombatCluster(nodes, clusters, 2, { x: 300, y: -300 })
  
  // Advanced Defense cluster
  generateDefenseCluster(nodes, clusters, 2, { x: -300, y: 300 })
  
  // Advanced Magic cluster
  generateMagicCluster(nodes, clusters, 2, { x: -400, y: -300 })
  
  // Advanced Utility cluster
  generateUtilityCluster(nodes, clusters, 2, { x: 300, y: 300 })
  
  // Elemental clusters
  generateElementalCluster(nodes, clusters, 'fire', { x: -500, y: -200 })
  generateElementalCluster(nodes, clusters, 'ice', { x: -500, y: 0 })
  generateElementalCluster(nodes, clusters, 'lightning', { x: -500, y: 200 })
}

// Generate late game clusters (Tier 7-9)
function generateLateGameClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Master Combat cluster
  generateCombatCluster(nodes, clusters, 3, { x: 500, y: -500 })
  
  // Master Defense cluster
  generateDefenseCluster(nodes, clusters, 3, { x: -500, y: 500 })
  
  // Master Magic cluster
  generateMagicCluster(nodes, clusters, 3, { x: -700, y: -500 })
  
  // Critical Strike clusters
  generateCriticalCluster(nodes, clusters, 1, { x: 400, y: -200 })
  generateCriticalCluster(nodes, clusters, 2, { x: 600, y: -400 })
  
  // Speed clusters
  generateSpeedCluster(nodes, clusters, 1, { x: 200, y: 400 })
  generateSpeedCluster(nodes, clusters, 2, { x: 400, y: 600 })
}

// Generate endgame clusters (Tier 10)
function generateEndGameClusters(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Ultimate Mastery clusters
  generateMasteryCluster(nodes, clusters, 'ultimate_power', { x: 800, y: 0 })
  generateMasteryCluster(nodes, clusters, 'ultimate_defense', { x: 0, y: 800 })
  generateMasteryCluster(nodes, clusters, 'ultimate_magic', { x: -800, y: 0 })
  generateMasteryCluster(nodes, clusters, 'ultimate_speed', { x: 0, y: -800 })
  
  // Transcendence cluster (center endgame)
  generateTranscendenceCluster(nodes, clusters, { x: 0, y: 0 })
}

// Individual cluster generation functions
function generateCombatCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `combat_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Combat Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'combat',
    tier: tier * 3,
    archetype: 'combat'
  }
  
  const baseMultiplier = tier * 2
  const combatNodes = [
    {
      id: `${clusterId}_travel_1`,
      name: 'Combat Training',
      description: `+${3 * baseMultiplier}% damage, +${2 * baseMultiplier}% attack speed`,
      type: 'travel' as PassiveNodeType,
      position: { x: center.x - 50, y: center.y - 50 },
      connections: tier === 1 ? ['str_path_1'] : [`combat_cluster_${tier - 1}_notable_1`],
      requirements: tier === 1 ? ['str_path_1'] : [`combat_cluster_${tier - 1}_notable_1`],
      stats: { damage: 0.03 * baseMultiplier, attackSpeed: 0.02 * baseMultiplier },
      tier: tier * 3,
      archetype: 'combat'
    },
    {
      id: `${clusterId}_small_1`,
      name: 'Wide Slash',
      description: `+${25 * baseMultiplier}% slash arc width, +${10 * baseMultiplier}% melee range`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x - 30, y: center.y - 30 },
      connections: [`${clusterId}_travel_1`, `${clusterId}_notable_1`],
      requirements: [`${clusterId}_travel_1`],
      stats: {},
      skillModifiers: [
        { skillId: 'basic_attack', property: 'slashArcWidth', value: 0.25 * baseMultiplier, type: 'additive' as const },
        { skillId: 'basic_attack', property: 'meleeRange', value: 0.1 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3,
      archetype: 'combat'
    },
    {
      id: `${clusterId}_notable_1`,
      name: `Combat Mastery ${tier}`,
      description: `+${20 * baseMultiplier}% damage, +${10 * baseMultiplier}% attack speed, +${5 * baseMultiplier}% critical chance`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: [`${clusterId}_small_1`, `${clusterId}_small_2`, `${clusterId}_small_3`],
      requirements: [`${clusterId}_small_1`],
      stats: { 
        damage: 0.2 * baseMultiplier, 
        attackSpeed: 0.1 * baseMultiplier, 
        critChance: 0.05 * baseMultiplier 
      },
      tier: tier * 3,
      archetype: 'combat'
    },
    {
      id: `${clusterId}_small_2`,
      name: 'Cleaving Strikes',
      description: `+${50 * baseMultiplier}% area damage, attacks hit +${Math.floor(baseMultiplier / 2)} additional enemies`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x + 30, y: center.y + 30 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: {},
      skillModifiers: [
        { skillId: 'basic_attack', property: 'areaDamage', value: 0.5 * baseMultiplier, type: 'additive' as const },
        { skillId: 'basic_attack', property: 'additionalTargets', value: Math.floor(baseMultiplier / 2), type: 'additive' as const }
      ],
      tier: tier * 3,
      archetype: 'combat'
    },
    {
      id: `${clusterId}_small_3`,
      name: 'Projectile Mastery',
      description: `+${30 * baseMultiplier}% projectile speed, +${Math.floor(baseMultiplier / 3)} additional projectiles`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x, y: center.y + 50 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: {},
      skillModifiers: [
        { skillId: 'basic_attack', property: 'projectileSpeed', value: 0.3 * baseMultiplier, type: 'additive' as const },
        { skillId: 'basic_attack', property: 'additionalProjectiles', value: Math.floor(baseMultiplier / 3), type: 'additive' as const }
      ],
      tier: tier * 3,
      archetype: 'combat'
    }
  ]
  
  combatNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateDefenseCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `defense_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Defense Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'defense',
    tier: tier * 3,
    archetype: 'defense'
  }
  
  const baseMultiplier = tier * 2
  const defenseNodes = [
    {
      id: `${clusterId}_travel_1`,
      name: 'Shield Training',
      description: `+${2 * baseMultiplier} armor`,
      type: 'travel' as PassiveNodeType,
      position: { x: center.x - 50, y: center.y + 50 },
      connections: tier === 1 ? ['vit_path_1'] : [`defense_cluster_${tier - 1}_notable_1`],
      requirements: tier === 1 ? ['vit_path_1'] : [`defense_cluster_${tier - 1}_notable_1`],
      stats: { armor: 2 * baseMultiplier },
      tier: tier * 3
    },
    {
      id: `${clusterId}_small_1`,
      name: 'Thick Skin',
      description: `+${3 * baseMultiplier} armor, +${25 * baseMultiplier} health`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x - 30, y: center.y + 30 },
      connections: [`${clusterId}_travel_1`, `${clusterId}_notable_1`],
      requirements: [`${clusterId}_travel_1`],
      stats: { armor: 3 * baseMultiplier, health: 25 * baseMultiplier },
      tier: tier * 3
    },
    {
      id: `${clusterId}_notable_1`,
      name: `Fortress ${tier}`,
      description: `+${15 * baseMultiplier} armor, +${5 * baseMultiplier}% block chance, +${100 * baseMultiplier} health`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: [`${clusterId}_small_1`, `${clusterId}_small_2`],
      requirements: [`${clusterId}_small_1`],
      stats: { 
        armor: 15 * baseMultiplier, 
        blockChance: 0.05 * baseMultiplier, 
        health: 100 * baseMultiplier 
      },
      tier: tier * 3
    },
    {
      id: `${clusterId}_small_2`,
      name: 'Damage Reduction',
      description: `+${5 * baseMultiplier} armor, +${1 * baseMultiplier}% life steal`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x + 30, y: center.y - 30 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: { armor: 5 * baseMultiplier, lifeSteal: 0.01 * baseMultiplier },
      tier: tier * 3
    }
  ]
  
  defenseNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateMagicCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `magic_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Magic Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'magic',
    tier: tier * 3,
    archetype: 'magic'
  }
  
  const baseMultiplier = tier * 2
  const magicNodes = [
    {
      id: `${clusterId}_travel_1`,
      name: 'Arcane Studies',
      description: `+${25 * baseMultiplier} mana, +${0.5 * baseMultiplier} mana regeneration`,
      type: 'travel' as PassiveNodeType,
      position: { x: center.x + 50, y: center.y - 50 },
      connections: tier === 1 ? ['int_path_1'] : [`magic_cluster_${tier - 1}_notable_1`],
      requirements: tier === 1 ? ['int_path_1'] : [`magic_cluster_${tier - 1}_notable_1`],
      stats: { mana: 25 * baseMultiplier, manaRegen: 0.5 * baseMultiplier },
      tier: tier * 3
    },
    {
      id: `${clusterId}_small_1`,
      name: 'Spell Focus',
      description: `+${15 * baseMultiplier}% spell damage, +${50 * baseMultiplier} mana`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x + 30, y: center.y - 30 },
      connections: [`${clusterId}_travel_1`, `${clusterId}_notable_1`],
      requirements: [`${clusterId}_travel_1`],
      stats: { mana: 50 * baseMultiplier },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 0.15 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3
    },
    {
      id: `${clusterId}_notable_1`,
      name: `Arcane Mastery ${tier}`,
      description: `+${30 * baseMultiplier}% spell damage, -${10 * baseMultiplier}% mana costs, +${100 * baseMultiplier} mana`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: [`${clusterId}_small_1`, `${clusterId}_small_2`],
      requirements: [`${clusterId}_small_1`],
      stats: { mana: 100 * baseMultiplier },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 0.3 * baseMultiplier, type: 'additive' as const },
        { skillId: 'all', property: 'manaCost', value: -0.1 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3
    },
    {
      id: `${clusterId}_small_2`,
      name: 'Mana Efficiency',
      description: `+${0.8 * baseMultiplier} mana regeneration, -${5 * baseMultiplier}% mana costs`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x - 30, y: center.y + 30 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: { manaRegen: 0.8 * baseMultiplier },
      skillModifiers: [
        { skillId: 'all', property: 'manaCost', value: -0.05 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3
    }
  ]
  
  magicNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateUtilityCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `utility_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Utility Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'utility',
    tier: tier * 3,
    archetype: 'utility'
  }
  
  const baseMultiplier = tier * 2
  const utilityNodes = [
    {
      id: `${clusterId}_travel_1`,
      name: 'Treasure Hunter',
      description: `+${5 * baseMultiplier}% magic find, +${5 * baseMultiplier}% gold find`,
      type: 'travel' as PassiveNodeType,
      position: { x: center.x - 50, y: center.y - 50 },
      connections: tier === 1 ? ['dex_path_1'] : [`utility_cluster_${tier - 1}_notable_1`],
      requirements: tier === 1 ? ['dex_path_1'] : [`utility_cluster_${tier - 1}_notable_1`],
      stats: { 
        damage: 0, health: 0, mana: 0, armor: 0, magicResist: 0, attackSpeed: 0,
        criticalChance: 0, criticalDamage: 0, strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
        magicFind: 0.05 * baseMultiplier, goldFind: 0.05 * baseMultiplier, experienceGain: 0
      },
      tier: tier * 3,
      archetype: 'utility'
    },
    {
      id: `${clusterId}_small_1`,
      name: 'Lucky Find',
      description: `+${10 * baseMultiplier}% magic find, +${8 * baseMultiplier}% experience gain`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x - 30, y: center.y - 30 },
      connections: [`${clusterId}_travel_1`, `${clusterId}_notable_1`],
      requirements: [`${clusterId}_travel_1`],
      stats: { 
        damage: 0, health: 0, mana: 0, armor: 0, magicResist: 0, attackSpeed: 0,
        criticalChance: 0, criticalDamage: 0, strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
        magicFind: 0.1 * baseMultiplier, goldFind: 0, experienceGain: 0.08 * baseMultiplier
      },
      tier: tier * 3,
      archetype: 'utility'
    },
    {
      id: `${clusterId}_notable_1`,
      name: `Fortune's Favor ${tier}`,
      description: `+${25 * baseMultiplier}% magic find, +${20 * baseMultiplier}% gold find, +${15 * baseMultiplier}% experience gain`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: [`${clusterId}_small_1`, `${clusterId}_small_2`, `${clusterId}_small_3`],
      requirements: [`${clusterId}_small_1`],
      stats: { 
        damage: 0, health: 0, mana: 0, armor: 0, magicResist: 0, attackSpeed: 0,
        criticalChance: 0, criticalDamage: 0, strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
        magicFind: 0.25 * baseMultiplier, goldFind: 0.2 * baseMultiplier, experienceGain: 0.15 * baseMultiplier
      },
      tier: tier * 3,
      archetype: 'utility'
    },
    {
      id: `${clusterId}_small_2`,
      name: 'Experience Mastery',
      description: `+${15 * baseMultiplier}% experience gain, +${5 * baseMultiplier}% faster skill progression`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x + 30, y: center.y + 30 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: { 
        damage: 0, health: 0, mana: 0, armor: 0, magicResist: 0, attackSpeed: 0,
        criticalChance: 0, criticalDamage: 0, strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
        magicFind: 0, goldFind: 0, experienceGain: 0.15 * baseMultiplier
      },
      skillModifiers: [
        { skillId: 'all', property: 'skillProgressionRate', value: 0.05 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3,
      archetype: 'utility'
    },
    {
      id: `${clusterId}_small_3`,
      name: 'Loot Specialist',
      description: `+${12 * baseMultiplier}% chance for rare drops, +${8 * baseMultiplier}% item quantity`,
      type: 'small' as PassiveNodeType,
      position: { x: center.x, y: center.y + 50 },
      connections: [`${clusterId}_notable_1`],
      requirements: [`${clusterId}_notable_1`],
      stats: { 
        damage: 0, health: 0, mana: 0, armor: 0, magicResist: 0, attackSpeed: 0,
        criticalChance: 0, criticalDamage: 0, strength: 0, dexterity: 0, intelligence: 0, vitality: 0,
        magicFind: 0.08 * baseMultiplier, goldFind: 0, experienceGain: 0
      },
      skillModifiers: [
        { skillId: 'loot', property: 'rareDropChance', value: 0.12 * baseMultiplier, type: 'additive' as const },
        { skillId: 'loot', property: 'itemQuantity', value: 0.08 * baseMultiplier, type: 'additive' as const }
      ],
      tier: tier * 3,
      archetype: 'utility'
    }
  ]
  
  utilityNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

// Additional specialized cluster generation functions would continue here...
// For brevity, I'll include a few key ones:

function generateElementalCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], element: string, center: { x: number; y: number }) {
  const clusterId = `${element}_cluster`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `${element.charAt(0).toUpperCase() + element.slice(1)} Mastery`,
    centerPosition: center,
    nodeIds: [],
    theme: 'elemental',
    tier: 5,
    archetype: 'magic'
  }
  
  const elementalNodes = [
    {
      id: `${clusterId}_travel_1`,
      name: `${element.charAt(0).toUpperCase() + element.slice(1)} Affinity`,
      description: `+25% ${element} damage`,
      type: 'travel' as PassiveNodeType,
      position: { x: center.x - 50, y: center.y },
      connections: ['int_path_2'],
      requirements: ['int_path_2'],
      stats: {},
      skillModifiers: element === 'fire' ? [
        { skillId: 'fireball', property: 'damage', value: 0.25, type: 'additive' as const }
      ] : element === 'ice' ? [
        { skillId: 'ice_shard', property: 'damage', value: 0.25, type: 'additive' as const }
      ] : [
        { skillId: 'lightning_bolt', property: 'damage', value: 0.25, type: 'additive' as const }
      ],
      tier: 5
    },
    {
      id: `${clusterId}_notable_1`,
      name: `${element.charAt(0).toUpperCase() + element.slice(1)} Mastery`,
      description: `+100% ${element} damage, +50% area of effect`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: [`${clusterId}_travel_1`],
      requirements: [`${clusterId}_travel_1`],
      stats: {},
      skillModifiers: element === 'fire' ? [
        { skillId: 'fireball', property: 'damage', value: 1.0, type: 'additive' as const },
        { skillId: 'fireball', property: 'area', value: 0.5, type: 'additive' as const }
      ] : element === 'ice' ? [
        { skillId: 'ice_shard', property: 'damage', value: 1.0, type: 'additive' as const },
        { skillId: 'ice_shard', property: 'area', value: 0.5, type: 'additive' as const }
      ] : [
        { skillId: 'lightning_bolt', property: 'damage', value: 1.0, type: 'additive' as const },
        { skillId: 'lightning_bolt', property: 'area', value: 0.5, type: 'additive' as const }
      ],
      tier: 5
    }
  ]
  
  elementalNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateCriticalCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `critical_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Critical Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'critical',
    tier: 6 + tier,
    archetype: 'combat'
  }
  
  const baseMultiplier = tier * 3
  const criticalNodes = [
    {
      id: `${clusterId}_notable_1`,
      name: `Critical Mastery ${tier}`,
      description: `+${25 * baseMultiplier}% critical chance, +${100 * baseMultiplier}% critical damage`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: ['str_notable_2'],
      requirements: ['str_notable_2'],
      stats: { critChance: 0.25 * baseMultiplier },
      skillModifiers: [
        { skillId: 'all', property: 'criticalDamage', value: 1.0 * baseMultiplier, type: 'additive' as const }
      ],
      tier: 6 + tier
    }
  ]
  
  criticalNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateSpeedCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], tier: number, center: { x: number; y: number }) {
  const clusterId = `speed_cluster_${tier}`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `Speed Mastery ${tier}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'speed',
    tier: 7 + tier,
    archetype: 'combat'
  }
  
  const baseMultiplier = tier * 2
  const speedNodes = [
    {
      id: `${clusterId}_notable_1`,
      name: `Speed Mastery ${tier}`,
      description: `+${30 * baseMultiplier}% attack speed, +${15 * baseMultiplier}% movement speed`,
      type: 'notable' as PassiveNodeType,
      position: center,
      connections: ['dex_notable_2'],
      requirements: ['dex_notable_2'],
      stats: { attackSpeed: 0.3 * baseMultiplier, movementSpeed: 0.15 * baseMultiplier },
      tier: 7 + tier
    }
  ]
  
  speedNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateMasteryCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], masteryType: string, center: { x: number; y: number }) {
  const clusterId = `${masteryType}_cluster`
  const cluster: PassiveCluster = {
    id: clusterId,
    name: `${masteryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    centerPosition: center,
    nodeIds: [],
    theme: 'mastery',
    tier: 10,
    archetype: 'mastery'
  }
  
  const masteryNodes = [
    {
      id: `${clusterId}_keystone_1`,
      name: `${masteryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Keystone`,
      description: getUltimateMasteryDescription(masteryType),
      type: 'keystone' as PassiveNodeType,
      position: center,
      connections: getUltimateMasteryConnections(masteryType),
      requirements: getUltimateMasteryConnections(masteryType),
      stats: getUltimateMasteryStats(masteryType),
      skillModifiers: getUltimateMasteryModifiers(masteryType),
      tier: 10
    }
  ]
  
  masteryNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

function generateTranscendenceCluster(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[], center: { x: number; y: number }) {
  const clusterId = 'transcendence_cluster'
  const cluster: PassiveCluster = {
    id: clusterId,
    name: 'Transcendence',
    centerPosition: center,
    nodeIds: [],
    theme: 'mastery',
    tier: 10,
    archetype: 'mastery'
  }
  
  const transcendenceNodes = [
    {
      id: `${clusterId}_ultimate`,
      name: 'Transcendence',
      description: '+50 to all attributes, +1000% to all damage types, +5000 health, +1000 mana, +50% to all resistances',
      type: 'keystone' as PassiveNodeType,
      position: center,
      connections: ['ultimate_power_cluster_keystone_1', 'ultimate_defense_cluster_keystone_1', 'ultimate_magic_cluster_keystone_1', 'ultimate_speed_cluster_keystone_1'],
      requirements: ['ultimate_power_cluster_keystone_1', 'ultimate_defense_cluster_keystone_1', 'ultimate_magic_cluster_keystone_1', 'ultimate_speed_cluster_keystone_1'],
      stats: { 
        strength: 50, 
        dexterity: 50, 
        intelligence: 50, 
        vitality: 50,
        health: 5000,
        mana: 1000,
        damage: 10.0
      },
      skillModifiers: [
        { skillId: 'all', property: 'damage', value: 10.0, type: 'additive' as const }
      ],
      tier: 10
    }
  ]
  
  transcendenceNodes.forEach(nodeData => {
    const node: PassiveNode = {
      ...nodeData,
      cost: getCostByType(nodeData.type, nodeData.tier || 1),
      maxRank: 1,
      skillModifiers: nodeData.skillModifiers as SkillModifier[] | undefined
    }
    nodes[node.id] = node
    cluster.nodeIds.push(node.id)
  })
  
  clusters.push(cluster)
}

// Helper functions for ultimate mastery clusters
function getUltimateMasteryDescription(masteryType: string): string {
  switch (masteryType) {
    case 'ultimate_power':
      return '+100 Strength, +2000% damage, +1000 health, +25% life steal'
    case 'ultimate_defense':
      return '+100 Vitality, +500 armor, +10000 health, +50% damage reduction'
    case 'ultimate_magic':
      return '+100 Intelligence, +5000% spell damage, +2000 mana, +20.0 mana regeneration'
    case 'ultimate_speed':
      return '+100 Dexterity, +500% attack speed, +200% critical chance, +100% dodge chance'
    default:
      return 'Ultimate mastery node'
  }
}

function getUltimateMasteryConnections(masteryType: string): string[] {
  switch (masteryType) {
    case 'ultimate_power':
      return ['str_mastery_2']
    case 'ultimate_defense':
      return ['vit_mastery_2']
    case 'ultimate_magic':
      return ['int_mastery_2']
    case 'ultimate_speed':
      return ['dex_mastery_2']
    default:
      return []
  }
}

function getUltimateMasteryStats(masteryType: string): EquipmentStats {
  switch (masteryType) {
    case 'ultimate_power':
      return { strength: 100, damage: 20.0, health: 1000, lifeSteal: 0.25 }
    case 'ultimate_defense':
      return { vitality: 100, armor: 500, health: 10000 }
    case 'ultimate_magic':
      return { intelligence: 100, mana: 2000, manaRegen: 20.0 }
    case 'ultimate_speed':
      return { dexterity: 100, attackSpeed: 5.0, critChance: 2.0, dodgeChance: 1.0 }
    default:
      return {}
  }
}

function getUltimateMasteryModifiers(masteryType: string): SkillModifier[] {
  switch (masteryType) {
    case 'ultimate_power':
      return [
        { skillId: 'all', property: 'damage', value: 20.0, type: 'additive' as const }
      ]
    case 'ultimate_defense':
      return [
        { skillId: 'all', property: 'damageReduction', value: 0.5, type: 'additive' as const }
      ]
    case 'ultimate_magic':
      return [
        { skillId: 'all', property: 'damage', value: 50.0, type: 'additive' as const }
      ]
    case 'ultimate_speed':
      return []
    default:
      return []
  }
}

// Generate specialized paths for endgame content
function generateElementalMasteryPaths(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Generate additional elemental paths for late game
  const elements = ['fire', 'ice', 'lightning', 'earth', 'wind', 'dark', 'light']
  
  elements.forEach((element, index) => {
    const angle = (index * 2 * Math.PI) / elements.length
    const radius = 600
    const center = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    }
    
    if (index < 3) return // Skip fire, ice, lightning as they're already generated
    
    generateElementalCluster(nodes, clusters, element, center)
  })
}

function generateCriticalStrikePaths(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Generate additional critical strike clusters
  for (let i = 3; i <= 5; i++) {
    const center = {
      x: 200 + (i * 150),
      y: -100 - (i * 100)
    }
    generateCriticalCluster(nodes, clusters, i, center)
  }
}

function generateSurvivalPaths(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Generate survival-focused clusters
  const survivalCenters = [
    { x: -400, y: 400 },
    { x: -600, y: 600 },
    { x: -800, y: 800 }
  ]
  
  survivalCenters.forEach((center, index) => {
    const clusterId = `survival_cluster_${index + 1}`
    const cluster: PassiveCluster = {
      id: clusterId,
      name: `Survival Mastery ${index + 1}`,
      centerPosition: center,
      nodeIds: [],
      theme: 'survival',
      tier: 6 + index,
      archetype: 'defense'
    }
    
    const baseMultiplier = (index + 1) * 3
    const survivalNodes = [
      {
        id: `${clusterId}_notable_1`,
        name: `Survival Instinct ${index + 1}`,
        description: `+${50 * baseMultiplier} armor, +${20 * baseMultiplier}% life steal, +${500 * baseMultiplier} health`,
        type: 'notable' as PassiveNodeType,
        position: center,
        connections: index === 0 ? ['vit_notable_2'] : [`survival_cluster_${index}_notable_1`],
        requirements: index === 0 ? ['vit_notable_2'] : [`survival_cluster_${index}_notable_1`],
        stats: { 
          armor: 50 * baseMultiplier, 
          lifeSteal: 0.2 * baseMultiplier, 
          health: 500 * baseMultiplier 
        },
        tier: 6 + index
      }
    ]
    
    survivalNodes.forEach(nodeData => {
      const node: PassiveNode = {
        ...nodeData,
        cost: getCostByType(nodeData.type, nodeData.tier || 1),
        maxRank: 1
      }
      nodes[node.id] = node
      cluster.nodeIds.push(node.id)
    })
    
    clusters.push(cluster)
  })
}

function generateSpeedPaths(nodes: Record<string, PassiveNode>, clusters: PassiveCluster[]) {
  // Generate additional speed clusters
  for (let i = 3; i <= 5; i++) {
    const center = {
      x: 100 + (i * 150),
      y: 200 + (i * 150)
    }
    generateSpeedCluster(nodes, clusters, i, center)
  }
}

function generateCrossConnections(nodes: Record<string, PassiveNode>) {
  // Generate cross-connections between different paths to create a more interconnected tree
  const crossConnections = [
    // Connect strength and dexterity paths
    { from: 'str_notable_1', to: 'dex_path_2' },
    { from: 'dex_notable_1', to: 'str_path_2' },
    
    // Connect intelligence and vitality paths
    { from: 'int_notable_1', to: 'vit_path_2' },
    { from: 'vit_notable_1', to: 'int_path_2' },
    
    // Connect opposite paths for advanced builds
    { from: 'str_notable_2', to: 'int_notable_2' },
    { from: 'dex_notable_2', to: 'vit_notable_2' },
    
    // Connect clusters to main paths
    { from: 'combat_cluster_1_notable_1', to: 'defense_cluster_1_travel_1' },
    { from: 'magic_cluster_1_notable_1', to: 'utility_cluster_1_travel_1' },
    
    // Additional archetype connections
    { from: 'str_path_3', to: 'combat_cluster_1_travel_1' },
    { from: 'dex_path_3', to: 'utility_cluster_1_travel_1' },
    { from: 'int_path_3', to: 'magic_cluster_1_travel_1' },
    { from: 'vit_path_3', to: 'defense_cluster_1_travel_1' }
  ]
  
  crossConnections.forEach(connection => {
    addBidirectionalConnection(nodes, connection.from, connection.to)
  })
  
  // Ensure all existing connections are bidirectional
  ensureAllConnectionsAreBidirectional(nodes)
  
  // Generate hundreds of additional small nodes to reach 1000 total
  generateFillerNodes(nodes)
}

function addBidirectionalConnection(nodes: Record<string, PassiveNode>, nodeId1: string, nodeId2: string) {
  const node1 = nodes[nodeId1]
  const node2 = nodes[nodeId2]
  
  if (node1 && node2) {
    // Add bidirectional connections
    if (!node1.connections.includes(nodeId2)) {
      node1.connections.push(nodeId2)
    }
    if (!node2.connections.includes(nodeId1)) {
      node2.connections.push(nodeId1)
    }
  }
}

function ensureAllConnectionsAreBidirectional(nodes: Record<string, PassiveNode>) {
  // Iterate through all nodes and ensure their connections are bidirectional
  Object.values(nodes).forEach(node => {
    node.connections.forEach(connectedNodeId => {
      const connectedNode = nodes[connectedNodeId]
      if (connectedNode && !connectedNode.connections.includes(node.id)) {
        connectedNode.connections.push(node.id)
      }
    })
  })
}

function generateFillerNodes(nodes: Record<string, PassiveNode>) {
  // Generate additional small nodes to fill out the tree to 1000 nodes
  const currentNodeCount = Object.keys(nodes).length
  const targetNodes = 1000
  const nodesToGenerate = targetNodes - currentNodeCount
  
  // Generate nodes in concentric circles around the origin
  for (let i = 0; i < nodesToGenerate; i++) {
    const ring = Math.floor(i / 50) + 1 // 50 nodes per ring
    const angleStep = (2 * Math.PI) / 50
    const angle = (i % 50) * angleStep
    const radius = 150 + (ring * 100)
    
    const position = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    }
    
    const nodeId = `filler_${i + 1}`
    const tier = Math.min(Math.floor(ring / 2) + 1, 10)
    
    // Determine node type based on position and ring
    let nodeType: PassiveNodeType = 'small'
    if (i % 10 === 0) nodeType = 'notable'
    if (i % 25 === 0) nodeType = 'travel'
    
    // Generate stats based on position (quadrant-based themes)
    const stats = generateFillerNodeStats(position, tier)
    const description = generateFillerNodeDescription(stats, tier)
    
    const fillerNode: PassiveNode = {
      id: nodeId,
      name: `Node ${i + 1}`,
      description,
      type: nodeType,
      position,
      connections: [], // Will be connected to nearby nodes
      requirements: [], // Will be set based on connections
      stats,
      cost: getCostByType(nodeType, tier),
      maxRank: 1,
      tier
    }
    
    nodes[nodeId] = fillerNode
  }
  
  // Connect filler nodes to nearby nodes
  connectFillerNodes(nodes)
}

function generateFillerNodeStats(position: { x: number; y: number }, tier: number): EquipmentStats {
  const stats: EquipmentStats = {}
  const multiplier = tier
  
  // Determine theme based on quadrant
  if (position.x > 0 && position.y >= 0) {
    // Upper right - Combat/Strength theme
    stats.strength = 2 * multiplier
    stats.damage = 0.02 * multiplier
  } else if (position.x <= 0 && position.y > 0) {
    // Upper left - Magic/Intelligence theme
    stats.intelligence = 2 * multiplier
    stats.mana = 10 * multiplier
  } else if (position.x < 0 && position.y <= 0) {
    // Lower left - Defense/Vitality theme
    stats.vitality = 2 * multiplier
    stats.health = 15 * multiplier
  } else {
    // Lower right - Speed/Dexterity theme
    stats.dexterity = 2 * multiplier
    stats.attackSpeed = 0.01 * multiplier
  }
  
  return stats
}

function generateFillerNodeDescription(stats: EquipmentStats, tier: number): string {
  const descriptions: string[] = []
  
  Object.entries(stats).forEach(([stat, value]) => {
    if (typeof value === 'number' && value !== 0) {
      let displayValue = value
      let suffix = ''
      
      if (stat.includes('Chance') || stat.includes('Speed') || stat === 'damage') {
        displayValue = Math.round(value * 100)
        suffix = '%'
      }
      
      const statName = stat.charAt(0).toUpperCase() + stat.slice(1)
      descriptions.push(`+${displayValue}${suffix} ${statName}`)
    }
  })
  
  return descriptions.join(', ')
}

function connectFillerNodes(nodes: Record<string, PassiveNode>) {
  const nodeArray = Object.values(nodes)
  
  nodeArray.forEach(node => {
    if (node.id.startsWith('filler_')) {
      // Find nearby nodes to connect to
      const nearbyNodes = nodeArray.filter(otherNode => {
        if (otherNode.id === node.id) return false
        
        const distance = Math.sqrt(
          Math.pow(node.position.x - otherNode.position.x, 2) +
          Math.pow(node.position.y - otherNode.position.y, 2)
        )
        
        return distance < 120 // Connection range
      })
      
      // Connect to 1-3 nearest nodes
      const connectionsToMake = Math.min(3, nearbyNodes.length)
      const sortedNearby = nearbyNodes.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(node.position.x - a.position.x, 2) +
          Math.pow(node.position.y - a.position.y, 2)
        )
        const distB = Math.sqrt(
          Math.pow(node.position.x - b.position.x, 2) +
          Math.pow(node.position.y - b.position.y, 2)
        )
        return distA - distB
      })
      
      for (let i = 0; i < connectionsToMake; i++) {
        const targetNode = sortedNearby[i]
        
        // Add bidirectional connection
        if (!node.connections.includes(targetNode.id)) {
          node.connections.push(targetNode.id)
        }
        if (!targetNode.connections.includes(node.id)) {
          targetNode.connections.push(node.id)
        }
        
        // Set requirements (node requires at least one connected node)
        if (node.requirements.length === 0) {
          node.requirements.push(targetNode.id)
        }
      }
    }
  })
}

// Helper functions for passive tree management (keeping existing functionality)
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