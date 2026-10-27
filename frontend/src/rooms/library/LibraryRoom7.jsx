import LibraryScene from './LibraryScene'

// 7 kişi · 10x8 · uzun masa (3+3) + tekli çalışma masası, üç pencere, tablo.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 707,
  windows: [{ at: 1.95 }, { at: 4.4 }, { at: 6.85 }],
  rug: { x: 1.9, z: 2.1, w: 5.5, d: 3.9 },
  shelves: [{ from: 1.15, to: 9.05, ladders: [3.1] }],
  benches: [{ at: 1.95, length: 1.4 }],
  tables: [
    { x: 4.65, z: 4.05, length: 3.6, depth: 1.2, back: 3, front: 3 },
    { x: 8.5, z: 3.4, length: 1.5, depth: 0.8, back: 1 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 9.5, z: 0.55 },
    { type: 'armchair', x: 0.95, z: 6.85, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.65 },
    { type: 'tea', x: 9.45, z: 7.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 5.1, y: 3.05 },
    { type: 'painting', wall: 'left', at: 3.17, y: 1.85 },
    { type: 'clock', wall: 'left', at: 5.62, y: 2.25 },
  ],
}

export default function LibraryRoom7(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
