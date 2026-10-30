import AlchemistScene from './AlchemistScene'

// 10 kişi · 11x9 · 4 pencere masası, 2 çalışma masası, okuma köşesi; kemerli kapı, kitaplık, iksir dolabı, simya tezgâhı, kazan, kristal küre.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 7710,
  wall: [
    { type: 'door', at: 1 },
    { type: 'sconce', at: 2.12 },
    { type: 'books', at: 3.31 },
    { type: 'sconce', at: 4.5 },
    { type: 'potions', at: 5.5 },
    { type: 'sconce', at: 6.5 },
    { type: 'bench', at: 7.69 },
    { type: 'sconce', at: 8.88 },
  ],
  windows: [2.4, 3.9, 5.4, 6.9],
  tables: [
    { x: 4.1, z: 3.6 },
    { x: 6.2, z: 5.6 },
  ],
  corner: { x: 9.2, z: 6.6 },
  props: [
    { type: 'cauldron', x: 10, z: 1.05 },
    { type: 'crystal', x: 10.05, z: 3.6, facing: '-x' },
  ],
}

export default function AlchemistRoom10(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
