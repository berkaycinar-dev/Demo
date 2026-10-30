import AlchemistScene from './AlchemistScene'

// 2 kişi · 6.5x5.5 · 2 pencere masası; kemerli kapı, kitaplık, kazan, kristal küre.
const LAYOUT = {
  width: 6.5,
  depth: 5.5,
  seed: 7702,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3.25 },
  ],
  windows: [2.4, 3.9],
  props: [
    { type: 'cauldron', x: 5.5, z: 1.05 },
    { type: 'crystal', x: 5.55, z: 3.6, facing: '-x' },
  ],
}

export default function AlchemistRoom2(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
