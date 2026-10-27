import LibraryScene from './LibraryScene'

// 4 kişi · 8x7 · iki yanlı uzun masa (2+2), dünya küresi, raf merdiveni.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 404,
  windows: [{ at: 1.95 }, { at: 4.6 }],
  rug: { x: 2.3, z: 2.0, w: 4.5, d: 3.5 },
  shelves: [{ from: 1.15, to: 7.05, ladders: [2.6] }],
  benches: [{ at: 1.95, length: 1.4 }],
  tables: [{ x: 4.55, z: 3.75, length: 3.0, depth: 1.2, back: 2, front: 2 }],
  props: [
    { type: 'globe', x: 0.6, z: 0.6 },
    { type: 'plant', x: 7.5, z: 0.55 },
    { type: 'tea', x: 7.45, z: 6.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 4.1, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.27, y: 2.1 },
  ],
  spots: [{ id: 'shelves', label: 'Kitap rafları', x: 6.4, z: 1.55 }],
}

export default function LibraryRoom4(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
