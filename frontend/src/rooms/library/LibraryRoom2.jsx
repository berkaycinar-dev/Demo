import LibraryScene from './LibraryScene'

// 2 kişi · 6x5.5 · ikili okuma masası, duvar saati.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 202,
  windows: [
    { at: 2.4 },
  ],
  rug: { x: 1.05, z: 1.92, w: 4.2, d: 2.45 },
  shelves: [
    { from: 0.15, to: 5.05 },
  ],
  benches: [
    { at: 2.4, length: 1.4 },
  ],
  tables: [
    { x: 3.15, z: 3.29, length: 2.6, depth: 0.95, back: 2, front: 0 },
  ],
  props: [
    { type: 'plant', x: 5.5, z: 0.55 },
    { type: 'tea', x: 5.55, z: 2.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 2.6, y: 3.05 },
    { type: 'clock', wall: 'left', at: 4, y: 2.1 },
  ],
}

export default function LibraryRoom2(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
