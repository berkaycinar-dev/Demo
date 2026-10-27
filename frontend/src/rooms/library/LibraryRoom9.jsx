import LibraryScene from './LibraryScene'

// 9 kişi · 12x9 · iki masa (3+2, 2+2), kart kataloğu, okuma koltuğu.
const LAYOUT = {
  width: 12,
  depth: 9,
  seed: 909,
  windows: [{ at: 2.0 }, { at: 4.6 }, { at: 7.2 }],
  rug: { x: 1.8, z: 2.5, w: 8.9, d: 4.1 },
  shelves: [{ from: 1.15, to: 11.05, ladders: [2.8, 8.2] }],
  benches: [{ at: 2.0, length: 1.4 }],
  tables: [
    { x: 4.0, z: 4.55, length: 3.6, depth: 1.2, back: 3, front: 2 },
    { x: 8.45, z: 4.55, length: 2.6, depth: 1.2, back: 2, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 11.5, z: 0.55 },
    { type: 'catalog', x: 11.5, z: 4.5, facing: '-x' },
    { type: 'plant', x: 11.5, z: 6.4 },
    { type: 'armchair', x: 0.95, z: 7.2, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.9 },
    { type: 'tea', x: 11.45, z: 8.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 6.1, y: 3.05 },
    { type: 'painting', wall: 'left', at: 3.3, y: 1.85 },
    { type: 'clock', wall: 'left', at: 5.9, y: 2.25 },
  ],
}

export default function LibraryRoom9(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
