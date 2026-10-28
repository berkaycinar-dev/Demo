import LibraryScene from './LibraryScene'

// 10 kişi · 12x9 · iki masa (3+2, 3+2), büst nişi, el yazması vitrini.
const LAYOUT = {
  width: 12,
  depth: 9,
  seed: 1010,
  windows: [
    { at: 1.9 },
    { at: 4.2 },
    { at: 6.5 },
  ],
  rug: { x: 1.1, z: 2.97, w: 10.1, d: 3 },
  shelves: [
    { from: 1.15, to: 5.7, ladders: [2.15] },
    { from: 6.6, to: 10.05, ladders: [7.6] },
  ],
  benches: [
    { at: 1.9, length: 1.4 },
  ],
  tables: [
    { x: 3.7, z: 4.47, length: 3.6, depth: 1.2, back: 3, front: 2 },
    { x: 8.6, z: 4.47, length: 3.6, depth: 1.2, back: 3, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 11.5, z: 0.55 },
    { type: 'catalog', x: 10.55, z: 0.25 },
    { type: 'bust', x: 6.15, z: 0.3 },
    { type: 'tea', x: 11.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 7.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 8.6 },
    { type: 'sideTable', x: 0.45, z: 6.9 },
    { type: 'vitrine', x: 10.3, z: 7.8, facing: '-z' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 6.15, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.05, y: 2.1 },
    { type: 'painting', wall: 'left', at: 5.35, y: 1.85 },
  ],
}

export default function LibraryRoom10(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
