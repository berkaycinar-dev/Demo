import LibraryScene from './LibraryScene'

// 6 kişi · 9x8 · uzun masa (3+3), kart kataloğu.
const LAYOUT = {
  width: 9,
  depth: 8,
  seed: 606,
  windows: [
    { at: 1.95 },
    { at: 4.6 },
  ],
  rug: { x: 2.05, z: 2.48, w: 5.2, d: 3 },
  shelves: [
    { from: 1.15, to: 7.05, ladders: [2.15] },
  ],
  benches: [
    { at: 1.95, length: 1.4 },
  ],
  tables: [
    { x: 4.65, z: 3.98, length: 3.6, depth: 1.2, back: 3, front: 3 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 8.5, z: 0.55 },
    { type: 'catalog', x: 7.55, z: 0.25 },
    { type: 'tea', x: 8.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 6.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 7.6 },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.1, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.27, y: 2.1 },
  ],
}

export default function LibraryRoom6(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
