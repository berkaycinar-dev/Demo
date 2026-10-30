import AlchemistScene from './AlchemistScene'

// 4 kişi · 8x6 · 2 pencere masası, 1 çalışma masası; kemerli kapı, kitaplık, iksir dolabı, kazan, kristal küre.
const LAYOUT = {
  width: 8,
  depth: 6,
  seed: 7704,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3.1 },
    { type: 'potions', at: 5.09 },
  ],
  windows: [2.4, 3.9],
  tables: [
    { x: 3.7, z: 3.5 },
  ],
  props: [
    { type: 'cauldron', x: 7, z: 1.05 },
    { type: 'crystal', x: 7.05, z: 3.6, facing: '-x' },
    { type: 'orrery', x: 7.35, z: 5.1 },
  ],
}

export default function AlchemistRoom4(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
