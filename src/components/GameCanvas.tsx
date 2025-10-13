import React, { useRef, useEffect, useState } from 'react'
import { useGame } from '../systems/gameContext'

const CANVAS_W = 900, CANVAS_H = 500

function rarityColor(r) {
  if (!r) return '#ffffff'
  if (r === 'Common') return '#ffffff'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  return '#ffffff'
}

export default function GameCanvas() {
  const canvasRef = useRef(null)
  const { state, actions } = useGame()
  const [playerPos, setPlayerPos] = useState({ x:150, y: CANVAS_H/2 })
  const [enemyPositions, setEnemyPositions] = useState({})
  const [projectiles, setProjectiles] = useState([])
  const [effects, setEffects] = useState([])
  const [dying, setDying] = useState({})

  // init positions
  useEffect(() => {
    const map = {}
    state.enemies.forEach((e,i) => {
      map[e.id] = { x: CANVAS_W - 120 - i*28 + (Math.random()-0.5)*30, y: CANVAS_H/2 + (i%5 -2)*36 + (Math.random()-0.5)*20 }
    })
    setEnemyPositions(map)
    setProjectiles(p => p.slice(-120))
  }, [state.enemies.length])

  const clamp = (p) => ({ x: Math.max(30, Math.min(CANVAS_W-30, p.x)), y: Math.max(30, Math.min(CANVAS_H-30, p.y)) })
  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y)
  const moveTowards = (from,to,s) => { const dx = to.x-from.x, dy = to.y-from.y, d=Math.hypot(dx,dy)||1; return { x: from.x + dx/d*s, y: from.y + dy/d*s } }

  // spawn visuals by reading log markers (ANIM_PLAYER|enemyId|type|rarity|crit|damage)
  const lastLog = useRef('')
  useEffect(() => {
    if (!state.log || state.log.length===0) return
    const latest = state.log[0]
    if (latest === lastLog.current) return
    lastLog.current = latest
    if (latest.startsWith('ANIM_PLAYER|')) {
      const parts = latest.split('|')
      const id = parts[1], wtype = parts[2], wr = parts[3], critFlag = parts[4], dmg = Number(parts[5] || 0)
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
      // spawn damage number for player's hit
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
      // also push to effects - find target by parsing name if present later
    }
  }, [state.log, enemyPositions, playerPos])

  // main loop
  useEffect(() => {
    let raf = 0, last = performance.now()
    function frame(now) {
      const dt = Math.min(40, now - last); last = now
      // player movement towards nearest
      if (state.enemies.length > 0) {
        let nearest = null, nd=9999
        state.enemies.forEach(e => { const p = enemyPositions[e.id]; if (!p) return; const d=dist(playerPos,p); if (d<nd){nd=d; nearest={e,p}} })
        if (nearest) {
          const attackRange = (state.player.equipped?.type === 'ranged' ? 180 : 48)
          if (nd > attackRange) setPlayerPos(p => clamp(moveTowards(p, nearest.p, 1.1)))
          else setPlayerPos(p => ({ x: p.x + Math.sin(now/300)*0.2, y: p.y + Math.cos(now/300)*0.2 }))
        }
      }

      // enemy visual movement
      setEnemyPositions(prev => {
        const next = { ...prev }
        state.enemies.forEach((e, idx) => {
          const p = next[e.id] || { x: CANVAS_W - 120, y: CANVAS_H/2 }
          if (e.hp <= 0) {
            // mark dying start
            if (!e.alphaStart) e.alphaStart = Date.now()
            return
          }
          const range = e.type === 'ranged' ? 180 : 48
          const d = dist(p, playerPos)
          if ((e.type === 'ranged' || e.type === 'caster') && d < range * 0.95) {
            const dirx = p.x - playerPos.x, diry = p.y - playerPos.y, dd = Math.hypot(dirx,diry)||1
            next[e.id] = clamp({ x: p.x + dirx/dd * 0.6, y: p.y + diry/dd * 0.6 })
          } else if (d > range) {
            next[e.id] = clamp(moveTowards(p, playerPos, e.type === 'melee' ? 0.9 : 0.5))
          } else {
            next[e.id] = clamp({ x: p.x + Math.sin(now/300 + idx)*0.3, y: p.y + Math.cos(now/300 + idx)*0.3 })
          }
        })
        return next
      })

      // projectiles update and collision visuals
      setProjectiles(prev => {
        const next = prev.map(p => ({ ...p, px: p.x, py: p.y, x: p.x + p.vx, y: p.y + p.vy, life: p.life - dt })).filter(p => p.life > 0)
        next.forEach(p => {
          state.enemies.forEach(e => {
            const pos = enemyPositions[e.id]; if (!pos) return
            if (Math.hypot(p.x - pos.x, p.y - pos.y) < 18) {
              setEffects(s => [...s, { kind:'impact', x: p.x, y: p.y, t: Date.now(), ttl: 300, color: p.color }])
              p.life = -1
            }
          })
          // player hit detection
          if (Math.hypot(p.x - playerPos.x, p.y - playerPos.y) < 18) {
            setEffects(s => [...s, { kind:'impact', x: playerPos.x, y: playerPos.y, t: Date.now(), ttl: 300, color: p.color }])
            p.life = -1
          }
        })
        return next.slice(-200)
      })

      // cleanup effects
      setEffects(prev => prev.filter(e => Date.now() - e.t < (e.ttl || 600)).slice(-300))

      draw()
      raf = requestAnimationFrame(frame)
    }

    function draw() {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#071024';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // draw enemies
  state.enemies.forEach((e, i) => {
    const pos = enemyPositions[e.id] || { x: CANVAS_W - 120 - i * 28, y: CANVAS_H / 2 + i * 36 };
    const alpha = e.hp <= 0 ? Math.max(0, 1 - ((Date.now() - (e.alphaStart || Date.now())) / 1500)) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (e.type === 'melee') ctx.fillStyle = '#dc2626';
    else if (e.type === 'ranged') ctx.fillStyle = '#f97316';
    else ctx.fillStyle = '#a78bfa';

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.95 * alpha;
    if (e.type === 'melee') {
      ctx.beginPath();
      ctx.moveTo(pos.x - 8, pos.y - 18);
      ctx.lineTo(pos.x - 2, pos.y - 26);
      ctx.lineTo(pos.x + 4, pos.y - 18);
      ctx.fill();
    } else if (e.type === 'ranged') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 6, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 26, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawHpBar(ctx, pos.x, pos.y - 34, 56, 8, e.hp, e.maxHp, alpha);
    drawLabel(ctx, e.name, pos.x, pos.y - 46, alpha);
    ctx.restore();
  });

  // player
  ctx.fillStyle = '#000';
  ctx.fillRect(playerPos.x - 18, playerPos.y - 18, 36, 36);
  drawHpBar(ctx, playerPos.x, playerPos.y - 34, 90, 8, state.player.hp, state.player.maxHp, 1);
  drawLabel(
    ctx,
    `Lv ${state.player.level} • ${
      state.player.equipped
        ? state.player.equipped.name + ' (' + state.player.equipped.rarity + ')'
        : 'Unarmed'
    }`,
    playerPos.x,
    playerPos.y - 46,
    1
  );

  // projectiles
  projectiles.forEach((p) => {
    // trail line
    ctx.beginPath();
    ctx.lineWidth = p.size || 3;
    ctx.strokeStyle = p.color || '#fff';
    ctx.moveTo(p.px || p.x, p.py || p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // main projectile
    const radius = Math.max(0.5, Math.abs(p.radius ?? 3));
    if (Number.isFinite(radius)) {
      ctx.beginPath();
      ctx.fillStyle = p.color || '#fff';
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // glow effect
    if (p.glow) {
      const glowRadius = Math.max(0.5, Math.abs(p.radius ?? 3) * 3);
      if (Number.isFinite(glowRadius)) {
        ctx.beginPath();
        ctx.fillStyle = p.color || '#fff';
        ctx.globalAlpha = 0.12;
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  });

  // effects (damage numbers, impacts, slashes)
  effects.forEach((e) => {
    const age = Date.now() - e.t;
    const alpha = Math.max(0, 1 - age / (e.ttl || 1600));
    ctx.save();
    ctx.globalAlpha = alpha;

    if (e.kind === 'damage') {
      ctx.font = (e.size || 14) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = e.color || '#fff';
      ctx.fillText(e.text, e.x, e.y - age / 180);
    } else if (e.kind === 'impact') {
      const impactRadius = Math.max(0.5, Math.abs(6 * (1 - age / (e.ttl || 300))));
      if (Number.isFinite(impactRadius)) {
        ctx.beginPath();
        ctx.fillStyle = e.color || '#fff';
        ctx.arc(e.x, e.y, impactRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.kind === 'slash') {
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle || 0);
      ctx.strokeStyle = e.color || '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.quadraticCurveTo(0, -10, 18, -6);
      ctx.stroke();
    } else if (e.kind === 'pickup') {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = e.color || '#fff';
      ctx.fillText(e.text, e.x, e.y - age / 120);
    }

    ctx.restore();
  });

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Enemies: ' + state.enemies.length, 12, canvas.height - 36);
  ctx.fillText('Auto: ON', 12, canvas.height - 18);
}


    function drawHpBar(ctx,x,y,w,h,hp,max,alpha){ const pct = Math.max(0, Math.min(1, hp/max)); ctx.fillStyle = 'rgba(31,41,55,'+alpha+')'; ctx.fillRect(x-w/2,y-h/2,w,h); const grad = ctx.createLinearGradient(x-w/2,y,x+w/2,y); grad.addColorStop(0,'#16a34a'); grad.addColorStop(1,'#dc2626'); ctx.fillStyle = grad; ctx.globalAlpha = alpha; ctx.fillRect(x-w/2,y-h/2,w*pct,h); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(0,0,0,'+(0.6*alpha)+')'; ctx.lineWidth = 1; ctx.strokeRect(x-w/2,y-h/2,w,h) }
    function drawLabel(ctx,t,x,y,a){ ctx.fillStyle = 'rgba(255,255,255,'+a+')'; ctx.font = '12px sans-serif'; ctx.textAlign='center'; ctx.fillText(t,x,y) }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [enemyPositions, playerPos, projectiles, effects, state.enemies, state.log, state.skills])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Arena</h2>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ width: '100%', maxWidth: CANVAS_W }} />
      <div className="mt-3 small">Auto-spawn active — enemies spawn every ~2.2s (max 25)</div>
    </div>
  )
}
