import AlchemistScene from './AlchemistScene'

// 7 kişi · 9.5x7.5 · 3 pencere masası, 2 çalışma masası; kemerli kapı, kitaplık, iksir dolabı, simya tezgâhı, kazan, kristal küre.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 7707,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 2.94 },
    { type: 'potions', at: 4.75 },
    { type: 'bench', at: 6.57 },
  ],
  windows: [2.4, 3.9, 5.4],
  tables: [
    { x: 3.9, z: 3.5 },
    { x: 5.8, z: 5.2 },
  ],
  props: [
    { type: 'cauldron', x: 8.5, z: 1.05 },
    { type: 'crystal', x: 8.55, z: 3.6, facing: '-x' },
    { type: 'orrery', x: 8.85, z: 5.1 },
  ],
}

export default function AlchemistRoom7(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
