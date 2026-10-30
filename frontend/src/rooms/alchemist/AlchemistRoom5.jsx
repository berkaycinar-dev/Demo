import AlchemistScene from './AlchemistScene'

// 5 kişi · 8.5x6.5 · 3 pencere masası, 1 çalışma masası; kemerli kapı, kitaplık, iksir dolabı, kazan, kristal küre.
const LAYOUT = {
  width: 8.5,
  depth: 6.5,
  seed: 7705,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3.27 },
    { type: 'potions', at: 5.42 },
  ],
  windows: [2.4, 3.9, 5.4],
  tables: [
    { x: 3.9, z: 3.6 },
  ],
  props: [
    { type: 'cauldron', x: 7.5, z: 1.05 },
    { type: 'crystal', x: 7.55, z: 3.6, facing: '-x' },
    { type: 'orrery', x: 7.85, z: 5.1 },
  ],
}

export default function AlchemistRoom5(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
