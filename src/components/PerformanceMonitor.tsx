import React, { useState, useEffect } from 'react'
import { runPerformanceTestSuite, testMemoryUsage } from '../utils/performanceTest'

interface PerformanceResult {
  operation: string
  iterations: number
  totalTime: number
  averageTime: number
  itemsPerSecond: number
}

export default function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<PerformanceResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [memoryInfo, setMemoryInfo] = useState<string>('')

  const runTests = async () => {
    setIsRunning(true)
    try {
      const results = runPerformanceTestSuite()
      setTestResults(results)
      
      // Get memory info
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB | Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
      }
    } catch (error) {
      console.error('Performance test failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-50"
      >
        📊 Performance
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md w-80 shadow-xl z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-sm">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`w-full px-3 py-2 rounded text-sm font-medium ${
            isRunning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Tests...' : 'Run Performance Tests'}
        </button>

        {memoryInfo && (
          <div className="text-xs text-gray-300 bg-gray-800 p-2 rounded">
            <strong>Memory:</strong> {memoryInfo}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-white text-xs font-semibold">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded text-xs">
                <div className="text-blue-400 font-medium">{result.operation}</div>
                <div className="text-gray-300 space-y-1">
                  <div>Iterations: {result.iterations}</div>
                  <div>Avg Time: {result.averageTime.toFixed(4)}ms</div>
                  <div className="text-green-400">
                    Speed: {result.itemsPerSecond.toFixed(0)} items/sec
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
          <div>💡 Tips:</div>
          <div>• Higher items/sec = better performance</div>
          <div>• Lower avg time = faster operations</div>
          <div>• Check console for detailed logs</div>
        </div>
      </div>
    </div>
  )
}