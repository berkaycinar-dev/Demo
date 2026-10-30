import AlchemistScene from './AlchemistScene'

// 9 kişi · 10.5x8.5 · 3 pencere masası, 2 çalışma masası, okuma köşesi; kemerli kapı, kitaplık, iksir dolabı, simya tezgâhı, kazan, kristal küre.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 7709,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3.19 },
    { type: 'potions', at: 5.25 },
    { type: 'bench', at: 7.32 },
  ],
  windows: [2.4, 3.9, 5.4],
  tables: [
    { x: 4, z: 3.5 },
    { x: 6.1, z: 5.4 },
  ],
  corner: { x: 8.8, z: 6.4 },
  props: [
    { type: 'cauldron', x: 9.5, z: 1.05 },
    { type: 'crystal', x: 9.55, z: 3.6, facing: '-x' },
  ],
}

export default function AlchemistRoom9(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
