// Test script to verify new monster types
import { spawnEnemyForLevel } from './src/systems/enemy.js'

console.log('Testing new monster types...')

// Test spawning different monster types
const testMonsters = [
  'swarm',
  'mimic', 
  'phase_beast',
  'necromancer',
  'void_spawn',
  'crystal_guardian'
]

testMonsters.forEach(monsterType => {
  try {
    const enemy = spawnEnemyForLevel(5, monsterType)
    console.log(`✅ ${monsterType}: ${enemy.name} (HP: ${enemy.hp}, Special: ${enemy.specialAbility})`)
    
    // Check if new properties are initialized
    if (monsterType === 'swarm' && enemy.splitCount !== undefined) {
      console.log(`   - Split count: ${enemy.splitCount}`)
    }
    if (monsterType === 'mimic' && enemy.mimickedEquipment !== undefined) {
      console.log(`   - Mimicked equipment initialized`)
    }
    if (monsterType === 'phase_beast' && enemy.phaseTimer !== undefined) {
      console.log(`   - Phase timer: ${enemy.phaseTimer}`)
    }
    if (monsterType === 'necromancer' && enemy.summonedMinions !== undefined) {
      console.log(`   - Summoned minions: ${enemy.summonedMinions.length}`)
    }
    if (monsterType === 'void_spawn' && enemy.resistances !== undefined) {
      console.log(`   - Resistances initialized`)
    }
    if (monsterType === 'crystal_guardian' && enemy.resistances !== undefined) {
      console.log(`   - Crystal armor resistances initialized`)
    }
  } catch (error) {
    console.error(`❌ ${monsterType}: ${error.message}`)
  }
})

console.log('Test completed!')