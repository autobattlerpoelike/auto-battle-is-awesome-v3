import React, { useState } from 'react'
import { Map, MapDevice as MapDeviceType, MapModifier, calculateMapDifficulty, calculateMapRewards, canAccessMap } from '../systems/mapping'
import { useGame } from '../systems/gameContext'

interface MapDeviceProps {
  isOpen: boolean
  onClose: () => void
}

export function MapDevice({ isOpen, onClose }: MapDeviceProps) {
  const { state: gameState, actions } = useGame()
  const [selectedMap, setSelectedMap] = useState<Map | null>(null)
  const [selectedTab, setSelectedTab] = useState<'available' | 'stash' | 'atlas'>('available')

  if (!isOpen) return null

  const mapDevice = gameState.player.mapDevice
  const playerLevel = gameState.player.level

  // Safety check for mapDevice
  if (!mapDevice) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Map Device Error</h2>
          <p className="text-gray-300">Map device not initialized. Please restart the game.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleRunMap = (map: Map) => {
    // Log the map start (temporary until we add proper map actions)
    actions.log(`Starting map: ${map.name} (Tier ${map.tier})`)
    
    // Close the map device
    onClose()
  }

  const renderMapModifiers = (modifiers: MapModifier[]) => {
    return modifiers.map(modifier => (
      <div key={modifier.id} className={`text-xs p-1 rounded ${
        modifier.type === 'prefix' ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'
      }`}>
        <span className="font-semibold">{modifier.name}</span>
        <div className="text-xs opacity-80">{modifier.description}</div>
      </div>
    ))
  }

  const renderMapCard = (map: Map, showRunButton = true) => {
    const difficulty = calculateMapDifficulty(map)
    const rewards = calculateMapRewards(map)
    const canAccess = canAccessMap(map, playerLevel, mapDevice.completedMaps)
    const isCompleted = mapDevice.completedMaps.includes(map.id)

    return (
      <div 
        key={map.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          selectedMap?.id === map.id 
            ? 'border-yellow-400 bg-yellow-900/20' 
            : canAccess 
              ? 'border-gray-600 hover:border-gray-400 bg-gray-800/50' 
              : 'border-gray-700 bg-gray-900/50 opacity-50'
        }`}
        onClick={() => setSelectedMap(map)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className={`font-bold text-lg ${
              map.rarity === 'Unique' ? 'text-orange-400' :
              map.rarity === 'Rare' ? 'text-yellow-400' :
              map.rarity === 'Magic' ? 'text-blue-400' : 'text-white'
            }`}>
              {map.name}
            </h3>
            <div className="text-sm text-gray-400">
              Tier {map.tier} • Level {map.baseLevel} • {map.layout} layout
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold ${
              difficulty < 100 ? 'text-green-400' :
              difficulty < 200 ? 'text-yellow-400' :
              difficulty < 300 ? 'text-orange-400' : 'text-red-400'
            }`}>
              Difficulty: {difficulty}
            </div>
            {isCompleted && (
              <div className="text-xs text-green-400">✓ Completed ({map.timesCompleted}x)</div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-3">{map.description}</p>

        {map.modifiers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-400 mb-1">Map Modifiers:</div>
            <div className="space-y-1">
              {renderMapModifiers(map.modifiers)}
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-400 mb-1">Rewards:</div>
          <div className="text-xs text-gray-300 space-y-1">
            {rewards.map((reward, index) => (
              <div key={index}>
                {reward.type === 'equipment' && `${reward.quantity}x Equipment (Level ${reward.minLevel}-${reward.maxLevel})`}
                {reward.type === 'skillGem' && `${reward.quantity}x ${reward.rarity} Skill Gem`}
                {reward.type === 'supportGem' && `${reward.quantity}x ${reward.rarity} Support Gem`}
                {reward.type === 'experience' && `${reward.quantity} Experience`}
                {reward.guaranteed && ' (Guaranteed)'}
              </div>
            ))}
          </div>
        </div>

        {!canAccess && map.unlockRequirement && (
          <div className="text-xs text-red-400 mb-2">
            <div className="font-semibold">Requirements:</div>
            {map.unlockRequirement.playerLevel && (
              <div>• Level {map.unlockRequirement.playerLevel} (Current: {playerLevel})</div>
            )}
            {map.unlockRequirement.completedMaps && (
              <div>• Complete: {map.unlockRequirement.completedMaps.join(', ')}</div>
            )}
          </div>
        )}

        {showRunButton && canAccess && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRunMap(map)
            }}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
          >
            Run Map ({Math.floor(map.completionTime / 60)}:{(map.completionTime % 60).toString().padStart(2, '0')})
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Map Device</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setSelectedTab('available')}
            className={`px-4 py-2 rounded ${
              selectedTab === 'available' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Available Maps
          </button>
          <button
            onClick={() => setSelectedTab('stash')}
            className={`px-4 py-2 rounded ${
              selectedTab === 'stash' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Map Stash ({mapDevice.mapStash?.length || 0})
          </button>
          <button
            onClick={() => setSelectedTab('atlas')}
            className={`px-4 py-2 rounded ${
              selectedTab === 'atlas' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Atlas Progress
          </button>
        </div>

        {/* Atlas Progress */}
        {selectedTab === 'atlas' && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Atlas of Worlds</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Current Tier:</div>
                <div className="text-white font-semibold">Tier {mapDevice.atlasProgress.tier}</div>
              </div>
              <div>
                <div className="text-gray-400">Maps Completed:</div>
                <div className="text-white font-semibold">
                  {mapDevice.atlasProgress.completedCount} / {mapDevice.atlasProgress.totalCount}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Bonus Objectives:</div>
                <div className="text-white font-semibold">{mapDevice.atlasProgress.bonusObjectives}</div>
              </div>
              <div>
                <div className="text-gray-400">Completion Rate:</div>
                <div className="text-white font-semibold">
                  {Math.floor((mapDevice.atlasProgress.completedCount / mapDevice.atlasProgress.totalCount) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Grid */}
        <div className="overflow-y-auto max-h-[60vh]">
          {selectedTab === 'available' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapDevice.availableMaps.map(map => renderMapCard(map))}
            </div>
          )}

          {selectedTab === 'stash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!mapDevice.mapStash || mapDevice.mapStash.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  No maps in stash. Maps can be found as drops from enemies or purchased from vendors.
                </div>
              ) : (
                mapDevice.mapStash.map(map => renderMapCard(map))
              )}
            </div>
          )}

          {selectedTab === 'atlas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapDevice.availableMaps.map(map => renderMapCard(map, false))}
            </div>
          )}
        </div>

        {/* Current Map Status */}
        {mapDevice.currentMap && (
          <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <div className="text-green-400 font-semibold">Currently Running:</div>
            <div className="text-white">{mapDevice.currentMap.name} (Tier {mapDevice.currentMap.tier})</div>
          </div>
        )}
      </div>
    </div>
  )
}