import LibraryScene from './LibraryScene'

// 6 kişi · 9x8 · uzun masa (3+3), kart kataloğu dolabı, iki saksı.
const LAYOUT = {
  width: 9,
  depth: 8,
  seed: 606,
  windows: [{ at: 1.95 }, { at: 4.6 }],
  rug: { x: 2.0, z: 2.1, w: 6.0, d: 3.9 },
  shelves: [{ from: 1.15, to: 8.05, ladders: [2.6] }],
  benches: [{ at: 1.95, length: 1.4 }],
  tables: [{ x: 5.0, z: 4.05, length: 3.6, depth: 1.2, back: 3, front: 3 }],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 8.5, z: 0.55 },
    { type: 'plant', x: 8.5, z: 4.6 },
    { type: 'catalog', x: 0.3, z: 6.6, facing: '+x' },
    { type: 'tea', x: 8.45, z: 7.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.6, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.27, y: 2.1 },
  ],
}

export default function LibraryRoom6(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
