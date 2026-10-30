import AlchemistScene from './AlchemistScene'

// 6 kişi · 9x7 · 2 pencere masası, 2 çalışma masası; kemerli kapı, kitaplık, iksir dolabı, kazan, kristal küre.
const LAYOUT = {
  width: 9,
  depth: 7,
  seed: 7706,
  wall: [
    { type: 'door', at: 1 },
    { type: 'sconce', at: 2.18 },
    { type: 'books', at: 3.44 },
    { type: 'sconce', at: 4.69 },
    { type: 'potions', at: 5.75 },
    { type: 'sconce', at: 6.82 },
  ],
  windows: [2.4, 4],
  tables: [
    { x: 3.8, z: 3.4 },
    { x: 5.6, z: 5.1 },
  ],
  props: [
    { type: 'cauldron', x: 8, z: 1.05 },
    { type: 'crystal', x: 8.05, z: 3.6, facing: '-x' },
    { type: 'orrery', x: 8.35, z: 5.1 },
  ],
}

export default function AlchemistRoom6(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
