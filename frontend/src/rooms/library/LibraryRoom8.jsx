import LibraryScene from './LibraryScene'

// 8 kişi · 11x9 · iki masa (2+2, 2+2), iki merdiven, büst, okuma koltuğu.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 808,
  windows: [{ at: 2.0 }, { at: 4.6 }, { at: 7.2 }],
  rug: { x: 1.9, z: 2.5, w: 7.8, d: 4.1 },
  shelves: [{ from: 1.15, to: 10.05, ladders: [2.7, 7.4] }],
  benches: [{ at: 2.0, length: 1.4 }],
  tables: [
    { x: 3.95, z: 4.55, length: 2.6, depth: 1.2, back: 2, front: 2 },
    { x: 7.65, z: 4.55, length: 2.6, depth: 1.2, back: 2, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 10.5, z: 0.55 },
    { type: 'bust', x: 10.4, z: 3.4 },
    { type: 'plant', x: 10.5, z: 6.0 },
    { type: 'armchair', x: 0.95, z: 7.2, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.9 },
    { type: 'tea', x: 10.45, z: 8.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 5.6, y: 3.05 },
    { type: 'painting', wall: 'left', at: 3.3, y: 1.85 },
    { type: 'clock', wall: 'left', at: 5.9, y: 2.25 },
  ],
}

export default function LibraryRoom8(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
