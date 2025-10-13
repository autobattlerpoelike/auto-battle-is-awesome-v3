import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { GameProvider } from './systems/gameContext'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
)
