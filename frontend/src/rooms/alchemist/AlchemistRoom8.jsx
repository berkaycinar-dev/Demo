import AlchemistScene from './AlchemistScene'

// 8 kişi · 10x8 · 2 pencere masası, 2 çalışma masası, okuma köşesi; kemerli kapı, kitaplık, iksir dolabı, simya tezgâhı, kazan, kristal küre.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 7708,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3.06 },
    { type: 'potions', at: 5 },
    { type: 'bench', at: 6.94 },
  ],
  windows: [2.4, 4],
  tables: [
    { x: 3.9, z: 3.5 },
    { x: 5.9, z: 5.3 },
  ],
  corner: { x: 8.3, z: 6.1 },
  props: [
    { type: 'cauldron', x: 9, z: 1.05 },
    { type: 'crystal', x: 9.05, z: 3.6, facing: '-x' },
  ],
}

export default function AlchemistRoom8(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
