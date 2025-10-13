import React from 'react'
import { useGame } from '../systems/gameContext'

function rarityColor(r) {
  if (!r) return '#9ca3af'
  if (r === 'Common') return '#9ca3af'
  if (r === 'Magic') return '#06b6d4'
  if (r === 'Rare') return '#8b5cf6'
  if (r === 'Unique') return '#fbbf24'
  return '#9ca3af'
}

export default function InventoryPanel() {
  const { state, actions } = useGame()

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Inventory</h2>
      <div className="mt-2 small">Gold: {Math.floor(state.player.gold)}</div>
      <div className="mt-2">
        <div className="small">Equipped</div>
        <div className="mt-1" style={{borderLeft: '4px solid '+ (state.player.equipped ? rarityColor(state.player.equipped.rarity) : '#374151'), paddingLeft:8}}>
          {state.player.equipped ? (
            <div>
              <div>{state.player.equipped.name} <span className="small">({state.player.equipped.rarity})</span></div>
              <div className="small">Power: {state.player.equipped.power}</div>
            </div>
          ) : 'None'}
        </div>
      </div>

      <div className="mt-2">
        <div className="small">Items</div>
        <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
          {state.inventory.length === 0 && <div className="small">No items yet.</div>}
          {state.inventory.slice().sort((a,b)=> (['Unique','Rare','Magic','Common'].indexOf(a.rarity) - ['Unique','Rare','Magic','Common'].indexOf(b.rarity)) || (b.power - a.power)).map((it) => (
            <div key={it.id} className="flex justify-between items-center p-2 rounded" style={{background:'#0f172a', border: '1px solid rgba(255,255,255,0.03)'}}>
              <div>
                <div style={{color: rarityColor(it.rarity), fontWeight:700}}>{it.name}</div>
                <div className="small">Power: +{it.power} {it.type ? '• ' + it.type : ''}</div>
                {it.extras && it.extras.length>0 && <div className="small">Extras: {it.extras.map(e=> e.key+':'+e.val).join(', ')}</div>}
              </div>
              <div className="flex gap-2">
                <button className="button" onClick={() => actions.equipItem(it.id)}>Equip</button>
                <button className="button" onClick={() => actions.discardItem(it.id)}>Discard</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
)
}
