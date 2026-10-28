import LibraryScene from './LibraryScene'

// 1 kişi · 5x5 · okuma köşesi: tek yazı masası, pencere önü bank, çay köşesi.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 101,
  windows: [
    { at: 2.3 },
  ],
  rug: { x: 1.1, z: 1.74, w: 3.1, d: 2.3 },
  shelves: [
    { from: 0.15, to: 4.05 },
  ],
  benches: [
    { at: 2.3, length: 1.4 },
  ],
  tables: [
    { x: 2.65, z: 3.04, length: 1.5, depth: 0.8, back: 1, front: 0 },
  ],
  props: [
    { type: 'plant', x: 4.5, z: 0.55 },
    { type: 'tea', x: 4.55, z: 2.2, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 2.1, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.9, y: 2.1 },
  ],
}

export default function LibraryRoom1(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
