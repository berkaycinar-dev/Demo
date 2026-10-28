import LibraryScene from './LibraryScene'

// 9 kişi · 12x8.5 · iki masa (3+2, 2+2), büst nişi, el yazması vitrini.
const LAYOUT = {
  width: 12,
  depth: 8.5,
  seed: 909,
  windows: [
    { at: 1.8 },
    { at: 3.9 },
    { at: 6 },
  ],
  rug: { x: 1.6, z: 2.72, w: 9.1, d: 3 },
  shelves: [
    { from: 1.15, to: 5.7, ladders: [2.15] },
    { from: 6.6, to: 10.05, ladders: [7.6] },
  ],
  benches: [
    { at: 1.8, length: 1.4 },
  ],
  tables: [
    { x: 4.2, z: 4.22, length: 3.6, depth: 1.2, back: 3, front: 2 },
    { x: 8.6, z: 4.22, length: 2.6, depth: 1.2, back: 2, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 11.5, z: 0.55 },
    { type: 'catalog', x: 10.55, z: 0.25 },
    { type: 'bust', x: 6.15, z: 0.3 },
    { type: 'tea', x: 11.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 7.25, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 8.1 },
    { type: 'sideTable', x: 0.45, z: 6.4 },
    { type: 'vitrine', x: 10.3, z: 7.3, facing: '-z' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 6.15, y: 3.05 },
    { type: 'clock', wall: 'left', at: 2.85, y: 2.1 },
    { type: 'painting', wall: 'left', at: 4.95, y: 1.85 },
  ],
}

export default function LibraryRoom9(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
