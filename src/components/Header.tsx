import React from 'react'
import { useGame } from '../systems/gameContext'
import BuildInfoBadge from './BuildInfoBadge'

interface HeaderProps {
  onOpenModal: (modalType: string) => void
}

export default function Header({ onOpenModal }: HeaderProps) {
  const { state } = useGame()
  const p = state.player
  const skills = state.skills || {}
  const powerMultiplier = Math.pow(1.05, (skills['power']||0))
  const attackSpeed = (p.attackSpeed || 1) * (1 + (skills['quick']||0)*0.05)
  const totalDps = (p.baseDps + (p.equipped?.power||0)) * powerMultiplier + (p.dps - p.baseDps)
  
  return (
    <div className="sticky-header w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
      <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center space-x-3">
            <h1 className="header-title text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Auto Battle Arena
            </h1>
            <BuildInfoBadge />
          </div>
          
          {/* Navigation */}
          <div className="header-nav flex space-x-2">
            <button 
              onClick={() => onOpenModal('skills')}
              className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/60 border border-blue-600/50 text-blue-300 rounded-md transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20"
            >
              🎯 Skills
            </button>
            <button 
              onClick={() => onOpenModal('skillgems')}
              className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-600/50 text-purple-300 rounded-md transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20"
            >
              💎 Skill Gems
            </button>
            <button 
              onClick={() => onOpenModal('combinations')}
              className="px-3 py-1.5 bg-pink-900/50 hover:bg-pink-800/60 border border-pink-600/50 text-pink-300 rounded-md transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-pink-500/20"
            >
              🔗 Combinations
            </button>
            <button 
              onClick={() => onOpenModal('inventory')}
              className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800/60 border border-green-600/50 text-green-300 rounded-md transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-green-500/20"
            >
              🎒 Inventory
            </button>
            <button 
              onClick={() => onOpenModal('log')}
              className="px-3 py-1.5 bg-orange-900/50 hover:bg-orange-800/60 border border-orange-600/50 text-orange-300 rounded-md transition-all duration-200 text-sm font-medium hover:shadow-lg hover:shadow-orange-500/20"
            >
              📜 Combat Log
            </button>
          </div>
          
          {/* Stats Section */}
          <div className="header-stats flex flex-wrap gap-2 mt-1">
            <div className="bg-yellow-900/30 border border-yellow-600/40 text-yellow-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm">
              <span>💰</span>
              <span>{Math.floor(p.gold).toLocaleString()}</span>
            </div>
            <div className="bg-red-900/30 border border-red-600/40 text-red-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm">
              <span>👹</span>
              <span>{state.enemies.length}</span>
            </div>
            <div className="bg-orange-900/30 border border-orange-600/40 text-orange-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm">
              <span>⚔️</span>
              <span>{(totalDps).toFixed(1)}</span>
            </div>
            <div className="bg-cyan-900/30 border border-cyan-600/40 text-cyan-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm">
              <span>⚡</span>
              <span>{attackSpeed.toFixed(1)}/s</span>
            </div>
            <div className="bg-purple-900/30 border border-purple-600/40 text-purple-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm">
              <span>🎯</span>
              <span>Lv.{p.level}</span>
            </div>
            <div className="bg-blue-900/30 border border-blue-600/40 text-blue-300 rounded-md px-3 py-1.5 flex items-center space-x-2 text-sm min-w-[120px]">
              <span>✨</span>
              <div className="flex-1">
                <div className="bg-blue-800/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-400 h-full transition-all duration-300"
                    style={{ width: `${(Math.floor(p.xp) / p.nextLevelXp) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
