import React from 'react'
import { useGame } from '../systems/gameContext'
import type { SkillCombination, SkillSynergy } from '../systems/skillCombinations'

const SkillCombinationsPanel = React.memo(function SkillCombinationsPanel() {
  const { state } = useGame()
  const { activeCombinations = [], activeSynergies = [] } = state

  if (activeCombinations.length === 0 && activeSynergies.length === 0) {
    return (
      <div className="bg-gray-900/95 text-white p-4 rounded-lg border border-gray-600">
        <h3 className="text-lg font-bold text-center mb-3">🔗 Skill Combinations</h3>
        <div className="text-center text-gray-400 text-sm">
          <p>Equip multiple skills to unlock powerful combinations!</p>
          <p className="mt-2">Try combining:</p>
          <ul className="mt-1 space-y-1">
            <li>• Fire + Lightning skills for Elemental Mastery</li>
            <li>• Melee + Spell skills for Spellsword</li>
            <li>• Multiple AoE skills for Area Specialist</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/95 text-white p-4 rounded-lg border border-gray-600">
      <h3 className="text-lg font-bold text-center mb-3">🔗 Skill Combinations</h3>
      
      {/* Active Combinations */}
      {activeCombinations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-yellow-400 mb-2">✨ Active Combinations</h4>
          <div className="space-y-2">
            {activeCombinations.map((combination) => (
              <CombinationCard key={combination.id} combination={combination} />
            ))}
          </div>
        </div>
      )}

      {/* Active Synergies */}
      {activeSynergies.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-blue-400 mb-2">⚡ Active Synergies</h4>
          <div className="space-y-2">
            {activeSynergies.map((synergy) => (
              <SynergyCard key={synergy.id} synergy={synergy} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

const CombinationCard = React.memo(function CombinationCard({ 
  combination 
}: { 
  combination: SkillCombination 
}) {
  return (
    <div className="bg-gray-800/70 p-3 rounded border border-yellow-500/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{combination.icon}</span>
        <h5 className="font-semibold text-yellow-300">{combination.name}</h5>
      </div>
      <p className="text-xs text-gray-300 mb-2">{combination.description}</p>
      <div className="space-y-1">
        {combination.bonuses.map((bonus, index) => (
          <div key={index} className="text-xs">
            <span className="text-green-400">
              {bonus.isPercentage ? `+${bonus.value}%` : `+${bonus.value}`} {bonus.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

const SynergyCard = React.memo(function SynergyCard({ 
  synergy 
}: { 
  synergy: SkillSynergy 
}) {
  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'onUse': return 'when used'
      case 'onKill': return 'on kill'
      case 'onCrit': return 'on critical hit'
      case 'onHit': return 'on hit'
      default: return condition
    }
  }

  const getTriggerSkillName = (skillId: string) => {
    switch (skillId) {
      case 'whirlwind': return 'Whirlwind'
      case 'fireball': return 'Fireball'
      case 'lightning_bolt': return 'Lightning Bolt'
      case 'all_spells': return 'Any Spell'
      default: return skillId
    }
  }

  const getTargetSkillName = (skillId: string) => {
    switch (skillId) {
      case 'whirlwind': return 'Whirlwind'
      case 'fireball': return 'Fireball'
      case 'lightning_bolt': return 'Lightning Bolt'
      case 'all_spells': return 'All Spells'
      case 'player': return 'Player'
      default: return skillId
    }
  }

  return (
    <div className="bg-gray-800/70 p-3 rounded border border-blue-500/30">
      <h5 className="font-semibold text-blue-300 mb-1">{synergy.name}</h5>
      <p className="text-xs text-gray-300 mb-2">{synergy.description}</p>
      <div className="text-xs space-y-1">
        <div className="text-gray-400">
          <span className="text-white">{getTriggerSkillName(synergy.triggerSkill)}</span>
          {' '}{getConditionText(synergy.condition)} affects{' '}
          <span className="text-white">{getTargetSkillName(synergy.targetSkill)}</span>
        </div>
        <div className="text-cyan-400">
          {synergy.bonus.isPercentage ? `${synergy.bonus.value}%` : synergy.bonus.value} {synergy.bonus.description}
        </div>
        {synergy.duration && (
          <div className="text-gray-500">
            Duration: {synergy.duration / 1000}s
          </div>
        )}
        {synergy.cooldown && (
          <div className="text-gray-500">
            Cooldown: {synergy.cooldown / 1000}s
          </div>
        )}
      </div>
    </div>
  )
})

export default SkillCombinationsPanel