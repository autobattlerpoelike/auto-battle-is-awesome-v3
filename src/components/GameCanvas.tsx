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
    setProjectiles(p => p.slice(-120))
  }, [state.enemies.length])

  const clamp = (p: Position): Position => ({ x: Math.max(30, Math.min(CANVAS_W-30, p.x)), y: Math.max(30, Math.min(CANVAS_H-30, p.y)) })
  const dist = (a: Position, b: Position): number => Math.hypot(a.x-b.x, a.y-b.y)
  const moveTowards = (from: Position, to: Position, s: number): Position => {
    const dx = to.x-from.x, dy = to.y-from.y, d=Math.hypot(dx,dy)||1;
    return { x: from.x + dx/d*s, y: from.y + dy/d*s }
  }

  // spawn visuals by reading log markers (ANIM_PLAYER|enemyId|type|rarity|crit|damage)
  const lastLog = useRef('')
  useEffect(() => {
    if (!state.log || state.log.length===0) return
    const latest = state.log[state.log.length-1]
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
    if (latest.startsWith('🔥 Critical Hit!')) {
      // Add critical hit effect if needed
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
          if (nd > attackRange) {
            const newPos = clamp(moveTowards(playerPos, nearestPos, 1.1))
            // Check collision with all enemies before moving
            let canMove = true
            state.enemies.forEach(e => {
              const enemyPos = enemyPositions[e.id]
              if (enemyPos && checkCollision(newPos, enemyPos, 16, 20)) {
                canMove = false
              }
            })
            if (canMove) setPlayerPos(newPos)
          } else {
            setPlayerPos(p => ({ x: p.x + Math.sin(now/300)*0.2, y: p.y + Math.cos(now/300)*0.2 }))
          }
        }
      } else {
        // Idle movement animation when no enemies
        setPlayerPos(p => ({
          x: p.x + Math.sin(now / 2000) * 0.5,
          y: p.y + Math.cos(now / 3000) * 0.3
        }))
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
          
          // Check collision with player
          if (!checkCollision(newPos, playerPos, 20, 16)) {
            // Check collision with other enemies
            let canMove = true
            state.enemies.forEach(otherE => {
              if (otherE.id !== e.id) {
                const otherPos = next[otherE.id]
                if (otherPos && checkCollision(newPos, otherPos, 20, 20)) {
                  canMove = false
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

      // Update projectiles
      setProjectiles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - dt })).filter(p => p.life > 0))

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
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(
      playerScreenPos.x - playerSize/2, 
      playerScreenPos.y - playerSize/2 + animationOffset, 
      playerSize, 
      playerSize
    );

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

      if (e.kind === 'damage') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        ctx.font = `${(e.size || 16) * camera.zoom}px bold sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(e.text || '', effectScreenPos.x, effectScreenPos.y - progress * 20 * camera.zoom);
        ctx.restore();
      } else if (e.kind === 'slash') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * camera.zoom;
        ctx.translate(effectScreenPos.x, effectScreenPos.y);
        ctx.rotate(e.angle || 0);
        ctx.beginPath();
        ctx.moveTo(-15 * camera.zoom, 0);
        ctx.lineTo(15 * camera.zoom, 0);
        ctx.stroke();
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
