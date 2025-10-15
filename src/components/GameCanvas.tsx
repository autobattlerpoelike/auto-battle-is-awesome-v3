import React, { useRef, useEffect, useState } from 'react'
import { useGame } from '../systems/gameContext'

const CANVAS_W = 1400, CANVAS_H = 700

interface Position {
  x: number
  y: number
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

  // Main game loop
  useEffect(() => {
    let raf = 0, last = performance.now()
    function frame(now: number) {
      const dt = Math.min(40, now - last); last = now

      // Move player towards nearest enemy
      if (state.enemies.length > 0) {
        let nearest: {e: any, p: Position} | null = null, nd=9999
        state.enemies.forEach(e => {
          const p = enemyPositions[e.id]
          if (!p) return;
          const d=dist(playerPos,p);
          if (d<nd){nd=d; nearest={e,p}}
        })
        if (nearest) {
          const attackRange = (state.player.equipped?.type === 'ranged' ? 180 : 48)
          if (nd > attackRange) setPlayerPos(p => clamp(moveTowards(p, nearest!.p, 1.1)))
          else setPlayerPos(p => ({ x: p.x + Math.sin(now/300)*0.2, y: p.y + Math.cos(now/300)*0.2 }))
        }
      }

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
          next[e.id] = { x: p.x + dx/d*0.3, y: p.y + dy/d*0.3 }
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
      const pos = enemyPositions[e.id] || { x: CANVAS_W - 120 - i * 28, y: CANVAS_H / 2 + i * 36 };
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
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw enemy type indicators
      ctx.fillStyle = '#ffffff';
      if (e.type === 'melee') {
        ctx.beginPath();
        ctx.moveTo(pos.x - 8, pos.y - 18);
        ctx.lineTo(pos.x - 2, pos.y - 26);
        ctx.lineTo(pos.x + 4, pos.y - 18);
        ctx.fill();
      } else if (e.type === 'ranged') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 6, 6, Math.PI * 0.2, Math.PI * 0.8);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw HP bar
      drawHpBar(ctx, pos.x, pos.y - radius - 15, 40, 6, e.hp, e.maxHp, alpha);

      // Draw level label
      drawLabel(ctx, `Lv.${e.level}`, pos.x, pos.y - radius - 25, alpha);

      ctx.restore();
    });

    // draw player
    ctx.fillStyle = '#000000';
    ctx.fillRect(playerPos.x - 16, playerPos.y - 16, 32, 32);

    // Draw player HP bar
    drawHpBar(ctx, playerPos.x, playerPos.y - 35, 50, 8, state.player.hp, state.player.maxHp, 1);

    // Draw player level label
    drawLabel(ctx, `Lv.${state.player.level}`, playerPos.x, playerPos.y - 50, 1);

    // draw projectiles
    projectiles.forEach(p => {
      ctx.save();
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // draw effects
    effects.forEach(e => {
      const age = Date.now() - e.t;
      const progress = Math.min(1, age / e.ttl);

      if (e.kind === 'damage') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        ctx.font = `${e.size || 16}px bold sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(e.text || '', e.x, e.y - progress * 20);
        ctx.restore();
      } else if (e.kind === 'slash') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle || 0);
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'pickup') {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = e.color;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.text || '', e.x, e.y);
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
