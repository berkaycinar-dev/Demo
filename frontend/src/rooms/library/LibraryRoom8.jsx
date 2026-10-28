import LibraryScene from './LibraryScene'

// 8 kişi · 11x8.5 · iki masa (2+2, 2+2), büst nişi, iki merdiven, el yazması vitrini.
const LAYOUT = {
  width: 11,
  depth: 8.5,
  seed: 808,
  windows: [
    { at: 1.8 },
    { at: 3.9 },
    { at: 6 },
  ],
  rug: { x: 1.6, z: 2.72, w: 8.1, d: 3 },
  shelves: [
    { from: 1.15, to: 5.2, ladders: [2.15] },
    { from: 6.1, to: 9.05, ladders: [7.1] },
  ],
  benches: [
    { at: 1.8, length: 1.4 },
  ],
  tables: [
    { x: 3.7, z: 4.22, length: 2.6, depth: 1.2, back: 2, front: 2 },
    { x: 7.6, z: 4.22, length: 2.6, depth: 1.2, back: 2, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 10.5, z: 0.55 },
    { type: 'catalog', x: 9.55, z: 0.25 },
    { type: 'bust', x: 5.65, z: 0.3 },
    { type: 'tea', x: 10.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 7.25, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 8.1 },
    { type: 'sideTable', x: 0.45, z: 6.4 },
    { type: 'vitrine', x: 9.3, z: 7.3, facing: '-z' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 5.65, y: 3.05 },
    { type: 'clock', wall: 'left', at: 2.85, y: 2.1 },
    { type: 'painting', wall: 'left', at: 4.95, y: 1.85 },
  ],
}

export default function LibraryRoom8(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
