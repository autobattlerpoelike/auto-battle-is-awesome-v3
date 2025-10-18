import React, { useRef, useEffect, useState } from 'react'
import { useGame } from '../systems/gameContext'

interface Projectile {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  damage: number
  skill: string
  startTime: number
  trail: { x: number; y: number; opacity: number }[]
  rotation: number
  particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[]
}

interface DummyEnemy {
  id: string
  x: number
  y: number
  health: number
  maxHealth: number
  size: number
}

const FireballTestCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, dispatch } = useGame()
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [dummyEnemy, setDummyEnemy] = useState<DummyEnemy>({
    id: 'dummy-enemy',
    x: 400,
    y: 200,
    health: 100,
    maxHealth: 100,
    size: 30
  })

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const PLAYER_X = 100
  const PLAYER_Y = 200

  // Create fireball projectile
  const createFireball = () => {
    const newProjectile: Projectile = {
      id: `fireball-${Date.now()}`,
      x: PLAYER_X,
      y: PLAYER_Y,
      targetX: dummyEnemy.x,
      targetY: dummyEnemy.y,
      speed: 300,
      damage: 25,
      skill: 'fireball',
      startTime: Date.now(),
      trail: [],
      rotation: 0,
      particles: []
    }

    console.log('🔥 Creating fireball projectile:', newProjectile)
    setProjectiles(prev => [...prev, newProjectile])
  }

  // Update projectiles
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now()
      
      setProjectiles(prev => {
        return prev.map(projectile => {
          const deltaTime = (currentTime - projectile.startTime) / 1000
          const dx = projectile.targetX - projectile.x
          const dy = projectile.targetY - projectile.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 10) {
            // Projectile reached target - create explosion effect
            console.log('💥 Fireball explosion at target!')
            return null
          }
          
          // Move projectile
          const moveX = (dx / distance) * projectile.speed * (1/60)
          const moveY = (dy / distance) * projectile.speed * (1/60)
          
          const newX = projectile.x + moveX
          const newY = projectile.y + moveY
          
          // Update trail
          const newTrail = [
            { x: projectile.x, y: projectile.y, opacity: 1 },
            ...projectile.trail.map(point => ({ ...point, opacity: point.opacity * 0.95 }))
          ].slice(0, 10)
          
          // Update particles
          const newParticles = [
            ...projectile.particles.map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              life: p.life - 1
            })).filter(p => p.life > 0),
            // Add new particles
            ...Array.from({ length: 2 }, () => ({
              x: newX + (Math.random() - 0.5) * 10,
              y: newY + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 30,
              maxLife: 30
            }))
          ]
          
          return {
            ...projectile,
            x: newX,
            y: newY,
            trail: newTrail,
            rotation: projectile.rotation + 5,
            particles: newParticles
          }
        }).filter(Boolean) as Projectile[]
      })
    }, 1000 / 60) // 60 FPS
    
    return () => clearInterval(interval)
  }, [dummyEnemy])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw player
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.arc(PLAYER_X, PLAYER_Y, 15, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw dummy enemy
    ctx.fillStyle = '#f44336'
    ctx.beginPath()
    ctx.arc(dummyEnemy.x, dummyEnemy.y, dummyEnemy.size, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw health bar
    const barWidth = 60
    const barHeight = 8
    ctx.fillStyle = '#333'
    ctx.fillRect(dummyEnemy.x - barWidth/2, dummyEnemy.y - dummyEnemy.size - 15, barWidth, barHeight)
    ctx.fillStyle = '#4CAF50'
    const healthPercent = dummyEnemy.health / dummyEnemy.maxHealth
    ctx.fillRect(dummyEnemy.x - barWidth/2, dummyEnemy.y - dummyEnemy.size - 15, barWidth * healthPercent, barHeight)
    
    // Draw projectiles
    projectiles.forEach(projectile => {
      // Draw trail
      projectile.trail.forEach((point, index) => {
        const alpha = point.opacity * (1 - index / projectile.trail.length)
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`
        ctx.beginPath()
        ctx.arc(point.x, point.y, 3 * alpha, 0, Math.PI * 2)
        ctx.fill()
      })
      
      // Draw particles
      projectile.particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife
        ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 2 * alpha, 0, Math.PI * 2)
        ctx.fill()
      })
      
      // Draw main projectile
      ctx.save()
      ctx.translate(projectile.x, projectile.y)
      ctx.rotate(projectile.rotation * Math.PI / 180)
      
      // Outer glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15)
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)')
      gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)')
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, 15, 0, Math.PI * 2)
      ctx.fill()
      
      // Core
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // Inner core
      ctx.fillStyle = '#FFF'
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    })
    
    // Draw UI text
    ctx.fillStyle = '#fff'
    ctx.font = '16px Arial'
    ctx.fillText('Fireball Test Canvas', 10, 30)
    ctx.fillText(`Projectiles: ${projectiles.length}`, 10, 50)
    ctx.fillText('Click "Cast Fireball" to test', 10, 70)
    
  }, [projectiles, dummyEnemy])

  return (
    <div style={{ padding: '20px', backgroundColor: '#0f0f23', color: '#fff' }}>
      <h2>🔥 Fireball Test Canvas</h2>
      <p>This is a dedicated testing environment for fireball effects.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={createFireball}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          🔥 Cast Fireball
        </button>
        
        <button 
          onClick={() => setProjectiles([])}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Clear Projectiles
        </button>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ 
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a2e'
        }}
      />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
        <p><strong>Legend:</strong></p>
        <p>🟢 Green Circle = Player</p>
        <p>🔴 Red Circle = Dummy Enemy</p>
        <p>🔥 Fireball = Projectile with trail and particles</p>
        <p><strong>Expected Effects:</strong> Glowing projectile, particle trail, rotation, explosion on impact</p>
      </div>
    </div>
  )
}

export default FireballTestCanvas