import React from 'react'
import { useGame } from '../systems/gameContext'
import { Player } from '../systems/player'

interface CharacterSelectionModalProps {
  onClose: () => void
}

export const CharacterSelectionModal: React.FC<CharacterSelectionModalProps> = ({ onClose }) => {
  const { state, actions } = useGame()

  const handleCharacterSelect = (characterId: string) => {
    actions.updateCharacterModel(characterId)
    onClose()
  }

  // Simple character options without complex sprite system
  const characterModels = [
    { id: 'human_male', name: 'Human Male', class: 'Human Class' },
    { id: 'human_female', name: 'Human Female', class: 'Human Class' },
    { id: 'knight_1', name: 'Knight Warrior', class: 'Knight Class' },
    { id: 'knight_2', name: 'Knight Guardian', class: 'Knight Class' },
    { id: 'knight_3', name: 'Knight Paladin', class: 'Knight Class' },
    { id: 'knight_4', name: 'Knight Champion', class: 'Knight Class' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Choose Your Character</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {characterModels.map((character) => (
            <div
              key={character.id}
              className={`
                relative bg-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200
                hover:bg-gray-600 hover:scale-105
                ${state.player.characterModel === character.id ? 'ring-2 ring-blue-500 bg-gray-600' : ''}
              `}
              onClick={() => handleCharacterSelect(character.id)}
            >
              {/* Character Preview */}
              <div className="aspect-square bg-gray-600 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <div className="w-16 h-20 bg-gradient-to-b from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-200 text-center">
                    {character.name.split(' ').map(word => word[0]).join('')}
                  </span>
                </div>
              </div>

              {/* Character Info */}
              <div className="text-center">
                <h3 className="text-white font-semibold text-sm mb-1">
                  {character.name}
                </h3>
                <p className="text-gray-400 text-xs">
                  {character.class}
                </p>
              </div>

              {/* Selected Indicator */}
              {state.player.characterModel === character.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}