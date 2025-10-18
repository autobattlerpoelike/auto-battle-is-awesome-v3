import React, { useState } from 'react'
import Header from './components/Header'
import GameCanvas from './components/GameCanvas'
import CharacterStatusPanel from './components/CharacterStatusPanel'
import EquipmentPanel from './components/EquipmentPanel'
import PassiveTreeBonusesPanel from './components/PassiveTreeBonusesPanel'
import InventoryPanel from './components/InventoryPanel'
import CombatLogPanel from './components/CombatLogPanel'
import CombatPanel from './components/CombatPanel'
import Modal from './components/Modal'
import { SkillGemPanel } from './components/SkillGemPanel'
import { SkillBar } from './components/SkillBar'

import PerformanceMonitor from './components/PerformanceMonitor'
import { MapDevice } from './components/MapDevice'
import FireballTestCanvas from './components/FireballTestCanvas'
import PassiveTreeModal from './components/PassiveTreeModal'
import EquipmentModal from './components/EquipmentModal'
import { CharacterSelectionModal } from './components/CharacterSelectionModal'
import StonePanel from './components/StonePanel'
import { useGame } from './systems/gameContext'
import './utils/performanceTest' // Import performance testing utilities

export default function App() {
  const { state, actions } = useGame()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isSkillGemPanelVisible, setIsSkillGemPanelVisible] = useState(false)
  const [isInventoryPanelVisible, setIsInventoryPanelVisible] = useState(false)

  const openModal = (modalType: string) => {
    setActiveModal(modalType)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  const renderModalContent = () => {
    switch (activeModal) {
      case 'combat':
        return <CombatPanel />
      case 'character':
        return <CharacterStatusPanel />
      case 'skills':
        return <PassiveTreeBonusesPanel />
      case 'passiveTree':
          return <PassiveTreeModal 
            isOpen={true}
            onClose={closeModal}
            treeData={state.player.passiveTreeData}
            treeState={state.player.passiveTreeState}
            onAllocateNode={actions.allocatePassiveNode}
            availablePoints={state.player.passiveTreeState.availablePoints}
          />
        case 'equipment':
          return <EquipmentModal 
            isOpen={true}
            onClose={closeModal}
          />
        case 'characterSelection':
          return <CharacterSelectionModal 
            onClose={closeModal}
          />
        case 'stones':
          return <StonePanel />
        case 'log':
          return <CombatLogPanel />
      case 'maps':
        return <MapDevice isOpen={true} onClose={closeModal} />
      case 'fireball-test':
        return <FireballTestCanvas />
      default:
        return null
    }
  }

  const getModalTitle = () => {
    switch (activeModal) {
      case 'combat':
        return 'Combat'
      case 'character':
        return 'Character Status'
      case 'skills':
        return 'Passive Tree Bonuses'
      case 'passiveTree':
        return 'Passive Skill Tree'
      case 'equipment':
        return 'Character Equipment'
      case 'characterSelection':
        return 'Character Selection'
      case 'stones':
        return 'Stone Management'

      case 'log':
        return 'Combat Log'
      case 'maps':
        return 'Map Device'
      case 'fireball-test':
        return 'Fireball Test Canvas'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenModal={openModal} />
      <main className="flex-1 flex">
        {/* Left Sidebar - Character Status */}
        <div className="w-80 min-w-80 bg-gray-900/95 border-r border-gray-600 flex flex-col">
          <CharacterStatusPanel />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-2">
          {/* Game Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <GameCanvas />
          </div>
          
          {/* Skill Bar */}
          <div className="mt-2">
            <SkillBar />
          </div>
          
          {/* Combat Log */}
          <div className="h-64 mt-2">
            <CombatLogPanel />
          </div>
        </div>
        
        {/* Right Sidebar - Equipment */}
        <div className="w-80 min-w-80 bg-gray-900/95 border-l border-gray-600 flex flex-col">
          <EquipmentPanel />
        </div>
      </main>
      
      {/* Modal */}
      <Modal
        isOpen={activeModal !== null}
        onClose={closeModal}
        title={getModalTitle()}
      >
        {renderModalContent()}
      </Modal>
      


      {/* Equipment Modal Button */}
      <button
        onClick={() => openModal('equipment')}
        className="fixed bottom-48 right-4 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          color: 'white',
          border: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)'
        }}
      >
        ⚔️ Equipment
      </button>

      {/* Inventory Panel Toggle Button */}
      {!isInventoryPanelVisible && (
        <button
          onClick={() => setIsInventoryPanelVisible(true)}
          className="fixed bottom-32 right-4 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--accent-tertiary), #22c55e)',
            color: 'white',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(52, 211, 153, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(52, 211, 153, 0.3)'
          }}
        >
          🎒 Inventory
        </button>
      )}

      {/* Skill Gem Panel Toggle Button */}
      {!isSkillGemPanelVisible && (
        <button
          onClick={() => setIsSkillGemPanelVisible(true)}
          className="fixed bottom-16 right-4 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(96, 165, 250, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(96, 165, 250, 0.3)'
          }}
        >
          💎 Skills
        </button>
      )}

      {/* Fireball Test Button */}
      <button
        onClick={() => openModal('fireball-test')}
        className="fixed bottom-8 right-4 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
      >
        🔥 Fireball Test
      </button>
      
      {/* Floating Inventory Panel */}
      {isInventoryPanelVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsInventoryPanelVisible(false)}>
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-[90vw] h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-600">
              <h3 className="text-lg font-bold text-white">🎒 Inventory</h3>
              <button
                onClick={() => setIsInventoryPanelVisible(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl px-2 py-1 hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <InventoryPanel />
            </div>
          </div>
        </div>
      )}
      
      {/* Skill Gem Panel */}
      {isSkillGemPanelVisible && (
        <SkillGemPanel 
          isOpen={true} 
          onClose={() => setIsSkillGemPanelVisible(false)} 
        />
      )}
      
      <PerformanceMonitor />
    </div>
  )
}
