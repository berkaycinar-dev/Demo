import LibraryScene from './LibraryScene'

// 5 kişi · 9x7 · uzun masa (3+2), küre, merdiven, okuma köşesi.
const LAYOUT = {
  width: 9,
  depth: 7,
  seed: 505,
  windows: [
    { at: 1.95 },
    { at: 4.4 },
  ],
  rug: { x: 2.05, z: 1.98, w: 5.2, d: 3 },
  shelves: [
    { from: 1.15, to: 8.05, ladders: [2.15] },
  ],
  benches: [
    { at: 1.95, length: 1.4 },
  ],
  tables: [
    { x: 4.65, z: 3.48, length: 3.6, depth: 1.2, back: 3, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 8.5, z: 0.55 },
    { type: 'tea', x: 8.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 5.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 6.6 },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.6, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.18, y: 2.1 },
  ],
}

export default function LibraryRoom5(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
