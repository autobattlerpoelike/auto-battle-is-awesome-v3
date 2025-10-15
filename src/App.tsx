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

export default function App() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

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
      case 'skillgems':
        return <SkillGemPanel isOpen={true} onClose={closeModal} />
      case 'inventory':
        return <InventoryPanel />
      case 'log':
        return <CombatLogPanel />
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
      case 'skillgems':
        return 'Skill Gems'
      case 'inventory':
        return 'Inventory'
      case 'log':
        return 'Combat Log'
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
    </div>
  )
}
