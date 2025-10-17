import React, { useState } from 'react'
import Header from './components/Header'
import GameCanvas from './components/GameCanvas'
import CharacterStatusPanel from './components/CharacterStatusPanel'
import EquipmentPanel from './components/EquipmentPanel'
import SkillTreePanel from './components/SkillTreePanel'
import InventoryPanel from './components/InventoryPanel'
import CombatLogPanel from './components/CombatLogPanel'
import CombatPanel from './components/CombatPanel'
import Modal from './components/Modal'
import { SkillGemPanel } from './components/SkillGemPanel'
import { SkillBar } from './components/SkillBar'
import SkillCombinationsPanel from './components/SkillCombinationsPanel'
import PerformanceMonitor from './components/PerformanceMonitor'
import { MapDevice } from './components/MapDevice'
import './utils/performanceTest' // Import performance testing utilities

export default function App() {
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
        return <SkillTreePanel />

      case 'combinations':
        return <SkillCombinationsPanel />
      case 'log':
        return <CombatLogPanel />
      case 'maps':
        return <MapDevice isOpen={true} onClose={closeModal} />
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
        return 'Skill Tree'

      case 'combinations':
        return 'Skill Combinations'
      case 'log':
        return 'Combat Log'
      case 'maps':
        return 'Map Device'
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
      
      {/* Floating Inventory Button */}
      {!isInventoryPanelVisible && (
        <button
          onClick={() => setIsInventoryPanelVisible(true)}
          className="fixed bottom-32 right-4 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
        >
          🎒 Inventory
        </button>
      )}

      {/* Skill Gem Panel Toggle Button */}
      {!isSkillGemPanelVisible && (
        <button
          onClick={() => setIsSkillGemPanelVisible(true)}
          className="fixed bottom-20 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all duration-200"
        >
          💎 Skill Gems
        </button>
      )}
      
      {/* Floating Inventory Panel */}
      {isInventoryPanelVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsInventoryPanelVisible(false)}>
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-600">
              <h3 className="text-lg font-bold text-white">🎒 Inventory</h3>
              <button
                onClick={() => setIsInventoryPanelVisible(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl px-2 py-1 hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-60px)]">
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
