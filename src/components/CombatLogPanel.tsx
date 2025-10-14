import React, { useEffect, useRef, useState } from 'react'
import { useGame } from '../systems/gameContext'

type FilterType = 'All' | 'EXP' | 'Gold' | 'Items'

export default function CombatLogPanel() {
  const { state } = useGame()
  const ref = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0
  }, [state.log])

  const formatLogEntry = (line: string) => {
    // Color code different types of messages
    if (line.includes('BOSS DEFEATED')) {
      return <span className="text-yellow-400 font-bold">{line}</span>
    }
    if (line.includes('defeated')) {
      return <span className="text-green-400">{line}</span>
    }
    if (line.includes('critical')) {
      return <span className="text-red-400">{line}</span>
    }
    if (line.includes('dodged')) {
      return <span className="text-blue-400">{line}</span>
    }
    if (line.includes('Level up')) {
      return <span className="text-purple-400 font-bold">{line}</span>
    }
    if (line.includes('died')) {
      return <span className="text-red-500 font-bold">{line}</span>
    }
    if (line.includes('EXP') || line.includes('exp')) {
      return <span className="text-green-300">{line}</span>
    }
    if (line.includes('Gold') || line.includes('gold')) {
      return <span className="text-yellow-300">{line}</span>
    }
    if (line.includes('found') || line.includes('dropped') || line.includes('item')) {
      return <span className="text-blue-300">{line}</span>
    }
    return <span className="text-gray-300">{line}</span>
  }

  const getFilteredLogs = () => {
    let filteredLogs = [...state.log]

    // Apply filter
    if (activeFilter !== 'All') {
      filteredLogs = filteredLogs.filter(line => {
        switch (activeFilter) {
          case 'EXP':
            return line.includes('EXP') || line.includes('exp') || line.includes('Level up')
          case 'Gold':
            return line.includes('Gold') || line.includes('gold')
          case 'Items':
            return line.includes('found') || line.includes('dropped') || line.includes('item')
          default:
            return true
        }
      })
    }

    // Limit to 50 lines
    return filteredLogs.slice(-50)
  }

  const filteredLogs = getFilteredLogs()

  return (
    <div className="bg-gray-900/95 border border-gray-600 rounded-lg p-4 h-full flex flex-col">
      {/* Header with Filter Tabs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Combat Log</h2>
        <div className="flex space-x-1">
          {(['All', 'EXP', 'Gold', 'Items'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={ref}
        className="space-y-1 flex-1 overflow-y-auto text-sm bg-gray-800/50 rounded p-3 border border-gray-700"
        style={{ maxHeight: '200px' }}
      >
        {filteredLogs.length === 0 && (
          <div className="text-gray-500">
            {activeFilter === 'All' ? 'No combat yet...' : `No ${activeFilter.toLowerCase()} entries...`}
          </div>
        )}
        {filteredLogs.map((line, idx) => (
          <div key={idx} className="font-mono text-xs">
            {formatLogEntry(line)}
          </div>
        ))}
      </div>
    </div>
  )
}
