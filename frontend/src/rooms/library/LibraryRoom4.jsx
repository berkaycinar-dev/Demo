import LibraryScene from './LibraryScene'

// 4 kişi · 8x7 · iki yanlı masa (2+2), dünya küresi, raf merdiveni.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 404,
  windows: [
    { at: 1.95 },
    { at: 4.4 },
  ],
  rug: { x: 2.05, z: 1.98, w: 4.2, d: 3 },
  shelves: [
    { from: 1.15, to: 7.05, ladders: [2.15] },
  ],
  benches: [
    { at: 1.95, length: 1.4 },
  ],
  tables: [
    { x: 4.15, z: 3.48, length: 2.6, depth: 1.2, back: 2, front: 2 },
  ],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 7.5, z: 0.55 },
    { type: 'tea', x: 7.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 5.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 6.6 },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.1, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.18, y: 2.1 },
  ],
}

export default function LibraryRoom4(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
