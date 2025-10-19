import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useGame } from '../systems/gameContext'
import { getScaledRange } from '../systems/skillGems'

const CANVAS_W = 1400, CANVAS_H = 700
// Expanded world boundaries for seamless exploration
const WORLD_WIDTH = 4000, WORLD_HEIGHT = 3000

interface Position {
  x: number
  y: number
}

interface Camera {
  x: number
  y: number
  zoom: number
}

interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  radius: number
  size: number
  glow?: boolean
  type?: string // Add type for different projectile behaviors
  trail?: boolean // Add trail effect
  particles?: boolean // Add particle effects
  rotation?: number // Add rotation for spinning projectiles
  targetId?: string // Add target tracking
  homing?: boolean // Add homing behavior
  targetX?: number // Add target X coordinate for homing
  targetY?: number // Add target Y coordinate for homing
  damage?: number // Add damage information
  skillId?: string // Add skill ID for proper damage calculation
  playerId?: string // Add player ID for damage attribution
}

interface Effect {
  kind: string
  x: number
  y: number
  t: number
  ttl: number
  text?: string
  crit?: boolean
  size?: number
  color: string
  angle?: number
  duration?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  radius: number
  size: number
  glow?: boolean
}

interface TrailPoint {
  x: number
  y: number
  age: number
  maxAge: number
}

interface ProjectileTrail {
  projectileId: string
  points: TrailPoint[]
  color: string
}

function rarityColor(r: string | undefined): string {
  if (!r) return '#ffffff'
  if (r === 'Common') return '#ffffff'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  return '#ffffff'
}

const GameCanvas = React.memo(function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, actions } = useGame()
  const [playerPos, setPlayerPos] = useState<Position>({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }) // World coordinates - player starts at center
  const [enemyPositions, setEnemyPositions] = useState<Record<string, Position>>({})
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [projectileTrails, setProjectileTrails] = useState<ProjectileTrail[]>([])
  const [effects, setEffects] = useState<Effect[]>([])
  const [dying, setDying] = useState<Record<string, number>>({})
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [idleAnimation, setIdleAnimation] = useState<number>(0)
  const [playerFacingAngle, setPlayerFacingAngle] = useState<number>(0) // Track player facing direction
  const [whirlwindState, setWhirlwindState] = useState<{active: boolean, startTime: number, rotation: number}>({
    active: false, 
    startTime: 0, 
    rotation: 0
  })
  const [debugAOE, setDebugAOE] = useState<boolean>(false)

  // Frame rate limiting for better performance
  const lastFrameTime = useRef<number>(0)
  const targetFPS = 60
  const frameInterval = 1000 / targetFPS

  // Object pooling for performance
  const positionPool = useMemo(() => {
    const pool: Position[] = []
    for (let i = 0; i < 1000; i++) {
      pool.push({ x: 0, y: 0 })
    }
    return pool
  }, [])
  
  let poolIndex = 0
  const getPooledPosition = useCallback((x: number, y: number): Position => {
    const pos = positionPool[poolIndex % positionPool.length]
    pos.x = x
    pos.y = y
    poolIndex++
    return pos
  }, [positionPool])

  // Enhanced isometric transformation functions for Path of Exile-style view
  const worldToIso = useCallback((worldX: number, worldY: number, worldZ: number = 0): Position => {
    // Path of Exile uses a 26.57° (arctan(0.5)) isometric angle
    // This creates the classic 2:1 pixel ratio isometric view
    const isoX = (worldX - worldY) * Math.cos(Math.PI / 6) // cos(30°) ≈ 0.866
    const isoY = (worldX + worldY) * Math.sin(Math.PI / 6) - worldZ * 0.5 // sin(30°) = 0.5, with height
    return getPooledPosition(isoX, isoY)
  }, [getPooledPosition])

  const isoToScreen = useCallback((isoPos: Position): Position => {
    return getPooledPosition(
      (isoPos.x - camera.x) * camera.zoom + CANVAS_W / 2,
      (isoPos.y - camera.y) * camera.zoom + CANVAS_H / 2
    )
  }, [camera.x, camera.y, camera.zoom, getPooledPosition])

  const worldToScreen = useCallback((worldX: number, worldY: number, worldZ: number = 0): Position => {
    const iso = worldToIso(worldX, worldY, worldZ)
    return isoToScreen(iso)
  }, [worldToIso, isoToScreen])

  // Helper function to get isometric depth for proper rendering order
  const getIsometricDepth = useCallback((worldX: number, worldY: number): number => {
    return worldX + worldY // Objects further down and right should render last
  }, [])



  // Initialize enemy positions - only assign positions to new enemies
  useEffect(() => {
    setEnemyPositions(prevPositions => {
      const newPositions = { ...prevPositions }
      let hasNewEnemies = false
      
      // Create spawn zones for new enemies
      const spawnZones = [
        { centerX: WORLD_WIDTH * 0.3, centerY: WORLD_HEIGHT * 0.3, radius: 300 },
        { centerX: WORLD_WIDTH * 0.7, centerY: WORLD_HEIGHT * 0.3, radius: 300 },
        { centerX: WORLD_WIDTH * 0.3, centerY: WORLD_HEIGHT * 0.7, radius: 300 },
        { centerX: WORLD_WIDTH * 0.7, centerY: WORLD_HEIGHT * 0.7, radius: 300 },
        { centerX: WORLD_WIDTH * 0.5, centerY: WORLD_HEIGHT * 0.1, radius: 200 },
        { centerX: WORLD_WIDTH * 0.5, centerY: WORLD_HEIGHT * 0.9, radius: 200 },
        { centerX: WORLD_WIDTH * 0.1, centerY: WORLD_HEIGHT * 0.5, radius: 200 },
        { centerX: WORLD_WIDTH * 0.9, centerY: WORLD_HEIGHT * 0.5, radius: 200 }
      ]
      
      // Only assign positions to enemies that don't have them yet
      state.enemies.forEach((e, i) => {
        if (!newPositions[e.id]) {
          hasNewEnemies = true
          
          // Special positioning for training dummies - place at North indicator position
          if (e.type === 'training_dummy') {
            // Calculate North indicator position in world coordinates
            // North indicator is positioned at basic attack range north of player
            const basicAttackRange = getScaledRange({ 
              id: 'basic_attack',
              name: 'Basic Attack',
              description: 'A simple melee attack',
              type: 'active' as const,
              category: 'attack',
              tags: ['Attack', 'Melee'],
              level: 1,
              maxLevel: 1,
              unlockLevel: 0,
              skillPointCost: 0,
              manaCost: 0,
              cooldown: 1000,
              isUnlocked: true,
              isEquipped: false,
              supportGems: [],
              icon: 'basic_attack',
              scaling: {
                baseDamage: 10,
                baseRange: 50
              },
              rarity: 'Normal' as const,
              quality: 0
            })
            
            // North is negative Y direction in world coordinates
            const northWorldX = playerPos.x
            const northWorldY = playerPos.y - basicAttackRange
            
            // Ensure training dummy stays within world boundaries
            newPositions[e.id] = { 
              x: Math.max(50, Math.min(WORLD_WIDTH - 50, northWorldX)), 
              y: Math.max(50, Math.min(WORLD_HEIGHT - 50, northWorldY)) 
            }
          } else {
            // Regular enemy positioning using spawn zones
            const zone = spawnZones[i % spawnZones.length]
            
            // Generate random position within the selected zone
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * zone.radius
            const worldX = zone.centerX + Math.cos(angle) * distance
            const worldY = zone.centerY + Math.sin(angle) * distance
            
            // Ensure enemies stay within world boundaries
            newPositions[e.id] = { 
              x: Math.max(50, Math.min(WORLD_WIDTH - 50, worldX)), 
              y: Math.max(50, Math.min(WORLD_HEIGHT - 50, worldY)) 
            }
          }
        }
      })
      
      // Remove positions for enemies that no longer exist
      const currentEnemyIds = new Set(state.enemies.map(e => e.id))
      Object.keys(newPositions).forEach(id => {
        if (!currentEnemyIds.has(id)) {
          delete newPositions[id]
        }
      })
      
      // Only update if there are changes
      if (hasNewEnemies || Object.keys(newPositions).length !== Object.keys(prevPositions).length) {
        return newPositions
      }
      
      return prevPositions
    })
  }, [state.enemies, playerPos, state.player])

  // Sync enemy positions with game state - separate effect to avoid setState during render
  useEffect(() => {
    actions.updateEnemyPositions(enemyPositions)
  }, [enemyPositions, actions])

  // Keyboard state for 8-directional movement
  const [keys, setKeys] = useState<Record<string, boolean>>({})

  // Enhanced keyboard handling for movement and debug
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'f1') {
        setDebugAOE(prev => !prev)
      } else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: true }))
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: false }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const clamp = (p: Position): Position => ({ x: Math.max(30, Math.min(WORLD_WIDTH-30, p.x)), y: Math.max(30, Math.min(WORLD_HEIGHT-30, p.y)) })
  const clampEffect = (p: Position, radius: number = 50): Position => ({ 
    x: Math.max(radius, Math.min(WORLD_WIDTH-radius, p.x)), 
    y: Math.max(radius, Math.min(WORLD_HEIGHT-radius, p.y)) 
  })
  const isWithinBounds = (p: Position, radius: number = 0): boolean => {
    return p.x >= radius && p.x <= WORLD_WIDTH - radius && p.y >= radius && p.y <= WORLD_HEIGHT - radius
  }
  const dist = (a: Position, b: Position): number => Math.hypot(a.x-b.x, a.y-b.y)
  const moveTowards = (from: Position, to: Position, s: number): Position => {
    const dx = to.x-from.x, dy = to.y-from.y, d=Math.hypot(dx,dy)||1;
    return { x: from.x + dx/d*s, y: from.y + dy/d*s }
  }

  // spawn visuals by reading log markers (ANIM_PLAYER|enemyId|type|rarity|crit|damage)
  const lastProcessedLogIndex = useRef(0)
  useEffect(() => {
    if (!state.log || state.log.length === 0) return
    
    // Reset index if log has been trimmed (log length is less than our tracked index)
    if (state.log.length < lastProcessedLogIndex.current) {
      lastProcessedLogIndex.current = 0
    }
    
    // Process all new logs since the last check
    const newLogs = state.log.slice(0, state.log.length - lastProcessedLogIndex.current)
    if (newLogs.length === 0) return
    
    lastProcessedLogIndex.current = state.log.length
    
    // Process each new log in reverse order (oldest first)
    newLogs.reverse().forEach(latest => {
      console.log(`🎬 GameCanvas processing log: ${latest}`)
      if (latest.startsWith('ANIM_PLAYER|')) {
        const parts = latest.split('|')
        const id = parts[1], wtype = parts[2], wr = parts[3], critFlag = parts[4], dmg = Math.floor(Number(parts[5] || 0))
        const pos = enemyPositions[id]; const color = rarityColor(wr)
        if (wtype === 'melee') {
          // Use player facing direction for forward-facing slash
          const directionAngle = playerFacingAngle
          
          // Create slash effect with 20px separation from player model edge, facing forward
          const playerRadius = 16 // Player model radius
          const slashSeparation = 20 // 20px separation from player model edge
          const slashDistance = playerRadius + slashSeparation // Total distance: 36px
          const slashX = playerPos.x + Math.cos(directionAngle) * slashDistance
          const slashY = playerPos.y + Math.sin(directionAngle) * slashDistance
          
          // Scale animation duration with attack speed - faster attack speed = shorter animation
          const baseAnimationDuration = 400
          const playerAttackSpeed = state.player.attackSpeed ?? 0
          const animationDuration = Math.max(150, Math.round(baseAnimationDuration / (1 + playerAttackSpeed)))
          
          setEffects(s => [...s, { 
            kind:'slash', 
            x: slashX, 
            y: slashY, 
            t: Date.now(), 
            ttl: animationDuration, // Duration scales with attack speed
            angle: directionAngle, 
            color,
            size: 60 // Appropriate size for arc effect
          }])
        } else if (wtype === 'ranged') {
          if (pos) {
            const dirx = pos.x - playerPos.x, diry = pos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
            const playerAttackSpeed = state.player.attackSpeed ?? 0
            const speed = 3 * (state.player.projectileSpeed || 1) * (1 + (state.skills['arcane']||0)*0.1) * (1 + playerAttackSpeed * 0.5)
            const life = Math.max(400, Math.round(800 / (1 + playerAttackSpeed * 0.3))) // Faster projectiles have shorter life
            setProjectiles(p => [...p, { x: playerPos.x, y: playerPos.y, vx: dirx/d*speed, vy: diry/d*speed, life, color, radius:3, size:2 }])
          }
        } else if (wtype === 'magic') {
          if (pos) {
            const dirx = pos.x - playerPos.x, diry = pos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
            const playerAttackSpeed = state.player.attackSpeed ?? 0
            const speed = 2 * (state.player.projectileSpeed || 1) * (1 + (state.skills['arcane']||0)*0.1) * (1 + playerAttackSpeed * 0.5)
            const life = Math.max(600, Math.round(1200 / (1 + playerAttackSpeed * 0.3))) // Faster projectiles have shorter life
            setProjectiles(p => [...p, { x: playerPos.x, y: playerPos.y, vx: dirx/d*speed, vy: diry/d*speed, life, color, radius:6, size:4, glow:true }])
          }
        }

        if (pos) {
          // Format damage to 2 decimal places
          const formattedDmg = dmg.toFixed(2)
          const text = (critFlag === 'crit') ? `-${formattedDmg} CRIT!` : `-${formattedDmg}`
          const isCritical = critFlag === 'crit'
          
          setEffects(s => [...s, { 
            kind: isCritical ? 'critical_damage' : 'damage', 
            x: pos.x + (Math.random()-0.5)*10, 
            y: pos.y - 10 + (Math.random()-0.5)*6, 
            t: Date.now(), 
            ttl: isCritical ? 2000 : 1600, 
            text, 
            crit: isCritical, 
            size: Math.min(isCritical ? 32 : 28, (isCritical ? 14 : 10) + Math.floor(dmg/2)), 
            color: isCritical ? '#ff0066' : '#ff6b6b' 
          }])
          
          // Add critical hit burst effect
          if (isCritical) {
            setEffects(s => [...s, { 
              kind: 'critical_burst', 
              x: pos.x, 
              y: pos.y, 
              t: Date.now(), 
              ttl: 1200, 
              color: '#ff0066',
              size: 30
            }])
          }
        }
      }
      if (latest.startsWith('Enemy defeated! Loot:')) {
        const match = latest.match(/Loot: (.+)$/)
        if (match) setEffects(s => [...s, { kind:'pickup', x: 220, y: 60, t: Date.now(), ttl: 1200, text: match[1], color:'#fff' }])
      }
      
      // Handle dodge/miss feedback
      if (latest.includes('dodged')) {
        if (latest.includes('Player dodged')) {
          // Player dodged enemy attack - enhanced feedback
          setEffects(s => [...s, { 
            kind: 'dodge', 
            x: playerPos.x + (Math.random()-0.5)*20, 
            y: playerPos.y - 20 + (Math.random()-0.5)*10, 
            t: Date.now(), 
            ttl: 1500, 
            text: 'DODGE!', 
            color: '#00ffff',
            size: 18
          }])
          
          // Add dodge burst effect
          setEffects(s => [...s, { 
            kind: 'dodge_burst', 
            x: playerPos.x, 
            y: playerPos.y, 
            t: Date.now(), 
            ttl: 800, 
            color: '#00ffff',
            size: 20
          }])
        } else {
          // Enemy dodged player attack - find which enemy
          const enemyMatch = latest.match(/(.+) dodged/)
          if (enemyMatch) {
            const enemyName = enemyMatch[1]
            const enemy = state.enemies.find(e => e.name === enemyName)
            if (enemy) {
              const pos = enemyPositions[enemy.id]
              if (pos) {
                setEffects(s => [...s, { 
                  kind: 'miss', 
                  x: pos.x + (Math.random()-0.5)*20, 
                  y: pos.y - 20 + (Math.random()-0.5)*10, 
                  t: Date.now(), 
                  ttl: 1200, 
                  text: 'MISS!', 
                  color: '#94a3b8',
                  size: 14
                }])
              }
            }
          }
        }
      }
      
      // Handle enemy damage to player
      if (latest.includes('hits back for')) {
        const damageMatch = latest.match(/hits back for (\d+)/)
        if (damageMatch) {
          const damage = parseInt(damageMatch[1])
          setEffects(s => [...s, { 
            kind: 'player_damage', 
            x: playerPos.x + (Math.random()-0.5)*15, 
            y: playerPos.y - 15 + (Math.random()-0.5)*8, 
            t: Date.now(), 
            ttl: 1400, 
            text: `-${damage}`, 
            color: '#ef4444',
            size: Math.min(24, 12 + Math.floor(damage/3))
          }])
        }
      }
      
      // Handle blocked attacks
      if (latest.includes('blocked')) {
        if (latest.includes('Player blocked')) {
          setEffects(s => [...s, { 
            kind: 'block', 
            x: playerPos.x + (Math.random()-0.5)*20, 
            y: playerPos.y - 20 + (Math.random()-0.5)*10, 
            t: Date.now(), 
            ttl: 1200, 
            text: 'BLOCK!', 
            color: '#fbbf24',
            size: 16
          }])
        }
      }
      
      if (latest.startsWith('🔥 Critical Hit!')) {
        // Add critical hit effect if needed
      }
      if (latest.startsWith('ANIM_SKILL|')) {
        const parts = latest.split('|')
        const skillType = parts[1]
        console.log(`🎯 Processing ANIM_SKILL: ${skillType}, parts:`, parts)
        
        if (skillType === 'whirlwind') {
          const startTime = Number(parts[2])
          const duration = Number(parts[3])
          
          // Activate Whirlwind spinning state
          setWhirlwindState({
            active: true,
            startTime: Date.now(),
            rotation: 0
          })
          
          // Set timer to deactivate Whirlwind after duration
          setTimeout(() => {
            setWhirlwindState(prev => ({ ...prev, active: false }))
          }, duration)
          
          setEffects(s => [...s, { 
            kind: 'whirlwind', 
            x: playerPos.x, 
            y: playerPos.y, 
            t: startTime, 
            ttl: duration, 
            color: '#fbbf24',
            duration: duration
          }])
        } else if (skillType === 'heal') {
          setEffects(s => [...s, { 
            kind: 'heal', 
            x: playerPos.x, 
            y: playerPos.y, 
            t: Date.now(), 
            ttl: 2000, 
            color: '#10b981'
          }])
        } else if (skillType === 'fireball') {
          const targetId = parts[2]
          const damage = Number(parts[3]) || 0
          const targetPos = enemyPositions[targetId]
          console.log(`🔥 FIREBALL ANIM_SKILL received - targetId: ${targetId}, damage: ${damage}, targetPos:`, targetPos)
          if (targetPos) {
            // Create enhanced fireball projectile with advanced visual effects
            const dirx = targetPos.x - playerPos.x, diry = targetPos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
            const speed = 4 * (state.player.projectileSpeed || 1)
            
            // Check for multiple projectiles support gem
            const fireballSkill = state.player.skillBar.slots.find((s: any) => s?.name === 'Fireball')
            const projectileCount = fireballSkill ? fireballSkill.supportGems.reduce((count: number, gem: any) => {
              if (gem.id === 'multiple_projectiles') {
                return count + (gem.modifiers?.find((m: any) => m.type === 'projectiles')?.value || 0)
              }
              return count
            }, 1) : 1
            
            // Calculate spawn position in front of player
            const spawnDistance = 20 // Distance in front of player
            const baseAngle = Math.atan2(diry, dirx)
            const spawnX = playerPos.x + Math.cos(baseAngle) * spawnDistance
            const spawnY = playerPos.y + Math.sin(baseAngle) * spawnDistance
            
            // Create multiple projectiles if support gem is equipped
            for (let i = 0; i < projectileCount; i++) {
              const angleOffset = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 0.3 : 0
              const angle = baseAngle + angleOffset
              const projVx = Math.cos(angle) * speed
              const projVy = Math.sin(angle) * speed
              
              // Offset spawn position for multiple projectiles
              const offsetDistance = projectileCount > 1 ? (i - (projectileCount - 1) / 2) * 8 : 0
              const offsetX = spawnX + Math.cos(angle + Math.PI/2) * offsetDistance
              const offsetY = spawnY + Math.sin(angle + Math.PI/2) * offsetDistance
              
              const newProjectile = { 
                x: offsetX, 
                y: offsetY, 
                vx: projVx, 
                vy: projVy, 
                life: 8000, // Increased from 5000ms to 8 seconds for longer travel
                color: '#ff4400', 
                radius: 10, 
                size: 8, 
                glow: true,
                type: 'fireball',
                trail: false,
                particles: false,
                rotation: 0,
                targetId: targetId,
                damage: damage,
                skillId: 'fireball',
                playerId: state.player.id || 'player'
              }
              console.log(`🔥 Creating fireball projectile with life: ${newProjectile.life}ms, target: ${targetId}`)
              // Add to both state and animation ref to avoid race conditions
              setProjectiles(p => [...p, newProjectile])
              
              // Also add directly to animation state ref for immediate processing
              if (!animationStateRef.current.calculatedProjectiles) {
                animationStateRef.current.calculatedProjectiles = []
              }
              animationStateRef.current.calculatedProjectiles.push(newProjectile)
            }
          }
         } else if (skillType === 'lightning_bolt') {
           const targetId = parts[2]
           const damage = Number(parts[3]) || 0
           const targetPos = enemyPositions[targetId]
           if (targetPos) {
             // Create traveling lightning bolt projectile
             const dirx = targetPos.x - playerPos.x, diry = targetPos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
             const speed = 6 * (state.player.projectileSpeed || 1)
             
             // Calculate spawn position in front of player
             const spawnDistance = 20
             const angle = Math.atan2(diry, dirx)
             const spawnX = playerPos.x + Math.cos(angle) * spawnDistance
             const spawnY = playerPos.y + Math.sin(angle) * spawnDistance
             
             setProjectiles(p => [...p, { 
               x: spawnX, 
               y: spawnY, 
               vx: dirx/d*speed, 
               vy: diry/d*speed, 
               life: 800, 
               color: '#00aaff', 
               radius: 6, 
               size: 4, 
               glow: true,
               type: 'lightning_bolt',
               targetId: targetId,
               damage: damage,
               skillId: 'lightning_bolt',
               playerId: 'player'
             }])
           }
         } else if (skillType === 'power_strike') {
           setEffects(s => [...s, { 
             kind: 'power_strike', 
             x: playerPos.x, 
             y: playerPos.y, 
             t: Date.now(), 
             ttl: 700,
             color: '#ffaa00',
             size: 18
           }])
         } else if (skillType === 'ice_shard') {
           const targetId = parts[2]
           const damage = Number(parts[3]) || 0
           const targetPos = enemyPositions[targetId]
           if (targetPos) {
             // Create traveling ice shard projectile
             const dirx = targetPos.x - playerPos.x, diry = targetPos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
             const speed = 5 * (state.player.projectileSpeed || 1)
             
             // Calculate spawn position in front of player
             const spawnDistance = 20
             const angle = Math.atan2(diry, dirx)
             const spawnX = playerPos.x + Math.cos(angle) * spawnDistance
             const spawnY = playerPos.y + Math.sin(angle) * spawnDistance
             
             setProjectiles(p => [...p, { 
               x: spawnX, 
               y: spawnY, 
               vx: dirx/d*speed, 
                vy: diry/d*speed, 
                life: 900, 
                color: '#74c0fc', 
                radius: 5, 
                size: 3, 
                glow: true,
                type: 'ice_shard',
                targetId: targetId,
                damage: damage,
                skillId: 'ice_shard',
                playerId: state.player.id || 'player'
              }])
            }
          } else if (skillType === 'ground_slam') {
            setEffects(s => [...s, { 
              kind: 'ground_slam', 
              x: playerPos.x, 
              y: playerPos.y, 
              t: Date.now(), 
              ttl: 800,
              color: '#8b5a2b',
              size: 25
            }])
          } else if (skillType === 'poison_arrow') {
            const targetId = parts[2]
            const damage = Number(parts[3]) || 0
            const targetPos = enemyPositions[targetId]
            if (targetPos) {
              // Create traveling poison arrow projectile
              const dirx = targetPos.x - playerPos.x, diry = targetPos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
              const speed = 4.5 * (state.player.projectileSpeed || 1)
              setProjectiles(p => [...p, { 
                x: playerPos.x, 
                y: playerPos.y, 
                vx: dirx/d*speed, 
                vy: diry/d*speed, 
                life: 1200, 
                color: '#51cf66', 
                radius: 4, 
                size: 3, 
                glow: false,
                type: 'poison_arrow',
                targetId: targetId,
                damage: damage,
                skillId: 'poison_arrow',
                playerId: state.player.id || 'player'
              }])
            }
          } else if (skillType === 'chain_lightning') {
            setEffects(s => [...s, { 
              kind: 'chain_lightning', 
              x: playerPos.x, 
              y: playerPos.y, 
              t: Date.now(), 
              ttl: 800,
              color: '#ffd43b',
              size: 16
            }])
          } else if (skillType === 'meteor') {
            setEffects(s => [...s, { 
              kind: 'meteor', 
               x: playerPos.x, 
               y: playerPos.y, 
               t: Date.now(), 
               ttl: 1200,
               color: '#ff6b6b',
               size: 35
             }])
           } else if (skillType === 'blade_vortex') {
             setEffects(s => [...s, { 
               kind: 'blade_vortex', 
               x: playerPos.x, 
               y: playerPos.y, 
               t: Date.now(), 
               ttl: 5000,
               color: '#c0c0c0',
               size: 22
             }])
           } else if (skillType === 'frost_nova') {
             setEffects(s => [...s, { 
               kind: 'frost_nova', 
               x: playerPos.x, 
               y: playerPos.y, 
               t: Date.now(), 
               ttl: 1000,
               color: '#74c0fc',
               size: 28
             }])
           } else if (skillType === 'cleave') {
             setEffects(s => [...s, { 
               kind: 'cleave', 
               x: playerPos.x, 
               y: playerPos.y, 
               t: Date.now(), 
               ttl: 600,
               color: '#fbbf24',
               size: 20
             }])
           } else if (skillType === 'summon_skeletons') {
             setEffects(s => [...s, { 
               kind: 'summon_skeletons', 
               x: playerPos.x, 
               y: playerPos.y, 
               t: Date.now(), 
               ttl: 2000,
               color: '#9ca3af',
               size: 15
             }])
           }
         }
       })
     }, [state.log, enemyPositions, playerPos])

  // Collision detection function
  const checkCollision = (pos1: Position, pos2: Position, radius1: number, radius2: number): boolean => {
    const distance = dist(pos1, pos2)
    return distance < (radius1 + radius2)
  }

  // Use refs for animation values that don't need to trigger re-renders
  const animationStateRef = useRef({
    idleAnimation: 0,
    whirlwindRotation: 0,
    lastUpdate: performance.now(),
    calculatedPlayerPos: null as Position | null,
    calculatedEnemyPositions: null as Record<string, Position> | null,
    calculatedProjectiles: null as Projectile[] | null,
    calculatedEffects: null as Effect[] | null,
    calculatedDying: null as Record<string, number> | null,
    calculatedCamera: null as Camera | null
  })

  // Main game loop
  useEffect(() => {
    let raf = 0, last = performance.now()
    let frameCount = 0
    let fpsCounter = 0
    let lastFpsTime = performance.now()
    
    function frame(now: number) {
      const dt = Math.min(40, now - last); last = now
      frameCount++
      fpsCounter++
      
      // Performance monitoring: log FPS every 2 seconds
      if (now - lastFpsTime > 2000) {
        const fps = Math.round((fpsCounter * 1000) / (now - lastFpsTime))
        if (fps < 45) {
          console.warn(`🎮 Performance Warning: FPS dropped to ${fps}. Projectiles: ${projectiles.length}, Effects: ${effects.length}`)
        }
        fpsCounter = 0
        lastFpsTime = now
      }
      
      // Performance optimization: reduce frequency of expensive operations
      const shouldRunCollisionDetection = frameCount % 2 === 0 // Every other frame
      const shouldRunExpensiveCalculations = frameCount % 3 === 0 // Every 3rd frame

      // Update idle animation (using ref to avoid setState during render)
      animationStateRef.current.idleAnimation = now / 1000

      // Update Whirlwind rotation (using ref to avoid setState during render)
      if (whirlwindState.active) {
        const elapsed = now - whirlwindState.startTime
        animationStateRef.current.whirlwindRotation = elapsed * 0.01 // Fast spinning
      }

      // Store animation calculations in refs to avoid setState during render
      animationStateRef.current.lastUpdate = now
      
      // Calculate new positions but don't set state immediately
      let newPlayerPos = playerPos
      let newEnemyPositions = enemyPositions
      let newProjectiles = projectiles
      let newEffects = effects
      let newDying = dying
      let newCamera = camera
      


      // Enhanced movement system: 8-directional player control + AI movement
      const moveSpeed = whirlwindState.active ? 3.5 : 2.2 // Faster movement during Whirlwind
      
      // Calculate 8-directional player input movement
      let playerInputMovement = { x: 0, y: 0 }
      let hasPlayerInput = false
      
      // Check WASD and arrow keys for 8-directional movement
      if (keys.w || keys.arrowup) {
        playerInputMovement.y -= 1
        hasPlayerInput = true
      }
      if (keys.s || keys.arrowdown) {
        playerInputMovement.y += 1
        hasPlayerInput = true
      }
      if (keys.a || keys.arrowleft) {
        playerInputMovement.x -= 1
        hasPlayerInput = true
      }
      if (keys.d || keys.arrowright) {
        playerInputMovement.x += 1
        hasPlayerInput = true
      }
      
      // Normalize diagonal movement to maintain consistent speed
      if (hasPlayerInput) {
        const magnitude = Math.sqrt(playerInputMovement.x * playerInputMovement.x + playerInputMovement.y * playerInputMovement.y)
        if (magnitude > 0) {
          playerInputMovement.x = (playerInputMovement.x / magnitude) * moveSpeed
          playerInputMovement.y = (playerInputMovement.y / magnitude) * moveSpeed
        }
      }
      
      if (state.enemies.length > 0) {
        // Find nearest enemy
        let nearestEnemy: any = null
        let nearestPos: Position | null = null
        let nearestDistance = 9999
        
        state.enemies.forEach(e => {
          const enemyPos = enemyPositions[e.id]
          if (!enemyPos || e.hp <= 0) return
          
          const distance = dist(playerPos, enemyPos)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestEnemy = e
            nearestPos = enemyPos
          }
        })
        
        if (nearestEnemy && nearestPos) {
          // Analyze equipped skills to determine combat strategy
          const equippedSkills = state.player.skillBar.slots.filter((s: any) => s && s.isEquipped)
          let hasRangedSkills = false
          let maxRange = 0
          let optimalRange = 80 // Default melee range
          
          equippedSkills.forEach((skill: any) => {
            if (skill && skill.scaling) {
              // Check for projectile skills
              const projectileSkills = ['fireball', 'lightning_bolt', 'ice_shard', 'poison_arrow']
              if (projectileSkills.includes(skill.id)) {
                hasRangedSkills = true
                const skillRange = getScaledRange(skill)
                maxRange = Math.max(maxRange, skillRange)
                
                // Set optimal range to 70% of max range for better engagement (AUTO_SKILLS uses 120% buffer)
                optimalRange = Math.max(optimalRange, skillRange * 0.7)
              }
            }
          })
          
          // Calculate direction to nearest enemy for facing angle
          const dx = (nearestPos as Position).x - playerPos.x
          const dy = (nearestPos as Position).y - playerPos.y
          const distance = nearestDistance
          
          let targetPos = { ...playerPos }
          let shouldMove = false
          
          if (hasRangedSkills) {
            // Advanced ranged combat system with multi-enemy awareness
            const minRange = optimalRange * 0.8  // Increased from 0.7 for more stable positioning
            const maxRange = optimalRange * 1.15 // Reduced from 1.2 to prevent oscillation
            const dangerZone = 80 // Distance considered too close for safety (reduced for better engagement)
            
            // Find all nearby enemies within danger zone
            const nearbyEnemies = state.enemies.filter(e => {
              const enemyPos = enemyPositions[e.id]
              if (!enemyPos || e.hp <= 0) return false
              return dist(playerPos, enemyPos) < dangerZone
            }).map(e => ({
              enemy: e,
              pos: enemyPositions[e.id],
              distance: dist(playerPos, enemyPositions[e.id])
            }))
            
            // Calculate threat vector (average direction of all nearby enemies)
            let threatX = 0, threatY = 0
            nearbyEnemies.forEach(({ pos, distance }) => {
              const weight = 1 / Math.max(distance, 1) // Closer enemies have more weight
              const dx = pos.x - playerPos.x
              const dy = pos.y - playerPos.y
              threatX += dx * weight
              threatY += dy * weight
            })
            
            // Primary target positioning (nearest enemy) - use already calculated values
            
            if (nearbyEnemies.length > 1) {
              // Surrounded - prioritize evasion with intelligent pathfinding
              const threatMagnitude = Math.sqrt(threatX * threatX + threatY * threatY)
              if (threatMagnitude > 0) {
                // Primary escape direction (away from center of threat)
                const escapeX = -threatX / threatMagnitude
                const escapeY = -threatY / threatMagnitude
                const escapeDistance = moveSpeed * 1.0 // Reduced from 1.5 for less aggressive evasion
                
                // Try primary escape route
                let bestEscape = {
                  x: playerPos.x + escapeX * escapeDistance,
                  y: playerPos.y + escapeY * escapeDistance
                }
                
                // If primary escape is blocked by boundaries, try alternative directions
                if (!isWithinBounds(bestEscape, 18)) {
                  const alternativeDirections = [
                    { x: escapeY, y: -escapeX }, // Perpendicular left
                    { x: -escapeY, y: escapeX }, // Perpendicular right
                    { x: escapeX * 0.7 + escapeY * 0.7, y: escapeY * 0.7 - escapeX * 0.7 }, // Diagonal left
                    { x: escapeX * 0.7 - escapeY * 0.7, y: escapeY * 0.7 + escapeX * 0.7 }  // Diagonal right
                  ]
                  
                  for (const dir of alternativeDirections) {
                    const altEscape = {
                      x: playerPos.x + dir.x * escapeDistance,
                      y: playerPos.y + dir.y * escapeDistance
                    }
                    if (isWithinBounds(altEscape, 18)) {
                      bestEscape = altEscape
                      break
                    }
                  }
                  
                  // If all directions are blocked, try moving towards the center of the map
                  if (!isWithinBounds(bestEscape, 18)) {
                    const centerX = WORLD_WIDTH / 2
                    const centerY = WORLD_HEIGHT / 2
                    const toCenterX = centerX - playerPos.x
                    const toCenterY = centerY - playerPos.y
                    const toCenterMag = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY)
                    if (toCenterMag > 0) {
                      bestEscape = {
                        x: playerPos.x + (toCenterX / toCenterMag) * escapeDistance,
                        y: playerPos.y + (toCenterY / toCenterMag) * escapeDistance
                      }
                    }
                  }
                }
                
                targetPos = bestEscape
                shouldMove = true
              }
            } else if (distance < minRange) {
              // Too close to primary target - retreat
              const retreatDistance = Math.min(minRange - distance + 20, moveSpeed * 1.0) // Reduced from 1.2
              const dirX = dx / Math.max(distance, 1)
              const dirY = dy / Math.max(distance, 1)
              targetPos = {
                x: playerPos.x - dirX * retreatDistance,
                y: playerPos.y - dirY * retreatDistance
              }
              shouldMove = true
            } else if (distance > maxRange) {
              // Too far - move closer to optimal range
              const approachDistance = Math.min(distance - optimalRange, moveSpeed)
              const dirX = dx / Math.max(distance, 1)
              const dirY = dy / Math.max(distance, 1)
              targetPos = {
                x: playerPos.x + dirX * approachDistance,
                y: playerPos.y + dirY * approachDistance
              }
              shouldMove = true
            }
          } else {
            // Melee combat strategy - move close with deadzone
            if (distance > 60) {
              const moveDistance = Math.min(distance - 50, moveSpeed)
              const dirX = dx / Math.max(distance, 1)
              const dirY = dy / Math.max(distance, 1)
              targetPos = {
                x: playerPos.x + dirX * moveDistance,
                y: playerPos.y + dirY * moveDistance
              }
              shouldMove = true
            }
          }
          
          if (shouldMove) {
            // Enhanced collision detection with emergency escape for ranged combat
            let canMove = true
            let isEmergencyEscape = false
            
            // Check if this is an emergency escape (surrounded by multiple enemies)
            if (hasRangedSkills) {
              const nearbyCount = state.enemies.filter(e => {
                const enemyPos = enemyPositions[e.id]
                return enemyPos && e.hp > 0 && dist(playerPos, enemyPos) < 60 // Reduced from 120
              }).length
              isEmergencyEscape = nearbyCount > 1
            }
            
            // For emergency escapes, use more lenient collision detection
            const collisionBuffer = isEmergencyEscape ? 8 : 18
            const enemyBuffer = isEmergencyEscape ? 0 : 2
            
            state.enemies.forEach(e => {
              const enemyPos = enemyPositions[e.id]
              if (enemyPos && e.hp > 0) {
                // Calculate enemy radius based on type and level
                let enemyRadius = 12
                if (e.type === 'melee') {
                  enemyRadius = 12 + e.level * 0.8
                } else if (e.type === 'ranged') {
                  enemyRadius = 10 + e.level * 0.6
                } else {
                  enemyRadius = 14 + e.level * 1.0
                }
                
                // Check collision with adjusted buffers
                if (checkCollision(targetPos, enemyPos, collisionBuffer, enemyRadius + enemyBuffer)) {
                  canMove = false
                }
              }
            })
            
            if (canMove && isWithinBounds(targetPos, 18)) {
              newPlayerPos = targetPos
            } else if (isEmergencyEscape && isWithinBounds(targetPos, 18)) {
              // Force movement for emergency escape even with minor collisions
              newPlayerPos = targetPos
            }
          }
          
          // Always face the nearest enemy (preserve auto-battle targeting)
          const newFacingAngle = Math.atan2(dy, dx)
          setPlayerFacingAngle(newFacingAngle)
          
          // Removed idle animation during combat to prevent convulsing
        }
      } else {
        // No enemies, idle movement animation (only if no player input)
        if (!hasPlayerInput) {
          newPlayerPos = {
            x: playerPos.x + Math.sin(now / 2000) * 0.3,
            y: playerPos.y + Math.cos(now / 3000) * 0.2
          }
        }
      }
      
      // Apply player input movement (works with or without enemies)
      if (hasPlayerInput) {
        const playerControlledPos = {
          x: playerPos.x + playerInputMovement.x,
          y: playerPos.y + playerInputMovement.y
        }
        
        // Check collision with enemies for player movement
        let canMovePlayer = true
        state.enemies.forEach(e => {
          const enemyPos = enemyPositions[e.id]
          if (enemyPos && e.hp > 0) {
            let enemyRadius = 12
            if (e.type === 'melee') {
              enemyRadius = 12 + e.level * 0.8
            } else if (e.type === 'ranged') {
              enemyRadius = 10 + e.level * 0.6
            } else {
              enemyRadius = 14 + e.level * 1.0
            }
            
            if (checkCollision(playerControlledPos, enemyPos, 18, enemyRadius + 2)) {
              canMovePlayer = false
            }
          }
        })
        
        // Apply player movement if valid
        if (canMovePlayer && isWithinBounds(playerControlledPos, 18)) {
          newPlayerPos = playerControlledPos
          
          // Update facing direction based on movement when no enemies (preserve auto-targeting with enemies)
          if (state.enemies.length === 0) {
            const movementAngle = Math.atan2(playerInputMovement.y, playerInputMovement.x)
            setPlayerFacingAngle(movementAngle)
          }
        }
      }

      // Player pushback system - push player outside of overlapping enemies
      const playerRadius = 18
      const pushbackDistance = 40
      
      state.enemies.forEach(e => {
        const enemyPos = enemyPositions[e.id]
        if (enemyPos && e.hp > 0) {
          // Calculate enemy radius
          let enemyRadius = 12
          if (e.type === 'melee') {
            enemyRadius = 12 + e.level * 0.8
          } else if (e.type === 'ranged') {
            enemyRadius = 10 + e.level * 0.6
          } else {
            enemyRadius = 14 + e.level * 1.0
          }
          
          // Check if player is overlapping with enemy
          const distance = dist(newPlayerPos, enemyPos)
          const minDistance = playerRadius + enemyRadius
          
          if (distance < minDistance) {
            // Calculate direction from enemy to player
            const dx = newPlayerPos.x - enemyPos.x
            const dy = newPlayerPos.y - enemyPos.y
            const currentDistance = Math.hypot(dx, dy) || 1
            
            // Normalize direction and push player to desired distance
            const normalizedX = dx / currentDistance
            const normalizedY = dy / currentDistance
            const targetDistance = enemyRadius + pushbackDistance
            
            // Calculate new player position
            const pushedPlayerPos = {
              x: enemyPos.x + normalizedX * targetDistance,
              y: enemyPos.y + normalizedY * targetDistance
            }
            
            // Ensure the pushed position is within world bounds
            if (isWithinBounds(pushedPlayerPos, playerRadius)) {
              newPlayerPos = pushedPlayerPos
            }
          }
        }
      })

      // Update camera to follow player
      const playerIso = worldToIso(newPlayerPos.x, newPlayerPos.y)
      newCamera = {
        x: camera.x + (playerIso.x - camera.x) * 0.1, // Smooth following
        y: camera.y + (playerIso.y - camera.y) * 0.1,
        zoom: camera.zoom
      }

      // Move enemies towards player
      const nextEnemyPositions = { ...enemyPositions }
      const nextDying = { ...dying }
      state.enemies.forEach((e, idx) => {
        const p = nextEnemyPositions[e.id] || { x: CANVAS_W - 120, y: CANVAS_H/2 }
        if (e.hp <= 0) {
          // Mark enemy as dying
          if (!nextDying[e.id]) {
            nextDying[e.id] = Date.now()
          }
          return
        }
        // Move towards player
        const dx = newPlayerPos.x - p.x, dy = newPlayerPos.y - p.y, d = Math.hypot(dx,dy)||1
        const calculatedPos = { x: p.x + dx/d*0.3, y: p.y + dy/d*0.3 }
        
        // Calculate current enemy radius
        let currentEnemyRadius = 12
        if (e.type === 'melee') {
          currentEnemyRadius = 12 + e.level * 0.8
        } else if (e.type === 'ranged') {
          currentEnemyRadius = 10 + e.level * 0.6
        } else {
          currentEnemyRadius = 14 + e.level * 1.0
        }
        
        // Check collision with other enemies first
        let canMove = true
        state.enemies.forEach(otherE => {
          if (otherE.id !== e.id) {
            const otherPos = nextEnemyPositions[otherE.id]
            if (otherPos) {
              // Calculate other enemy radius
              let otherEnemyRadius = 12
              if (otherE.type === 'melee') {
                otherEnemyRadius = 12 + otherE.level * 0.8
              } else if (otherE.type === 'ranged') {
                otherEnemyRadius = 10 + otherE.level * 0.6
              } else {
                otherEnemyRadius = 14 + otherE.level * 1.0
              }
              
              if (checkCollision(calculatedPos, otherPos, currentEnemyRadius + 1, otherEnemyRadius + 1)) {
                canMove = false
              }
            }
          }
        })
        
        // Check collision with player - enemies should not move through the player
        if (canMove) {
          const playerRadius = 18 // Same radius used for player collision detection
          if (checkCollision(calculatedPos, newPlayerPos, currentEnemyRadius + 2, playerRadius)) {
            canMove = false
          }
        }
        
        // Allow movement unless colliding with other enemies or player
        if (canMove) {
          nextEnemyPositions[e.id] = calculatedPos
        }
      })
      newEnemyPositions = nextEnemyPositions
      newDying = nextDying

      // Update projectiles and check for impacts
      const nextEffects = [...effects]
      const updatedProjectiles = projectiles.map(p => {
        let newVx = p.vx
        let newVy = p.vy
        
        // Enhanced target tracking for fireballs
        if (p.type === 'fireball' && p.targetId) {
          const targetPos = newEnemyPositions[p.targetId]
          if (targetPos) {
            // Calculate direction to target
            const dx = targetPos.x - p.x
            const dy = targetPos.y - p.y
            const distance = Math.hypot(dx, dy)
            
            if (distance > 0) {
              // Gentle homing behavior - adjust velocity slightly toward target
              const homingStrength = 0.15 // How strongly it homes in
              const targetVx = (dx / distance) * Math.hypot(p.vx, p.vy)
              const targetVy = (dy / distance) * Math.hypot(p.vx, p.vy)
              
              newVx = p.vx + (targetVx - p.vx) * homingStrength
              newVy = p.vy + (targetVy - p.vy) * homingStrength
            }
          }
        }
        
        const newP = { 
          ...p, 
          x: p.x + newVx, 
          y: p.y + newVy,
          vx: newVx,
          vy: newVy,
          life: p.life - dt,
          rotation: p.rotation !== undefined ? p.rotation + 0.3 : undefined
        }
        
        // Debug fireball lifecycle
        if (p.type === 'fireball' && p.life > 0 && newP.life <= 0) {
          console.log(`🔥 Fireball expired - Original life: ${p.life}ms, dt: ${dt}ms, New life: ${newP.life}ms`)
        }
        
        // Add continuous fire particle trail for fireballs
        if (p.type === 'fireball' && Math.random() < 0.3) { // 30% chance per frame
          nextEffects.push({
            kind: 'fire_particle',
            x: p.x + (Math.random() - 0.5) * 10,
            y: p.y + (Math.random() - 0.5) * 10,
            t: Date.now(),
            ttl: 800 + Math.random() * 400, // 0.8-1.2 seconds
            color: '#ff8800',
            size: 2 + Math.random() * 2
          })
        }
        
        return newP
      })
      
      // Check for projectile-enemy collisions
      const remainingProjectiles = updatedProjectiles.filter(p => {
        if (p.life <= 0) {
          return false
        }
        
        // Note: Always run collision detection for visual consistency
        // Performance optimization moved to other areas
        
        // Check collision with enemies
        let hit = false
        state.enemies.forEach(e => {
          const enemyPos = newEnemyPositions[e.id]
          if (enemyPos && !hit) {
            let enemyRadius = 12
            if (e.type === 'melee') {
              enemyRadius = 12 + e.level * 0.8
            } else if (e.type === 'ranged') {
              enemyRadius = 10 + e.level * 0.6
            } else {
              enemyRadius = 14 + e.level * 1.0
            }
            
            if (checkCollision({x: p.x, y: p.y}, enemyPos, p.radius, enemyRadius)) {
              // Apply damage if projectile has damage information
              if (p.damage && p.damage > 0) {
                console.log(`💥 Projectile ${p.skillId} hits ${e.name} for ${p.damage} damage!`)
                
                // Apply damage to enemy through game context
                actions.log(`ANIM_PLAYER|${e.id}|magic|Rare|hit|${p.damage}`)
                actions.log(`⚡ ${p.skillId} hits ${e.name} for ${p.damage} damage!`)
                
                // Apply damage directly to enemy
                const targetIndex = state.enemies.findIndex(enemy => enemy.id === e.id)
                if (targetIndex !== -1 && state.enemies[targetIndex].hp > 0) {
                  // Create a copy of enemies array and update the specific enemy
                  const updatedEnemies = [...state.enemies]
                  updatedEnemies[targetIndex] = {
                    ...updatedEnemies[targetIndex],
                    hp: Math.max(0, updatedEnemies[targetIndex].hp - p.damage)
                  }
                  
                  // Update the game state with new enemy HP
                  const enemyRecord: Record<string, { x: number; y: number }> = {}
                  updatedEnemies.forEach(enemy => {
                    enemyRecord[enemy.id] = { x: enemy.position?.x || 0, y: enemy.position?.y || 0 }
                  })
                  actions.updateEnemyPositions(enemyRecord)
                }
              }
              
              // Create enhanced impact effect based on projectile type
              if (p.type === 'fireball') {
                // Fireball explosion effect - significantly longer duration
                nextEffects.push({ 
                  kind: 'fireball_explosion', 
                  x: p.x, 
                  y: p.y, 
                  t: Date.now(), 
                  ttl: 3000, // Increased from 800ms to 3 seconds
                  color: p.color,
                  size: p.size * 3
                })
                
                // Add fire particles - longer duration and more particles
                for (let i = 0; i < 12; i++) {
                  const angle = (i / 12) * Math.PI * 2
                  const distance = 20 + Math.random() * 40
                  nextEffects.push({
                    kind: 'fire_particle',
                    x: p.x + Math.cos(angle) * distance,
                    y: p.y + Math.sin(angle) * distance,
                    t: Date.now(),
                    ttl: 1500 + Math.random() * 1000, // Increased from 400-600ms to 1.5-2.5 seconds
                    color: '#ff6600',
                    size: 3 + Math.random() * 3
                  })
                }
              } else {
                // Standard impact effect
                nextEffects.push({ 
                  kind: 'impact', 
                  x: p.x, 
                  y: p.y, 
                  t: Date.now(), 
                  ttl: 300, 
                  color: p.color,
                  size: p.size * 2
                })
              }
              
              hit = true
            }
          }
        })
        
        return !hit
      })
      
      // Improved projectile lifecycle management to prevent fireball disappearing
      const maxProjectiles = 250 // Increased limit for better visual experience
      if (remainingProjectiles.length > maxProjectiles) {
        // Prioritize fireball projectiles to ensure they're not removed
        const fireballProjectiles = remainingProjectiles.filter(p => p.type === 'fireball')
        const otherProjectiles = remainingProjectiles.filter(p => p.type !== 'fireball')
        
        // Sort other projectiles by remaining life
        otherProjectiles.sort((a, b) => {
          // For homing projectiles, prioritize by distance to target
          if (a.homing && b.homing && a.targetX !== undefined && a.targetY !== undefined && b.targetX !== undefined && b.targetY !== undefined) {
            const distA = Math.sqrt((a.targetX - a.x) ** 2 + (a.targetY - a.y) ** 2)
            const distB = Math.sqrt((b.targetX - b.x) ** 2 + (b.targetY - b.y) ** 2)
            return distB - distA // Keep projectiles further from target (more life)
          }
          // For non-homing projectiles, prioritize by remaining life
          return (b.life || 0) - (a.life || 0)
        })
        
        // Reserve space for fireball projectiles, fill remaining with other projectiles
        const fireballSlots = Math.min(fireballProjectiles.length, Math.floor(maxProjectiles * 0.4)) // Reserve 40% for fireballs
        const otherSlots = maxProjectiles - fireballSlots
        
        newProjectiles = [
          ...fireballProjectiles.slice(0, fireballSlots),
          ...otherProjectiles.slice(0, otherSlots)
        ]
      } else {
        newProjectiles = remainingProjectiles
      }
      // Filter expired effects and limit total count for performance
      const filteredEffects = nextEffects.filter(e => (Date.now() - e.t) < e.ttl)
      const maxEffects = 400 // Increased limit for better visual richness
      if (filteredEffects.length > maxEffects) {
        // Prioritize fireball effects to prevent them from being removed
        const fireballEffects = filteredEffects.filter(e => 
          e.kind === 'fireball_explosion' || e.kind === 'fire_particle'
        )
        const otherEffects = filteredEffects.filter(e => 
          e.kind !== 'fireball_explosion' && e.kind !== 'fire_particle'
        )
        
        // Sort other effects by age, keep newer effects
        otherEffects.sort((a, b) => b.t - a.t)
        
        // Reserve space for fireball effects, fill remaining with other effects
        const fireballSlots = Math.min(fireballEffects.length, Math.floor(maxEffects * 0.3)) // Reserve 30% for fireball effects
        const otherSlots = maxEffects - fireballSlots
        
        newEffects = [
          ...fireballEffects.slice(0, fireballSlots),
          ...otherEffects.slice(0, otherSlots)
        ]
      } else {
        newEffects = filteredEffects
      }
      
      // Debug logging for effects issues
      if (frameCount % 300 === 0) { // Log every 5 seconds at 60fps
        const fireballEffects = newEffects.filter(e => e.kind === 'fireball_explosion' || e.kind === 'fire_particle')
        const fireballProjectiles = newProjectiles.filter(p => p.type === 'fireball')
        
        console.log(`🔥 Fireball Status - Projectiles: ${fireballProjectiles.length}, Effects: ${fireballEffects.length}, Total Effects: ${newEffects.length}/${maxEffects}`)
        
        if (fireballEffects.length === 0 && fireballProjectiles.length > 0) {
          console.warn('🔥 Fireball effects missing despite active fireball projectiles')
        }
        
        if (newEffects.length >= maxEffects) {
          console.log(`⚠️ Effects limit reached (${maxEffects}), prioritization active`)
        }
      }
      


      // Store calculated values in animation state ref
      animationStateRef.current.calculatedPlayerPos = newPlayerPos
      animationStateRef.current.calculatedEnemyPositions = newEnemyPositions
      animationStateRef.current.calculatedProjectiles = newProjectiles
      animationStateRef.current.calculatedEffects = newEffects
      animationStateRef.current.calculatedDying = newDying
      animationStateRef.current.calculatedCamera = newCamera

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [state.enemies, state.player, state.log, whirlwindState, playerPos, enemyPositions, camera, projectiles, effects, dying])

  // Separate effect to update state at a lower frequency
  useEffect(() => {
    const updateState = () => {
      const animState = animationStateRef.current
      if (animState.calculatedPlayerPos) {
        setPlayerPos(animState.calculatedPlayerPos)
        actions.updatePlayerPosition(animState.calculatedPlayerPos)
      }
      if (animState.calculatedEnemyPositions) {
        setEnemyPositions(animState.calculatedEnemyPositions)
      }
      if (animState.calculatedProjectiles) {
        setProjectiles(animState.calculatedProjectiles)
      }
      if (animState.calculatedEffects) {
        setEffects(animState.calculatedEffects)
      }
      if (animState.calculatedDying) {
        setDying(animState.calculatedDying)
      }
      if (animState.calculatedCamera) {
        setCamera(animState.calculatedCamera)
      }
    }

    const interval = setInterval(updateState, 16) // ~60fps for state updates
    return () => clearInterval(interval)
  }, [])

  const draw = useCallback(() => {
    const now = performance.now()
    if (now - lastFrameTime.current < frameInterval) {
      return // Skip frame to maintain target FPS
    }
    lastFrameTime.current = now

    // Reset pool index for each frame
    poolIndex = 0

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Optimize canvas clearing and background drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a3441';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // draw enemies
    state.enemies.forEach((e, i) => {
      const worldPos = enemyPositions[e.id] || { x: 200 + i * 40, y: 100 + (i % 5 - 2) * 50 };
      const screenPos = worldToScreen(worldPos.x, worldPos.y);
      const dyingStart = dying[e.id];
      const alpha = e.hp <= 0 && dyingStart ? Math.max(0, 1 - ((Date.now() - dyingStart) / 1500)) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;

      // Determine size and color based on enemy type and level
      let radius = 12;
      if (e.type === 'melee') {
        ctx.fillStyle = '#dc2626';
        radius = 12 + e.level * 0.8;
      } else if (e.type === 'ranged') {
        ctx.fillStyle = '#f97316';
        radius = 10 + e.level * 0.6;
      } else {
        ctx.fillStyle = '#a78bfa';
        radius = 14 + e.level * 1.0;
      }

      // Draw enemy circle
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius * camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      // Draw enemy type indicators
      ctx.fillStyle = '#ffffff';
      if (e.type === 'melee') {
        ctx.beginPath();
        ctx.moveTo(screenPos.x - 8 * camera.zoom, screenPos.y - 18 * camera.zoom);
        ctx.lineTo(screenPos.x - 2 * camera.zoom, screenPos.y - 26 * camera.zoom);
        ctx.lineTo(screenPos.x + 4 * camera.zoom, screenPos.y - 18 * camera.zoom);
        ctx.fill();
      } else if (e.type === 'ranged') {
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y - 6 * camera.zoom, 6 * camera.zoom, Math.PI * 0.2, Math.PI * 0.8);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, (radius + 6) * camera.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw HP bar
      drawHpBar(ctx, screenPos.x, screenPos.y - (radius + 15) * camera.zoom, 40 * camera.zoom, 6 * camera.zoom, e.hp, e.maxHp, alpha);

      // Draw level label
      drawLabel(ctx, `Lv.${e.level}`, screenPos.x, screenPos.y - (radius + 25) * camera.zoom, alpha);

      ctx.restore();
    });

    // draw player
    const playerScreenPos = worldToScreen(playerPos.x, playerPos.y);
    const playerSize = 32 * camera.zoom;
    
    // Add idle animation effect when no enemies
    let animationOffset = 0;
    if (state.enemies.length === 0) {
      animationOffset = Math.sin(idleAnimation * 2) * 2 * camera.zoom;
    }
    
    ctx.save();
    
    // Apply rotation during Whirlwind
    if (whirlwindState.active) {
      ctx.translate(playerScreenPos.x, playerScreenPos.y + animationOffset);
      ctx.rotate(whirlwindState.rotation);
      ctx.translate(-playerScreenPos.x, -playerScreenPos.y - animationOffset);
      
      // Add spinning blur effect
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8 * camera.zoom;
    }
    
    // Draw subtle aura effect beneath player (simplified to avoid double model appearance)
    const time = Date.now() * 0.003;
    const auraRadius = 20 * camera.zoom;
    const auraPulse = Math.sin(time * 1.2) * 0.15 + 0.85; // Gentler pulsing
    
    // Draw single subtle aura ring
    const alpha = 0.08 * auraPulse; // Much more subtle
    
    // Create gradient for the aura
    const gradient = ctx.createRadialGradient(
      playerScreenPos.x, playerScreenPos.y + 8 * camera.zoom,
      0,
      playerScreenPos.x, playerScreenPos.y + 8 * camera.zoom,
      auraRadius
    );
    
    if (whirlwindState.active) {
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.5})`);
      gradient.addColorStop(0.8, `rgba(200, 200, 255, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    } else {
      gradient.addColorStop(0, `rgba(100, 150, 255, ${alpha})`);
      gradient.addColorStop(0.8, `rgba(50, 100, 200, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(playerScreenPos.x, playerScreenPos.y + 8 * camera.zoom, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw simple player character
    const playerRadius = 16;
    
    // Player body (blue circle)
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(playerScreenPos.x, playerScreenPos.y + animationOffset, playerRadius * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    
    // Player indicator (white dot in center)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playerScreenPos.x, playerScreenPos.y + animationOffset, 4 * camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    
    // Removed breathing animation to eliminate flashing effect
    // Level label is now handled by the drawLabel function below to avoid duplication
    
    ctx.restore();

    // Draw enhanced arc-shaped facing direction indicator
    if (state.enemies.length > 0) {
      ctx.save();
      
      // Arc properties
      const playerRadius = 16; // Player model radius
      const arcDistance = 20; // 20px separation from player model edge
      const arcRadius = (playerRadius + arcDistance) * camera.zoom;
      const arcSpread = Math.PI / 3; // 60 degrees spread (π/3 radians)
      const arcAlpha = 0.7 + Math.sin(time * 2.5) * 0.2; // Enhanced pulsing
      
      // Calculate arc center
      const arcCenterX = playerScreenPos.x;
      const arcCenterY = playerScreenPos.y + animationOffset;
      
      // Arc angles
      const startAngle = playerFacingAngle - arcSpread / 2;
      const endAngle = playerFacingAngle + arcSpread / 2;
      
      // Create radial gradient for arc
      const gradient = ctx.createRadialGradient(
        arcCenterX, arcCenterY, arcRadius * 0.8,
        arcCenterX, arcCenterY, arcRadius * 1.2
      );
      
      if (whirlwindState.active) {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${arcAlpha * 0.9})`);
        gradient.addColorStop(0.5, `rgba(200, 200, 255, ${arcAlpha * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${arcAlpha * 0.3})`);
      } else {
        gradient.addColorStop(0, `rgba(100, 200, 255, ${arcAlpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(150, 220, 255, ${arcAlpha * 0.9})`);
        gradient.addColorStop(1, `rgba(200, 240, 255, ${arcAlpha * 0.4})`);
      }
      
      // Draw the main arc
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6 * camera.zoom;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(arcCenterX, arcCenterY, arcRadius, startAngle, endAngle);
      ctx.stroke();
      
      // Add inner glow arc
      ctx.strokeStyle = whirlwindState.active 
        ? `rgba(255, 255, 255, ${arcAlpha * 0.6})` 
        : `rgba(180, 230, 255, ${arcAlpha * 0.7})`;
      ctx.lineWidth = 3 * camera.zoom;
      ctx.beginPath();
      ctx.arc(arcCenterX, arcCenterY, arcRadius, startAngle, endAngle);
      ctx.stroke();
      
      // Add directional arrow at the center of the arc
      const arrowLength = 8 * camera.zoom;
      const arrowX = arcCenterX + Math.cos(playerFacingAngle) * arcRadius;
      const arrowY = arcCenterY + Math.sin(playerFacingAngle) * arcRadius;
      
      // Arrow tip
      const arrowTipX = arrowX + Math.cos(playerFacingAngle) * arrowLength;
      const arrowTipY = arrowY + Math.sin(playerFacingAngle) * arrowLength;
      
      // Arrow wings
      const wingAngle = Math.PI / 6; // 30 degrees
      const wingLength = arrowLength * 0.6;
      const leftWingX = arrowX + Math.cos(playerFacingAngle - wingAngle) * wingLength;
      const leftWingY = arrowY + Math.sin(playerFacingAngle - wingAngle) * wingLength;
      const rightWingX = arrowX + Math.cos(playerFacingAngle + wingAngle) * wingLength;
      const rightWingY = arrowY + Math.sin(playerFacingAngle + wingAngle) * wingLength;
      
      // Draw arrow
      ctx.fillStyle = whirlwindState.active 
        ? `rgba(255, 255, 255, ${arcAlpha * 0.9})` 
        : `rgba(255, 255, 255, ${arcAlpha * 0.8})`;
      ctx.strokeStyle = whirlwindState.active 
        ? `rgba(100, 100, 255, ${arcAlpha * 0.8})` 
        : `rgba(50, 100, 200, ${arcAlpha * 0.9})`;
      ctx.lineWidth = 2 * camera.zoom;
      
      ctx.beginPath();
      ctx.moveTo(arrowTipX, arrowTipY);
      ctx.lineTo(leftWingX, leftWingY);
      ctx.lineTo(rightWingX, rightWingY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Add subtle energy particles along the arc
      const particleCount = 5;
      for (let i = 0; i < particleCount; i++) {
        const particleAngle = startAngle + (endAngle - startAngle) * (i / (particleCount - 1));
        const particleX = arcCenterX + Math.cos(particleAngle) * arcRadius;
        const particleY = arcCenterY + Math.sin(particleAngle) * arcRadius;
        
        const particleSize = (1.5 + Math.sin(time * 4 + i * 0.8)) * camera.zoom;
        const particleAlpha = arcAlpha * (0.6 + Math.sin(time * 3 + i * 1.2) * 0.3);
        
        ctx.fillStyle = whirlwindState.active 
          ? `rgba(255, 255, 255, ${particleAlpha})` 
          : `rgba(200, 230, 255, ${particleAlpha})`;
        
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }

    // Draw player HP bar
    drawHpBar(ctx, playerScreenPos.x, playerScreenPos.y - 35 * camera.zoom + animationOffset, 50 * camera.zoom, 8 * camera.zoom, state.player.hp, state.player.maxHp, 1);

    // Draw player level label
    drawLabel(ctx, `Lv.${state.player.level}`, playerScreenPos.x, playerScreenPos.y - 50 * camera.zoom + animationOffset, 1);

    // Debug AOE Range Visualization
    if (debugAOE) {
      ctx.save()
      
      // 1. Draw Player Collision Radius (always visible when debug is on)
      const playerRadius = 16 // Player collision radius
      const scaledPlayerRadius = playerRadius * camera.zoom
      
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = '#ff4444' // Red for player collision radius
      ctx.lineWidth = 2 * camera.zoom
      ctx.setLineDash([4 * camera.zoom, 2 * camera.zoom]) // Short dashed line
      
      ctx.beginPath()
      ctx.arc(playerScreenPos.x, playerScreenPos.y + animationOffset, scaledPlayerRadius, 0, Math.PI * 2)
      ctx.stroke()
      
      // Player radius label
      ctx.globalAlpha = 0.8
      ctx.fillStyle = '#ff4444'
      ctx.font = `${10 * camera.zoom}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(
        `Player: ${playerRadius}px`, 
        playerScreenPos.x, 
        playerScreenPos.y + animationOffset - scaledPlayerRadius - 8 * camera.zoom
      )
      
      // 2. Draw Basic Attack Range (melee range)
      const basicAttackRange = 80 // Default melee range from GameCanvas movement logic
      const scaledBasicAttackRange = basicAttackRange * camera.zoom
      
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = '#ffaa00' // Orange for basic attack range
      ctx.lineWidth = 3 * camera.zoom
      ctx.setLineDash([6 * camera.zoom, 3 * camera.zoom]) // Medium dashed line
      
      ctx.beginPath()
      ctx.arc(playerScreenPos.x, playerScreenPos.y + animationOffset, scaledBasicAttackRange, 0, Math.PI * 2)
      ctx.stroke()
      
      // Basic attack range label
      ctx.globalAlpha = 0.9
      ctx.fillStyle = '#ffaa00'
      ctx.font = `${11 * camera.zoom}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(
        `Basic Attack: ${basicAttackRange}px`, 
        playerScreenPos.x, 
        playerScreenPos.y + animationOffset + scaledBasicAttackRange + 15 * camera.zoom
      )

      // Compass Direction Indicators (N, S, E, W) at edge of basic attack range
      ctx.globalAlpha = 0.8
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2 * camera.zoom
      ctx.font = `bold ${14 * camera.zoom}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // North (top)
      const northX = playerScreenPos.x
      const northY = playerScreenPos.y + animationOffset - scaledBasicAttackRange
      ctx.strokeText('N', northX, northY)
      ctx.fillText('N', northX, northY)
      
      // South (bottom)
      const southX = playerScreenPos.x
      const southY = playerScreenPos.y + animationOffset + scaledBasicAttackRange
      ctx.strokeText('S', southX, southY)
      ctx.fillText('S', southX, southY)
      
      // East (right)
      const eastX = playerScreenPos.x + scaledBasicAttackRange
      const eastY = playerScreenPos.y + animationOffset
      ctx.strokeText('E', eastX, eastY)
      ctx.fillText('E', eastX, eastY)
      
      // West (left)
      const westX = playerScreenPos.x - scaledBasicAttackRange
      const westY = playerScreenPos.y + animationOffset
      ctx.strokeText('W', westX, westY)
      ctx.fillText('W', westX, westY)

      // 3. Draw Skill Ranges for all equipped skills
      const equippedSkills = state.player.skillBar.slots.filter((s: any) => s !== null)
      let skillOffset = 1 // Start at 1 to account for basic attack label
      
      equippedSkills.forEach((skill: any, index: number) => {
        if (skill && skill.scaling) {
          let skillRange = 0
          let skillColor = '#00ff00' // Default green
          let skillName = skill.name || skill.id
          
          // Calculate range based on skill type
          if (skill.scaling.baseArea && skill.scaling.areaPerLevel) {
            // AOE skills like Whirlwind
            const skillArea = skill.scaling.baseArea + (skill.level - 1) * skill.scaling.areaPerLevel
            skillRange = skillArea * 30 // Convert area to pixel range
            skillColor = '#00ff00' // Green for AOE
          } else if (skill.scaling.baseRange && skill.scaling.rangePerLevel) {
          // Projectile skills with range scaling (like fireball)
          skillRange = getScaledRange(skill)
            skillColor = '#ff8844' // Orange for projectiles
            
            // Debug logging for fireball range calculation
            if (skill.id === 'fireball') {
              console.log('Fireball Debug:', {
                skillId: skill.id,
                skillName: skill.name,
                skillLevel: skill.level,
                baseRange: skill.scaling.baseRange,
                rangePerLevel: skill.scaling.rangePerLevel,
                calculatedRange: skillRange,
                cameraZoom: camera.zoom,
                scaledRange: skillRange * camera.zoom
              })
            }
          } else if (skill.id === 'lightning_bolt' || skill.id === 'ice_shard') {
            // Legacy projectile skills without range scaling - use a default range
            skillRange = 200 // Default projectile range
            skillColor = '#ff8844' // Orange for projectiles
          }
          
          if (skillRange > 0) {
            const scaledSkillRange = skillRange * camera.zoom
            
            // Draw skill range circle
            ctx.globalAlpha = 0.3
            ctx.strokeStyle = skillColor
            ctx.lineWidth = 3 * camera.zoom
            ctx.setLineDash([8 * camera.zoom, 4 * camera.zoom]) // Dashed line
            
            ctx.beginPath()
            ctx.arc(playerScreenPos.x, playerScreenPos.y + animationOffset, scaledSkillRange, 0, Math.PI * 2)
            ctx.stroke()
            
            // Skill range label
            ctx.globalAlpha = 0.8
            ctx.fillStyle = skillColor
            ctx.font = `${11 * camera.zoom}px Arial`
            ctx.textAlign = 'center'
            
            const labelY = playerScreenPos.y + animationOffset + scaledSkillRange + (15 + skillOffset * 15) * camera.zoom
            
            // Show detailed debug info for fireball
            if (skill.id === 'fireball') {
              ctx.fillText(
                `${skillName}: ${Math.round(skillRange)}px (Lv.${skill.level}) [base:${skill.scaling.baseRange}, +${skill.scaling.rangePerLevel}/lv, zoom:${camera.zoom.toFixed(2)}]`, 
                playerScreenPos.x, 
                labelY
              )
            } else {
              ctx.fillText(
                `${skillName}: ${Math.round(skillRange)}px (Lv.${skill.level})`, 
                playerScreenPos.x, 
                labelY
              )
            }
            
            skillOffset++
          }
        }
      })
      
      // 3. Debug info summary and legend
      ctx.globalAlpha = 0.9
      ctx.fillStyle = '#ffffff'
      ctx.font = `${12 * camera.zoom}px Arial`
      ctx.textAlign = 'left'
      ctx.fillText(
        `Debug AOE (F1) | Skills: ${equippedSkills.length}`, 
        10 * camera.zoom, 
        30 * camera.zoom
      )
      
      // 4. Color legend
      const legendY = 50 * camera.zoom
      const legendSpacing = 18 * camera.zoom
      ctx.font = `${10 * camera.zoom}px Arial`
      
      // Player radius legend
      ctx.fillStyle = '#ff4444'
      ctx.fillText('● Player Collision (16px)', 10 * camera.zoom, legendY)
      
      // Basic attack range legend
      ctx.fillStyle = '#ffaa00'
      ctx.fillText('● Basic Attack Range (80px)', 10 * camera.zoom, legendY + legendSpacing)
      
      // AOE skills legend
      ctx.fillStyle = '#00ff00'
      ctx.fillText('● AOE Skills', 10 * camera.zoom, legendY + legendSpacing * 2)
      
      // Ranged skills legend
      ctx.fillStyle = '#4488ff'
      ctx.fillText('● Ranged Skills', 10 * camera.zoom, legendY + legendSpacing * 3)
      
      // Projectile skills legend
      ctx.fillStyle = '#ff8844'
      ctx.fillText('● Projectile Skills', 10 * camera.zoom, legendY + legendSpacing * 4)
      
      ctx.setLineDash([]) // Reset line dash
      ctx.restore()
    }

    // Trail rendering removed - using simple fireball visuals

    // draw projectiles - use calculated projectiles for real-time rendering, with proper fallback
    const calculatedProjs = animationStateRef.current.calculatedProjectiles
    const currentProjectiles = (calculatedProjs && calculatedProjs.length > 0) ? calculatedProjs : projectiles
    currentProjectiles.forEach(p => {
      const projectileScreenPos = worldToScreen(p.x, p.y);
      ctx.save();
      
      if (p.type === 'fireball') {
        // Simple fireball rendering matching test environment
        ctx.translate(projectileScreenPos.x, projectileScreenPos.y);
        if (p.rotation !== undefined) {
          ctx.rotate(p.rotation * Math.PI / 180);
        }
        
        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15 * camera.zoom);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 8 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(0, 0, 4 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standard projectile rendering
        if (p.glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10 * camera.zoom;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(projectileScreenPos.x, projectileScreenPos.y, p.radius * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    // draw effects
    effects.forEach(e => {
      const effectScreenPos = worldToScreen(e.x, e.y);
      const age = Date.now() - e.t;
      const progress = Math.min(1, age / e.ttl);

      if (e.kind === 'damage' || e.kind === 'critical_damage' || e.kind === 'player_damage' || e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        
        // Different font styles for different effect types
        if (e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block') {
          ctx.font = `bold ${(e.size || 16) * camera.zoom}px Arial`;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2 * camera.zoom;
        } else if (e.kind === 'critical_damage') {
          // Enhanced styling for critical hits
          ctx.font = `bold ${(e.size || 20) * camera.zoom}px Arial`;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3 * camera.zoom;
          // Add pulsing effect for critical hits
          const pulse = 1 + Math.sin(age * 0.01) * 0.2;
          ctx.globalAlpha = (1 - progress) * pulse;
        } else {
          ctx.font = `${(e.size || 16) * camera.zoom}px bold sans-serif`;
        }
        
        ctx.textAlign = 'center';
        const textY = effectScreenPos.y - progress * 20 * camera.zoom;
        
        // Add outline for better visibility
        if (e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block' || e.kind === 'critical_damage') {
          ctx.strokeText(e.text || '', effectScreenPos.x, textY);
        }
        
        ctx.fillText(e.text || '', effectScreenPos.x, textY);
        ctx.restore();
      } else if (e.kind === 'impact') {
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.fillStyle = e.color;
        
        // Create expanding circle impact effect
        const radius = (e.size || 8) * progress * 2;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add inner bright flash
        ctx.globalAlpha = (1 - progress) * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'fireball_explosion') {
        ctx.save();
        const explosionProgress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - explosionProgress) * 0.9;
        
        // Create expanding fireball explosion
        const radius = (e.size || 24) * explosionProgress * 1.5;
        
        // Outer fire ring
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Middle orange ring
        ctx.globalAlpha = (1 - explosionProgress) * 0.7;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.globalAlpha = (1 - explosionProgress) * 0.5;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // White hot center
        ctx.globalAlpha = (1 - explosionProgress) * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Explosion sparks
        ctx.globalAlpha = (1 - explosionProgress) * 0.8;
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + (age * 0.01);
          const distance = radius * (1.2 + Math.sin(age * 0.005 + i) * 0.3);
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          const sparkSize = (4 + Math.sin(age * 0.008 + i) * 2) * camera.zoom * (1 - explosionProgress);
          ctx.beginPath();
          ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (e.kind === 'fire_particle') {
        ctx.save();
        const particleProgress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - particleProgress) * 0.8;
        
        // Create floating fire particle
        const size = (e.size || 3) * camera.zoom * (1 - particleProgress * 0.5);
        const flicker = 1 + Math.sin(age * 0.02) * 0.3;
        
        // Particle glow
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8 * camera.zoom;
        
        // Main particle body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, size * flicker, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.shadowBlur = 0;
        ctx.globalAlpha = (1 - particleProgress) * 0.6;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, size * 0.6 * flicker, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'slash') {
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        const angle = e.angle || 0;
        const arcLength = (e.size || 40) * camera.zoom;
        const thickness = 6 * camera.zoom;
        
        // Simple arc animation - grows from center outward
        const animProgress = Math.sin(progress * Math.PI);
        const currentArcLength = arcLength * animProgress;
        
        // Create a slashing arc (90 degree arc)
        const arcSpan = Math.PI / 2; // 90 degrees
        const startAngle = angle - arcSpan / 2;
        const endAngle = angle + arcSpan / 2;
        
        // Draw the main slashing arc
        ctx.strokeStyle = e.color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentArcLength, startAngle, endAngle);
        ctx.stroke();
        
        // Add bright inner arc
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = thickness * 0.4;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentArcLength, startAngle, endAngle);
        ctx.stroke();
        
        // Add subtle glow
        ctx.globalAlpha = (1 - progress) * 0.3;
        ctx.shadowBlur = 10 * camera.zoom;
        ctx.shadowColor = e.color;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = thickness * 1.2;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentArcLength, startAngle, endAngle);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.restore();
      } else if (e.kind === 'explosion') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create expanding explosion effect
        const radius = (e.size || 15) * progress * 1.5;
        
        // Outer explosion ring
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#ffff88';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'lightning') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.9;
        
        // Create lightning bolt effect
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        ctx.lineCap = 'round';
        
        // Draw jagged lightning bolt
        const segments = 6;
        const length = (e.size || 12) * camera.zoom;
        ctx.beginPath();
        ctx.moveTo(effectScreenPos.x, effectScreenPos.y - length);
        
        for (let i = 1; i <= segments; i++) {
          const y = effectScreenPos.y - length + (i / segments) * length * 2;
          const x = effectScreenPos.x + (Math.random() - 0.5) * 20 * camera.zoom;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Add bright inner bolt
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 * camera.zoom;
        ctx.stroke();
        
        ctx.restore();
      } else if (e.kind === 'power_strike') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create power strike shockwave
        const radius = (e.size || 16) * progress * 2;
        
        // Outer shockwave
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4 * camera.zoom;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner energy burst
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'critical_burst') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        
        // Create spectacular critical hit burst effect
        const maxRadius = (e.size || 25) * camera.zoom;
        const currentRadius = maxRadius * progress;
        
        // Outer explosion ring with pulsing
        const pulse = 1 + Math.sin(age * 0.02) * 0.3;
        ctx.globalAlpha = (1 - progress) * 0.8 * pulse;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 6 * camera.zoom;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner bright flash
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Radiating energy lines
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI / 4) + (age * 0.005);
          const lineLength = currentRadius * 1.5;
          const startX = effectScreenPos.x + Math.cos(angle) * currentRadius * 0.3;
          const startY = effectScreenPos.y + Math.sin(angle) * currentRadius * 0.3;
          const endX = effectScreenPos.x + Math.cos(angle) * lineLength;
          const endY = effectScreenPos.y + Math.sin(angle) * lineLength;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        ctx.restore();
      } else if (e.kind === 'dodge_burst') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        
        // Create dodge burst effect with expanding rings
        const maxRadius = (e.size || 20) * camera.zoom;
        const currentRadius = maxRadius * progress;
        
        // Outer dodge ring
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        ctx.setLineDash([8 * camera.zoom, 4 * camera.zoom]);
        ctx.lineDashOffset = progress * 20;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner bright flash
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Speed lines to show evasion
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([]);
        
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + (age * 0.01);
          const lineStart = currentRadius * 0.5;
          const lineEnd = currentRadius * 1.2;
          const startX = effectScreenPos.x + Math.cos(angle) * lineStart;
          const startY = effectScreenPos.y + Math.sin(angle) * lineStart;
          const endX = effectScreenPos.x + Math.cos(angle) * lineEnd;
          const endY = effectScreenPos.y + Math.sin(angle) * lineEnd;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        ctx.restore();
      } else if (e.kind === 'pickup') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        ctx.font = `${14 * camera.zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(e.text || '', effectScreenPos.x, effectScreenPos.y);
        ctx.restore();
      } else if (e.kind === 'impact') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, progress * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'whirlwind') {
        // Enhanced Whirlwind/Cyclone effect inspired by PoE
        const effectScreenPos = worldToScreen(playerPos.x, playerPos.y); // Use proper world to screen conversion
        const clampedPlayerPos = effectScreenPos; // Use the properly calculated screen position
        const currentTime = Date.now();
        const elapsed = currentTime - e.t;
        const spinSpeed = 0.008; // Faster spinning for more dynamic effect
        const rotation = elapsed * spinSpeed;
        
        ctx.save();
        
        // Base alpha that pulses slightly - increased for better visibility
        const baseAlpha = Math.max(0.7, 1 - progress);
        const pulseAlpha = baseAlpha + Math.sin(elapsed * 0.01) * 0.2;
        
        // Outer cyclone rings - multiple layers
        for (let layer = 0; layer < 4; layer++) {
          const layerProgress = (layer + 1) / 4;
          const radius = (30 + layer * 12) * camera.zoom;
          const layerRotation = rotation * (1 + layer * 0.3); // Different speeds per layer
          
          ctx.globalAlpha = pulseAlpha * (1 - layerProgress * 0.2);
          ctx.strokeStyle = layer === 0 ? '#FFFFFF' : '#F0F0F0'; // White colors for visibility
          ctx.lineWidth = (4 - layer) * camera.zoom;
          
          // Dashed spinning effect
          ctx.beginPath();
          ctx.setLineDash([15 * camera.zoom, 8 * camera.zoom]);
          ctx.lineDashOffset = layerRotation * 30;
          ctx.arc(clampedPlayerPos.x, clampedPlayerPos.y, radius, 0, Math.PI * 2);
           ctx.stroke();
         }
         
         // Inner energy core
         ctx.globalAlpha = pulseAlpha * 0.9;
         ctx.fillStyle = '#FFFFFF';
         ctx.beginPath();
         ctx.arc(clampedPlayerPos.x, clampedPlayerPos.y, 8 * camera.zoom, 0, Math.PI * 2);
         ctx.fill();
         
         // Spinning energy trails
         ctx.globalAlpha = pulseAlpha * 0.8;
         ctx.strokeStyle = '#FFFFFF';
         ctx.lineWidth = 2 * camera.zoom;
         
         for (let trail = 0; trail < 6; trail++) {
           const trailAngle = rotation * 2 + (trail * Math.PI / 3);
           const trailRadius = 25 * camera.zoom;
           const startX = clampedPlayerPos.x + Math.cos(trailAngle) * trailRadius;
           const startY = clampedPlayerPos.y + Math.sin(trailAngle) * trailRadius;
           const endX = clampedPlayerPos.x + Math.cos(trailAngle + 0.5) * (trailRadius + 15 * camera.zoom);
           const endY = clampedPlayerPos.y + Math.sin(trailAngle + 0.5) * (trailRadius + 15 * camera.zoom);
           
           ctx.beginPath();
           ctx.moveTo(startX, startY);
           ctx.lineTo(endX, endY);
           ctx.stroke();
         }
         
         // Particle sparks around the cyclone
         ctx.globalAlpha = pulseAlpha * 0.7;
         ctx.fillStyle = '#FFD54F';
         
         for (let spark = 0; spark < 8; spark++) {
           const sparkAngle = rotation * 3 + (spark * Math.PI / 4);
           const sparkDistance = (35 + Math.sin(elapsed * 0.005 + spark) * 10) * camera.zoom;
           const sparkX = clampedPlayerPos.x + Math.cos(sparkAngle) * sparkDistance;
           const sparkY = clampedPlayerPos.y + Math.sin(sparkAngle) * sparkDistance;
           const sparkSize = (2 + Math.sin(elapsed * 0.01 + spark) * 1) * camera.zoom;
          
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // AOE Damage Circle - shows the actual damage range
        ctx.globalAlpha = 0.3 + Math.sin(elapsed * 0.008) * 0.1; // Subtle pulsing
        ctx.strokeStyle = '#ff6b6b'; // Red color to indicate damage area
        ctx.lineWidth = 3 * camera.zoom;
        ctx.setLineDash([10 * camera.zoom, 5 * camera.zoom]); // Dashed circle
        ctx.lineDashOffset = elapsed * 0.01; // Animated dashes
        
        // Calculate the actual Whirlwind damage range (matching gameContext calculation)
        const whirlwindSkill = state.player.skillBar.slots.find((s: any) => s?.name === 'Whirlwind');
        if (whirlwindSkill) {
          const whirlwindArea = whirlwindSkill.scaling.baseArea! + (whirlwindSkill.level - 1) * whirlwindSkill.scaling.areaPerLevel!;
          const whirlwindRange = whirlwindArea * 30; // Convert area to pixel range
          const scaledRange = whirlwindRange * camera.zoom;
          
          ctx.beginPath();
          ctx.arc(clampedPlayerPos.x, clampedPlayerPos.y, scaledRange, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset line dash
        ctx.restore();
      } else if (e.kind === 'heal') {
        // Heal effect - green sparkles around player
        const playerScreenPos = worldToScreen(playerPos.x, playerPos.y);
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        
        // Draw sparkle effect
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 2;
          const radius = 30 * camera.zoom * (1 - progress * 0.5);
          const sparkleX = playerScreenPos.x + Math.cos(angle) * radius;
          const sparkleY = playerScreenPos.y + Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 3 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (e.kind === 'ice_shard') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create ice shard effect with crystalline appearance
        const radius = (e.size || 12) * camera.zoom;
        
        // Draw ice crystal
        ctx.fillStyle = e.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + (age * 0.002);
          const x = effectScreenPos.x + Math.cos(angle) * radius;
          const y = effectScreenPos.y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add frost particles
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI / 4) + (age * 0.005);
          const distance = radius * 1.5;
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          ctx.beginPath();
          ctx.arc(x, y, 2 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (e.kind === 'ground_slam') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create ground slam shockwave
        const radius = (e.size || 25) * progress * 2;
        
        // Outer shockwave ring
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 6 * camera.zoom;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner dust cloud
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock debris
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.fillStyle = e.color;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + (age * 0.003);
          const distance = radius * 0.8;
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          ctx.fillRect(x - 2, y - 2, 4 * camera.zoom, 4 * camera.zoom);
        }
        
        ctx.restore();
      } else if (e.kind === 'poison_arrow') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.7;
        
        // Create poison cloud effect
        const radius = (e.size || 20) * camera.zoom;
        
        // Poison cloud
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Toxic bubbles
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.fillStyle = '#40c057';
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI / 6) + (age * 0.004);
          const distance = radius * (0.5 + Math.sin(age * 0.01 + i) * 0.3);
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          const bubbleSize = (2 + Math.sin(age * 0.008 + i) * 1) * camera.zoom;
          ctx.beginPath();
          ctx.arc(x, y, bubbleSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (e.kind === 'chain_lightning') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.9;
        
        // Create chain lightning effect
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4 * camera.zoom;
        ctx.lineCap = 'round';
        
        // Draw multiple lightning chains
        for (let chain = 0; chain < 3; chain++) {
          const chainAngle = (chain * Math.PI * 2 / 3) + (age * 0.01);
          const chainLength = (e.size || 16) * camera.zoom;
          
          ctx.beginPath();
          ctx.moveTo(effectScreenPos.x, effectScreenPos.y);
          
          for (let i = 1; i <= 5; i++) {
            const segmentProgress = i / 5;
            const x = effectScreenPos.x + Math.cos(chainAngle) * chainLength * segmentProgress + (Math.random() - 0.5) * 15 * camera.zoom;
            const y = effectScreenPos.y + Math.sin(chainAngle) * chainLength * segmentProgress + (Math.random() - 0.5) * 15 * camera.zoom;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        
        // Central spark
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, 4 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'meteor') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create meteor impact effect
        const radius = (e.size || 35) * progress * 1.5;
        
        // Outer fire ring
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner molten core
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // White hot center
        ctx.globalAlpha = (1 - progress) * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Fire sparks
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.fillStyle = '#ff4400';
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI / 5) + (age * 0.005);
          const distance = radius * (1.2 + Math.sin(age * 0.01 + i) * 0.3);
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          const sparkSize = (3 + Math.sin(age * 0.008 + i) * 2) * camera.zoom;
          ctx.beginPath();
          ctx.arc(x, y, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      } else if (e.kind === 'blade_vortex') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create spinning blade effect
        const radius = (e.size || 22) * camera.zoom;
        const rotation = age * 0.02;
        
        // Draw spinning blades
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        ctx.lineCap = 'round';
        
        for (let blade = 0; blade < 4; blade++) {
          const bladeAngle = rotation + (blade * Math.PI / 2);
          const bladeLength = radius;
          
          const startX = effectScreenPos.x + Math.cos(bladeAngle) * (radius * 0.3);
          const startY = effectScreenPos.y + Math.sin(bladeAngle) * (radius * 0.3);
          const endX = effectScreenPos.x + Math.cos(bladeAngle) * bladeLength;
          const endY = effectScreenPos.y + Math.sin(bladeAngle) * bladeLength;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        // Central vortex
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, 4 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else if (e.kind === 'frost_nova') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create frost nova explosion
        const radius = (e.size || 28) * progress * 2;
        
        // Outer frost ring
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 5 * camera.zoom;
        ctx.setLineDash([8 * camera.zoom, 4 * camera.zoom]);
        ctx.lineDashOffset = age * 0.01;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ice burst
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#a5f3fc';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Ice shards
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.fillStyle = e.color;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI / 4) + (age * 0.003);
          const distance = radius * 0.8;
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          
          // Draw diamond-shaped ice shard
          ctx.beginPath();
          ctx.moveTo(x, y - 4 * camera.zoom);
          ctx.lineTo(x + 3 * camera.zoom, y);
          ctx.lineTo(x, y + 4 * camera.zoom);
          ctx.lineTo(x - 3 * camera.zoom, y);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.setLineDash([]);
        ctx.restore();
      } else if (e.kind === 'cleave') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.9;
        
        // Create cleave arc effect
        const radius = (e.size || 20) * camera.zoom;
        const arcAngle = Math.PI; // 180 degree arc
        
        // Draw cleave arc
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 6 * camera.zoom;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, -arcAngle / 2, arcAngle / 2);
        ctx.stroke();
        
        // Add slash lines
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.lineWidth = 3 * camera.zoom;
        for (let i = 0; i < 3; i++) {
          const lineAngle = -arcAngle / 2 + (i * arcAngle / 2);
          const startX = effectScreenPos.x + Math.cos(lineAngle) * (radius * 0.5);
          const startY = effectScreenPos.y + Math.sin(lineAngle) * (radius * 0.5);
          const endX = effectScreenPos.x + Math.cos(lineAngle) * radius;
          const endY = effectScreenPos.y + Math.sin(lineAngle) * radius;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        ctx.restore();
      } else if (e.kind === 'summon_skeletons') {
        ctx.save();
        const progress = Math.min(1, age / e.ttl);
        ctx.globalAlpha = (1 - progress) * 0.8;
        
        // Create summoning circle effect
        const radius = (e.size || 15) * camera.zoom;
        
        // Summoning circle
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        ctx.setLineDash([6 * camera.zoom, 3 * camera.zoom]);
        ctx.lineDashOffset = age * 0.01;
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner necromantic energy
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.arc(effectScreenPos.x, effectScreenPos.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bone fragments
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.fillStyle = '#f3f4f6';
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + (age * 0.004);
          const distance = radius * 0.7;
          const x = effectScreenPos.x + Math.cos(angle) * distance;
          const y = effectScreenPos.y + Math.sin(angle) * distance;
          
          // Draw small bone-like rectangles
          ctx.fillRect(x - 1, y - 3, 2 * camera.zoom, 6 * camera.zoom);
          ctx.fillRect(x - 3, y - 1, 6 * camera.zoom, 2 * camera.zoom);
        }
        
        ctx.setLineDash([]);
        ctx.restore();
      }
    });
  }, [state.enemies, enemyPositions, playerPos, projectiles, effects, dying, camera, idleAnimation, whirlwindState, worldToScreen])

  // Helper functions
  function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hp: number, max: number, alpha: number) {
    const pct = Math.max(0, Math.min(1, hp/max));
    ctx.fillStyle = `rgba(31,41,55,${alpha})`;
    ctx.fillRect(x-w/2, y-h/2, w, h);
    const grad = ctx.createLinearGradient(x-w/2, y, x+w/2, y);
    grad.addColorStop(0, '#16a34a');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x-w/2, y-h/2, w*pct, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(0,0,0,${0.6*alpha})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x-w/2, y-h/2, w, h);
  }

  function drawLabel(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, a: number) {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t, x, y);
  }

  // Call draw function with animation frame for smooth rendering
  useEffect(() => {
    let animationId: number
    const animate = () => {
      draw()
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [draw])

  return (
    <div className="game-canvas-container">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_W} 
        height={CANVAS_H} 
        className="game-canvas"
        tabIndex={0}
        style={{ outline: 'none' }}
        onClick={() => canvasRef.current?.focus()}
      />

    </div>
  )
})

export default GameCanvas
