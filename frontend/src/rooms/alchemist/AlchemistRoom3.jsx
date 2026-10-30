import AlchemistScene from './AlchemistScene'

// 3 kişi · 7.5x6 · 1 pencere masası, 1 çalışma masası; kemerli kapı, kitaplık, iksir dolabı, kazan, kristal küre.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 7703,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 2.94 },
    { type: 'potions', at: 4.75 },
  ],
  windows: [2.5],
  tables: [
    { x: 3.4, z: 3.4 },
  ],
  props: [
    { type: 'cauldron', x: 6.5, z: 1.05 },
    { type: 'crystal', x: 6.55, z: 3.6, facing: '-x' },
    { type: 'orrery', x: 6.85, z: 5.1 },
  ],
}

export default function AlchemistRoom3(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
