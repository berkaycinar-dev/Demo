import AlchemistScene from './AlchemistScene'

// 1 kişi · 6x5 · 1 pencere masası; kemerli kapı, kitaplık, kazan, kristal küre.
const LAYOUT = {
  width: 6,
  depth: 5,
  seed: 7701,
  wall: [
    { type: 'door', at: 1 },
    { type: 'books', at: 3 },
  ],
  windows: [2.5],
  props: [
    { type: 'cauldron', x: 5, z: 1.05 },
    { type: 'crystal', x: 5.05, z: 3.55, facing: '-x' },
  ],
}

export default function AlchemistRoom1(props) {
  return <AlchemistScene layout={LAYOUT} {...props} />
}
