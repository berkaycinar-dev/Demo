import LibraryScene from './LibraryScene'

// 10 kişi · 12x10 · iki uzun masa (3+2, 3+2), büst, kitap arabası, katalog, okuma köşesi.
const LAYOUT = {
  width: 12,
  depth: 10,
  seed: 1010,
  windows: [{ at: 2.0 }, { at: 4.6 }, { at: 7.2 }],
  rug: { x: 1.8, z: 2.7, w: 9.2, d: 4.7 },
  shelves: [{ from: 1.15, to: 11.05, ladders: [2.8, 8.2] }],
  benches: [{ at: 2.0, length: 1.4 }],
  tables: [
    { x: 4.0, z: 5.0, length: 3.6, depth: 1.2, back: 3, front: 2 },
    { x: 8.6, z: 5.0, length: 3.6, depth: 1.2, back: 3, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 11.5, z: 0.55 },
    { type: 'bust', x: 11.4, z: 3.2 },
    { type: 'bookCart', x: 11.2, z: 6.6, facing: '-x' },
    { type: 'plant', x: 11.5, z: 8.0 },
    { type: 'armchair', x: 0.95, z: 7.2, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.9 },
    { type: 'catalog', x: 0.3, z: 9.0, facing: '+x' },
    { type: 'tea', x: 11.45, z: 9.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 6.1, y: 3.05 },
    { type: 'painting', wall: 'left', at: 3.3, y: 1.85 },
    { type: 'clock', wall: 'left', at: 5.9, y: 2.25 },
  ],
}

export default function LibraryRoom10(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
