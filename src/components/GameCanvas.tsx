import React, { useRef, useEffect, useState } from 'react'
import { useGame } from '../systems/gameContext'

const CANVAS_W = 1400, CANVAS_H = 700

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

function rarityColor(r: string | undefined): string {
  if (!r) return '#ffffff'
  if (r === 'Common') return '#ffffff'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  return '#ffffff'
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, actions } = useGame()
  const [playerPos, setPlayerPos] = useState<Position>({ x:150, y: CANVAS_H/2 })
  const [enemyPositions, setEnemyPositions] = useState<Record<string, Position>>({})
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [effects, setEffects] = useState<Effect[]>([])
  const [dying, setDying] = useState<Record<string, number>>({})
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })
  const [idleAnimation, setIdleAnimation] = useState<number>(0)
  const [whirlwindState, setWhirlwindState] = useState<{active: boolean, startTime: number, rotation: number}>({
    active: false, 
    startTime: 0, 
    rotation: 0
  })

  // Isometric transformation functions
  const worldToIso = (worldX: number, worldY: number): Position => {
    const isoX = (worldX - worldY) * 0.866 // cos(30°)
    const isoY = (worldX + worldY) * 0.5   // sin(30°)
    return { x: isoX, y: isoY }
  }

  const isoToScreen = (isoPos: Position): Position => {
    return {
      x: (isoPos.x - camera.x) * camera.zoom + CANVAS_W / 2,
      y: (isoPos.y - camera.y) * camera.zoom + CANVAS_H / 2
    }
  }

  const worldToScreen = (worldX: number, worldY: number): Position => {
    const iso = worldToIso(worldX, worldY)
    return isoToScreen(iso)
  }

  // Initialize enemy positions
  useEffect(() => {
    const map: Record<string, Position> = {}
    state.enemies.forEach((e,i) => {
      map[e.id] = { x: CANVAS_W - 120 - i*28 + (Math.random()-0.5)*30, y: CANVAS_H/2 + (i%5 -2)*36 + (Math.random()-0.5)*20 }
    })
    setEnemyPositions(map)
    // Sync positions with game state for distance checking
    actions.updateEnemyPositions(map)
    setProjectiles(p => p.slice(-120))
  }, [state.enemies.length])

  const clamp = (p: Position): Position => ({ x: Math.max(30, Math.min(CANVAS_W-30, p.x)), y: Math.max(30, Math.min(CANVAS_H-30, p.y)) })
  const clampEffect = (p: Position, radius: number = 50): Position => ({ 
    x: Math.max(radius, Math.min(CANVAS_W-radius, p.x)), 
    y: Math.max(radius, Math.min(CANVAS_H-radius, p.y)) 
  })
  const isWithinBounds = (p: Position, radius: number = 0): boolean => {
    return p.x >= radius && p.x <= CANVAS_W - radius && p.y >= radius && p.y <= CANVAS_H - radius
  }
  const dist = (a: Position, b: Position): number => Math.hypot(a.x-b.x, a.y-b.y)
  const moveTowards = (from: Position, to: Position, s: number): Position => {
    const dx = to.x-from.x, dy = to.y-from.y, d=Math.hypot(dx,dy)||1;
    return { x: from.x + dx/d*s, y: from.y + dy/d*s }
  }

  // spawn visuals by reading log markers (ANIM_PLAYER|enemyId|type|rarity|crit|damage)
  const lastLog = useRef('')
  useEffect(() => {
    if (!state.log || state.log.length===0) return
    const latest = state.log[0] // Read from beginning since logs are added with unshift()
    if (latest === lastLog.current) return
    lastLog.current = latest
    if (latest.startsWith('ANIM_PLAYER|')) {
      const parts = latest.split('|')
      const id = parts[1], wtype = parts[2], wr = parts[3], critFlag = parts[4], dmg = Math.floor(Number(parts[5] || 0))
      const pos = enemyPositions[id]; const color = rarityColor(wr)
      if (wtype === 'melee') {
        setEffects(s => [...s, { kind:'slash', x: pos?.x||300, y: pos?.y||200, t: Date.now(), ttl: 400, angle: Math.random()*Math.PI - Math.PI/2, color }])
      } else if (wtype === 'ranged') {
        if (pos) {
          const dirx = pos.x - playerPos.x, diry = pos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
          const speed = 3 * (state.player.projectileSpeed || 1) * (1 + (state.skills['arcane']||0)*0.1)
          setProjectiles(p => [...p, { x: playerPos.x, y: playerPos.y, vx: dirx/d*speed, vy: diry/d*speed, life: 800, color, radius:3, size:2 }])
        }
      } else if (wtype === 'magic') {
        if (pos) {
          const dirx = pos.x - playerPos.x, diry = pos.y - playerPos.y, d = Math.hypot(dirx,diry)||1
          const speed = 2 * (state.player.projectileSpeed || 1) * (1 + (state.skills['arcane']||0)*0.1)
          setProjectiles(p => [...p, { x: playerPos.x, y: playerPos.y, vx: dirx/d*speed, vy: diry/d*speed, life: 1200, color, radius:6, size:4, glow:true }])
        }
      }

      if (pos) {
        const text = (critFlag === 'crit') ? `-${dmg}!!!` : `-${dmg}`
        setEffects(s => [...s, { kind:'damage', x: pos.x + (Math.random()-0.5)*10, y: pos.y - 10 + (Math.random()-0.5)*6, t: Date.now(), ttl: 1600, text, crit: critFlag === 'crit', size: Math.min(28, 10 + Math.floor(dmg/2)), color: critFlag === 'crit' ? '#f59e0b' : '#ff6b6b' }])
      }
    }
    if (latest.startsWith('Enemy defeated! Loot:')) {
      const match = latest.match(/Loot: (.+)$/)
      if (match) setEffects(s => [...s, { kind:'pickup', x: 220, y: 60, t: Date.now(), ttl: 1200, text: match[1], color:'#fff' }])
    }
    
    // Handle dodge/miss feedback
    if (latest.includes('dodged')) {
      if (latest.includes('Player dodged')) {
        // Player dodged enemy attack
        setEffects(s => [...s, { 
          kind: 'dodge', 
          x: playerPos.x + (Math.random()-0.5)*20, 
          y: playerPos.y - 20 + (Math.random()-0.5)*10, 
          t: Date.now(), 
          ttl: 1200, 
          text: 'DODGE!', 
          color: '#22d3ee',
          size: 16
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
        setEffects(s => [...s, { 
          kind: 'explosion', 
          x: playerPos.x, 
          y: playerPos.y, 
          t: Date.now(), 
          ttl: 800,
          color: '#ff4400',
          size: 20
        }])
      } else if (skillType === 'lightning_bolt') {
        setEffects(s => [...s, { 
          kind: 'lightning', 
          x: playerPos.x, 
          y: playerPos.y, 
          t: Date.now(), 
          ttl: 600,
          color: '#00aaff',
          size: 15
        }])
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
      }
    }
  }, [state.log, enemyPositions, playerPos])

  // Collision detection function
  const checkCollision = (pos1: Position, pos2: Position, radius1: number, radius2: number): boolean => {
    const distance = dist(pos1, pos2)
    return distance < (radius1 + radius2)
  }

  // Main game loop
  useEffect(() => {
    let raf = 0, last = performance.now()
    function frame(now: number) {
      const dt = Math.min(40, now - last); last = now

      // Update idle animation
      setIdleAnimation(now / 1000)

      // Update Whirlwind rotation
      if (whirlwindState.active) {
        const elapsed = now - whirlwindState.startTime
        setWhirlwindState(prev => ({
          ...prev,
          rotation: elapsed * 0.01 // Fast spinning
        }))
      }

      // Move player towards nearest enemy or idle movement
      if (state.enemies.length > 0) {
        let nearestEnemy: any = null
        let nearestPos: Position | null = null
        let nd = 9999
        state.enemies.forEach(e => {
          const p = enemyPositions[e.id]
          if (!p) return;
          const d=dist(playerPos,p);
          if (d<nd){nd=d; nearestEnemy=e; nearestPos=p}
        })
        if (nearestEnemy && nearestPos) {
          const attackRange = (state.player.equipped?.type === 'ranged' ? 180 : 48)
          
          // Whirlwind movement - move towards enemies in a spinning pattern
          if (whirlwindState.active) {
            const whirlwindSpeed = 2.5 // Faster movement during Whirlwind
            const spiralRadius = 15 // Small spiral movement
            const spiralOffset = {
              x: Math.cos(whirlwindState.rotation * 3) * spiralRadius,
              y: Math.sin(whirlwindState.rotation * 3) * spiralRadius
            }
            
            const targetPos = {
              x: nearestPos.x + spiralOffset.x,
              y: nearestPos.y + spiralOffset.y
            }
            
            const newPos = clamp(moveTowards(playerPos, targetPos, whirlwindSpeed))
            
            // Enhanced collision detection with proper radii
            let canMove = true
            state.enemies.forEach(e => {
              const enemyPos = enemyPositions[e.id]
              if (enemyPos) {
                // Calculate enemy radius based on type and level
                let enemyRadius = 12
                if (e.type === 'melee') {
                  enemyRadius = 12 + e.level * 0.8
                } else if (e.type === 'ranged') {
                  enemyRadius = 10 + e.level * 0.6
                } else {
                  enemyRadius = 14 + e.level * 1.0
                }
                
                // Player radius is 16, add small buffer for smooth movement
                if (checkCollision(newPos, enemyPos, 18, enemyRadius + 2)) {
                  canMove = false
                }
              }
            })
            if (canMove) {
              setPlayerPos(newPos)
              actions.updatePlayerPosition(newPos)
            }
          } else if (nd > attackRange) {
            const newPos = clamp(moveTowards(playerPos, nearestPos, 1.1))
            // Enhanced collision detection with proper radii
            let canMove = true
            state.enemies.forEach(e => {
              const enemyPos = enemyPositions[e.id]
              if (enemyPos) {
                // Calculate enemy radius based on type and level
                let enemyRadius = 12
                if (e.type === 'melee') {
                  enemyRadius = 12 + e.level * 0.8
                } else if (e.type === 'ranged') {
                  enemyRadius = 10 + e.level * 0.6
                } else {
                  enemyRadius = 14 + e.level * 1.0
                }
                
                // Player radius is 16, add small buffer for smooth movement
                if (checkCollision(newPos, enemyPos, 18, enemyRadius + 2)) {
                  canMove = false
                }
              }
            })
            if (canMove) {
              setPlayerPos(newPos)
              actions.updatePlayerPosition(newPos)
            }
          } else {
            // Combat stance - slight movement while in range
            setPlayerPos(p => {
              const newPos = { x: p.x + Math.sin(now/300)*0.2, y: p.y + Math.cos(now/300)*0.2 }
              actions.updatePlayerPosition(newPos)
              return newPos
            })
          }
        }
      } else {
        // Idle movement animation when no enemies
        setPlayerPos(p => {
          const newPos = {
            x: p.x + Math.sin(now / 2000) * 0.5,
            y: p.y + Math.cos(now / 3000) * 0.3
          }
          actions.updatePlayerPosition(newPos)
          return newPos
        })
      }

      // Update camera to follow player
      const playerIso = worldToIso(playerPos.x, playerPos.y)
      setCamera(cam => ({
        x: cam.x + (playerIso.x - cam.x) * 0.1, // Smooth following
        y: cam.y + (playerIso.y - cam.y) * 0.1,
        zoom: cam.zoom
      }))

      // Move enemies towards player
      setEnemyPositions(prev => {
        const next = { ...prev }
        state.enemies.forEach((e, idx) => {
          const p = next[e.id] || { x: CANVAS_W - 120, y: CANVAS_H/2 }
          if (e.hp <= 0) {
            // Mark enemy as dying
            setDying(d => ({ ...d, [e.id]: d[e.id] || Date.now() }))
            return
          }
          // Move towards player
          const dx = playerPos.x - p.x, dy = playerPos.y - p.y, d = Math.hypot(dx,dy)||1
          const newPos = { x: p.x + dx/d*0.3, y: p.y + dy/d*0.3 }
          
          // Calculate current enemy radius
          let currentEnemyRadius = 12
          if (e.type === 'melee') {
            currentEnemyRadius = 12 + e.level * 0.8
          } else if (e.type === 'ranged') {
            currentEnemyRadius = 10 + e.level * 0.6
          } else {
            currentEnemyRadius = 14 + e.level * 1.0
          }
          
          // Check collision with player (player radius 16)
          if (!checkCollision(newPos, playerPos, currentEnemyRadius + 2, 18)) {
            // Check collision with other enemies
            let canMove = true
            state.enemies.forEach(otherE => {
              if (otherE.id !== e.id) {
                const otherPos = next[otherE.id]
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
                  
                  if (checkCollision(newPos, otherPos, currentEnemyRadius + 1, otherEnemyRadius + 1)) {
                    canMove = false
                  }
                }
              }
            })
            if (canMove) {
              next[e.id] = newPos
            }
          }
        })
        return next
      })

      // Update projectiles and check for impacts
      setProjectiles(prev => {
        const updated = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - dt }))
        
        // Check for projectile-enemy collisions
        const remaining = updated.filter(p => {
          if (p.life <= 0) return false
          
          // Check collision with enemies
          let hit = false
          state.enemies.forEach(e => {
            const enemyPos = enemyPositions[e.id]
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
                // Create impact effect
                setEffects(s => [...s, { 
                  kind: 'impact', 
                  x: p.x, 
                  y: p.y, 
                  t: Date.now(), 
                  ttl: 300, 
                  color: p.color,
                  size: p.size * 2
                }])
                hit = true
              }
            }
          })
          
          return !hit
        })
        
        return remaining
      })

      // Update effects
      setEffects(prev => prev.filter(e => (Date.now() - e.t) < e.ttl))

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [state.enemies, enemyPositions, playerPos])

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#071024';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // draw enemies
    state.enemies.forEach((e, i) => {
      const worldPos = enemyPositions[e.id] || { x: CANVAS_W - 120 - i * 28, y: CANVAS_H / 2 + i * 36 };
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
    
    ctx.fillStyle = whirlwindState.active ? '#ffffff' : '#000000'; // White during Whirlwind
    ctx.fillRect(
      playerScreenPos.x - playerSize/2, 
      playerScreenPos.y - playerSize/2 + animationOffset, 
      playerSize, 
      playerSize
    );
    
    ctx.restore();

    // Draw player HP bar
    drawHpBar(ctx, playerScreenPos.x, playerScreenPos.y - 35 * camera.zoom + animationOffset, 50 * camera.zoom, 8 * camera.zoom, state.player.hp, state.player.maxHp, 1);

    // Draw player level label
    drawLabel(ctx, `Lv.${state.player.level}`, playerScreenPos.x, playerScreenPos.y - 50 * camera.zoom + animationOffset, 1);

    // draw projectiles
    projectiles.forEach(p => {
      const projectileScreenPos = worldToScreen(p.x, p.y);
      ctx.save();
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 * camera.zoom;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(projectileScreenPos.x, projectileScreenPos.y, p.radius * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // draw effects
    effects.forEach(e => {
      const effectScreenPos = worldToScreen(e.x, e.y);
      const age = Date.now() - e.t;
      const progress = Math.min(1, age / e.ttl);

      if (e.kind === 'damage' || e.kind === 'player_damage' || e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        
        // Different font styles for different effect types
        if (e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block') {
          ctx.font = `bold ${(e.size || 16) * camera.zoom}px Arial`;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2 * camera.zoom;
        } else {
          ctx.font = `${(e.size || 16) * camera.zoom}px bold sans-serif`;
        }
        
        ctx.textAlign = 'center';
        const textY = effectScreenPos.y - progress * 20 * camera.zoom;
        
        // Add outline for better visibility on dodge/miss/block
        if (e.kind === 'dodge' || e.kind === 'miss' || e.kind === 'block') {
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
      } else if (e.kind === 'slash') {
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.9;
        
        const angle = e.angle || 0;
        const length = (e.size || 30) * camera.zoom;
        const thickness = 4 * camera.zoom * (1 - progress * 0.5);
        
        // Create animated slash that grows and fades
        const animProgress = Math.sin(progress * Math.PI);
        const currentLength = length * animProgress;
        
        const startX = effectScreenPos.x - Math.cos(angle) * currentLength / 2;
        const startY = effectScreenPos.y - Math.sin(angle) * currentLength / 2;
        const endX = effectScreenPos.x + Math.cos(angle) * currentLength / 2;
        const endY = effectScreenPos.y + Math.sin(angle) * currentLength / 2;
        
        // Draw main slash
        ctx.strokeStyle = e.color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Add bright inner slash
        ctx.globalAlpha = (1 - progress) * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = thickness * 0.4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Add sparks at the ends
        if (progress < 0.7) {
          ctx.globalAlpha = (1 - progress) * 0.8;
          ctx.fillStyle = e.color;
          
          // Spark at start
          ctx.beginPath();
          ctx.arc(startX, startY, 2 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
          
          // Spark at end
          ctx.beginPath();
          ctx.arc(endX, endY, 2 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        
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
        const effectScreenPos = { x: e.x, y: e.y }; // Effect coordinates are already in screen space
        const clampedPlayerPos = clampEffect(effectScreenPos, 80); // Ensure effect stays within bounds
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
      }
    });
  }

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

  // Call draw function
  useEffect(() => {
    draw();
  }, [enemyPositions, playerPos, projectiles, effects, state.enemies, dying])

  return (
    <div className="game-canvas-container">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_W} 
        height={CANVAS_H} 
        className="game-canvas" 
      />
    </div>
  )
}
