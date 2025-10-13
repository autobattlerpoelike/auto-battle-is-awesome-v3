import Header from './components/Header'
import GameCanvas from './components/GameCanvas'
import CharacterStatusPanel from './components/CharacterStatusPanel'
import SkillTreePanel from './components/SkillTreePanel'
import InventoryPanel from './components/InventoryPanel'
import CombatLogPanel from './components/CombatLogPanel'

export default function App() {
  return (
    <div className="container">
      <Header />
      <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GameCanvas />
        </div>
        <div className="space-y-4">
          <CharacterStatusPanel />
          <SkillTreePanel />
          <InventoryPanel />
          <CombatLogPanel />
        </div>
      </div>
    </div>
  )
}
