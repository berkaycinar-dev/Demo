import LibraryScene from './LibraryScene'

// 7 kişi · 10x8 · uzun masa (4+3), tablo, okuma köşesinde yan sehpa.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 707,
  windows: [
    { at: 1.95 },
    { at: 4.6 },
  ],
  rug: { x: 2.15, z: 2.48, w: 6, d: 3 },
  shelves: [
    { from: 1.15, to: 8.05, ladders: [2.15] },
  ],
  benches: [
    { at: 1.95, length: 1.4 },
  ],
  tables: [
    { x: 5.15, z: 3.98, length: 4.4, depth: 1.2, back: 4, front: 3 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 9.5, z: 0.55 },
    { type: 'catalog', x: 8.55, z: 0.25 },
    { type: 'tea', x: 9.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 6.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 7.6 },
    { type: 'sideTable', x: 0.45, z: 5.9 },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.6, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.27, y: 2.1 },
    { type: 'painting', wall: 'left', at: 6.1, y: 1.85 },
  ],
}

export default function LibraryRoom7(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
