const rarities = ['Common','Magic','Rare','Unique']

function chooseRarity() {
  const r = Math.random()
  if (r > 0.995) return 'Unique'
  if (r > 0.92) return 'Rare'
  if (r > 0.6) return 'Magic'
  return 'Common'
}

function makeExtras(rarity) {
  const extras = []
  if (rarity === 'Common') return extras
  if (rarity === 'Magic') {
    extras.push({key:'hp', val: 10 + Math.floor(Math.random()*10)})
  }
  if (rarity === 'Rare') {
    extras.push({key:'hp', val: 15 + Math.floor(Math.random()*20)})
    extras.push({key:'dps', val: 1 + Math.floor(Math.random()*3)})
  }
  if (rarity === 'Unique') {
    extras.push({key:'hp', val: 30 + Math.floor(Math.random()*40)})
    extras.push({key:'dps', val: 3 + Math.floor(Math.random()*5)})
    extras.push({key:'projectileSpeed', val: 0.5 + Math.random()*1.5})
  }
  return extras
}

export function generateLoot(level:number) {
  const rarity = chooseRarity()
  const type = Math.random() > 0.6 ? 'ranged' : 'melee'
  const powerBase = Math.max(1, Math.floor(level * (1 + Math.random()*1.6)))
  const multiplier = rarity === 'Common' ? 1 : rarity === 'Magic' ? 1.3 : rarity === 'Rare' ? 1.8 : 2.5
  const power = Math.max(1, Math.floor(powerBase * multiplier))
  const name = type === 'ranged' ? `${rarity} Bow (L${level})` : `${rarity} Sword (L${level})`
  const extras = makeExtras(rarity)
  return {
    id: 'it' + Math.floor(Math.random()*1000000),
    name,
    rarity,
    power,
    type,
    extras,
    value: Math.max(1, Math.floor(level * power * (multiplier/1.5)))
  }
}
