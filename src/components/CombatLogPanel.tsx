import React, { useEffect, useRef } from 'react'
import { useGame } from '../systems/gameContext'

export default function CombatLogPanel() {
  const { state } = useGame()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0
  }, [state.log])

  return (
    <div className="card h-56 overflow-y-auto" ref={ref}>
      <h2 className="text-xl font-semibold mb-2">Combat Log</h2>
      <div className="space-y-1 text-xs font-mono text-gray-300">
        {state.log.length === 0 && <div className="text-gray-500">No combat yet...</div>}
        {state.log.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  )
}
