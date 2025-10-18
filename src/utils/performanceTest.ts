// Performance testing utilities for the equipment and item systems
import { generateEquipment } from '../systems/equipmentGenerator'
import { generateLoot } from '../systems/loot'
import { generateAffixes } from '../systems/items'
import { calculatePlayerStats, defaultPlayer } from '../systems/player'
import { generatePassiveTree, calculatePassiveTreeStats, allocateNode, canAllocateNode } from '../systems/passiveTree'

interface PerformanceResult {
  operation: string
  iterations: number
  totalTime: number
  averageTime: number
  itemsPerSecond: number
}

// Test equipment generation performance
export function testEquipmentGeneration(iterations: number = 1000): PerformanceResult {
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    generateEquipment(Math.floor(Math.random() * 100) + 1, Math.random() > 0.9)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Equipment Generation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test loot generation performance
export function testLootGeneration(iterations: number = 1000): PerformanceResult {
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    generateLoot(Math.floor(Math.random() * 100) + 1, Math.random() > 0.9)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Loot Generation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test affix generation performance
export function testAffixGeneration(iterations: number = 1000): PerformanceResult {
  const rarities = ['Common', 'Magic', 'Rare', 'Unique'] as const
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]
    generateAffixes(rarity)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Affix Generation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test player stat calculation performance
export function testStatCalculation(iterations: number = 100): PerformanceResult {
  const player = defaultPlayer()
  
  // Add some equipment to make the test more realistic
  const slots = ['weapon', 'helm', 'chest', 'legs', 'boots', 'gloves'] as const
  for (let i = 0; i < slots.length; i++) {
    const equipment = generateEquipment(50, false)
    player.equipment[slots[i]] = equipment
  }
  
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    calculatePlayerStats(player)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Player Stat Calculation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test passive tree generation performance
export function testPassiveTreeGeneration(iterations: number = 10): PerformanceResult {
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    generatePassiveTree()
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Passive Tree Generation (1000 nodes)',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test passive tree stat calculation performance
export function testPassiveTreeStatCalculation(iterations: number = 1000): PerformanceResult {
  const treeData = generatePassiveTree()
  
  // Create a realistic tree state with some allocated nodes
  const treeState = {
    allocatedNodes: {} as Record<string, number>,
    availablePoints: 100
  }
  
  // Allocate some random nodes to simulate a realistic scenario
  const nodeIds = Object.keys(treeData.nodes)
  for (let i = 0; i < 50 && i < nodeIds.length; i++) {
    const nodeId = nodeIds[i]
    if (canAllocateNode(nodeId, treeData, treeState)) {
      const newState = allocateNode(nodeId, treeData, treeState)
      treeState.allocatedNodes = newState.allocatedNodes
      treeState.availablePoints = newState.availablePoints
    }
  }
  
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    calculatePassiveTreeStats(treeData, treeState)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Passive Tree Stat Calculation',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Test passive tree node allocation performance
export function testPassiveTreeNodeAllocation(iterations: number = 1000): PerformanceResult {
  const treeData = generatePassiveTree()
  const nodeIds = Object.keys(treeData.nodes)
  
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    const treeState = {
      allocatedNodes: {} as Record<string, number>,
      availablePoints: 1000
    }
    
    // Try to allocate a random node
    const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)]
    canAllocateNode(randomNodeId, treeData, treeState)
  }
  
  const endTime = performance.now()
  const totalTime = endTime - startTime
  
  return {
    operation: 'Passive Tree Node Allocation Check',
    iterations,
    totalTime,
    averageTime: totalTime / iterations,
    itemsPerSecond: (iterations / totalTime) * 1000
  }
}

// Run comprehensive performance test suite
export function runPerformanceTestSuite(): PerformanceResult[] {
  console.log('🚀 Starting Performance Test Suite...')
  
  const results: PerformanceResult[] = []
  
  // Test equipment generation
  console.log('Testing equipment generation...')
  results.push(testEquipmentGeneration(1000))
  
  // Test loot generation
  console.log('Testing loot generation...')
  results.push(testLootGeneration(1000))
  
  // Test affix generation
  console.log('Testing affix generation...')
  results.push(testAffixGeneration(1000))
  
  // Test stat calculation
  console.log('Testing stat calculation...')
  results.push(testStatCalculation(100))
  
  // Test passive tree performance
  console.log('Testing passive tree generation...')
  results.push(testPassiveTreeGeneration(10))
  
  console.log('Testing passive tree stat calculation...')
  results.push(testPassiveTreeStatCalculation(1000))
  
  console.log('Testing passive tree node allocation...')
  results.push(testPassiveTreeNodeAllocation(1000))
  
  console.log('✅ Performance Test Suite Complete!')
  
  // Log results
  results.forEach(result => {
    console.log(`\n📊 ${result.operation}:`)
    console.log(`  Iterations: ${result.iterations}`)
    console.log(`  Total Time: ${result.totalTime.toFixed(2)}ms`)
    console.log(`  Average Time: ${result.averageTime.toFixed(4)}ms`)
    console.log(`  Items/Second: ${result.itemsPerSecond.toFixed(0)}`)
    
    // Performance warnings for passive tree
    if (result.operation.includes('Passive Tree')) {
      if (result.averageTime > 10) {
        console.warn(`⚠️ ${result.operation} is slow (${result.averageTime.toFixed(2)}ms avg)`)
      }
      if (result.itemsPerSecond < 100) {
        console.warn(`⚠️ ${result.operation} has low throughput (${result.itemsPerSecond.toFixed(0)} items/sec)`)
      }
    }
  })
  
  return results
}

// Memory usage testing
export function testMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log('\n🧠 Memory Usage:')
    console.log(`  Used JS Heap: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Total JS Heap: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`  Heap Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.log('Memory API not available in this browser')
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).performanceTest = {
    runSuite: runPerformanceTestSuite,
    testMemory: testMemoryUsage,
    testEquipment: testEquipmentGeneration,
    testLoot: testLootGeneration,
    testAffixes: testAffixGeneration,
    testStats: testStatCalculation,
    testPassiveTreeGeneration: testPassiveTreeGeneration,
    testPassiveTreeStats: testPassiveTreeStatCalculation,
    testPassiveTreeAllocation: testPassiveTreeNodeAllocation
  }
}