import LibraryScene from './LibraryScene'

// 5 kişi · 9x7 · uzun masa (3+2), küre, merdiven, pencere dibinde okuma koltuğu.
const LAYOUT = {
  width: 9,
  depth: 7,
  seed: 505,
  windows: [{ at: 1.95 }, { at: 4.6 }],
  rug: { x: 2.2, z: 2.0, w: 5.6, d: 3.5 },
  shelves: [{ from: 1.15, to: 8.05, ladders: [3.0] }],
  benches: [{ at: 1.95, length: 1.4 }],
  tables: [{ x: 5.0, z: 3.75, length: 3.6, depth: 1.2, back: 3, front: 2 }],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 8.5, z: 0.55 },
    { type: 'armchair', x: 0.95, z: 6.15, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.35 },
    { type: 'tea', x: 8.45, z: 6.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.6, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.27, y: 2.1 },
  ],
}

export default function LibraryRoom5(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
