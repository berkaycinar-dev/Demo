import LibraryScene from './LibraryScene'

// 2 kişi · 6x5.5 · ikili okuma masası (yan yana), duvar saati.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 202,
  windows: [{ at: 2.4 }],
  rug: { x: 1.5, z: 1.7, w: 3.7, d: 2.6 },
  shelves: [{ from: 0.15, to: 4.95 }],
  benches: [{ at: 2.4, length: 1.4 }],
  tables: [{ x: 3.35, z: 3.0, length: 2.6, depth: 0.9, back: 2 }],
  props: [
    { type: 'plant', x: 5.5, z: 0.55 },
    { type: 'tea', x: 5.45, z: 4.8, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 2.55, y: 3.05 },
    { type: 'clock', wall: 'left', at: 4.3, y: 2.1 },
  ],
}

export default function LibraryRoom2(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
