import LibraryScene from './LibraryScene'

// 1 kişi · 5x5 · okuma köşesi: tek yazı masası, pencere önü bank, çay köşesi.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 101,
  windows: [{ at: 2.3 }],
  rug: { x: 1.3, z: 1.6, w: 2.7, d: 2.4 },
  shelves: [{ from: 0.15, to: 3.95 }],
  benches: [{ at: 2.3, length: 1.4 }],
  tables: [{ x: 2.65, z: 2.8, length: 1.5, depth: 0.8, back: 1 }],
  props: [
    { type: 'plant', x: 4.5, z: 0.55 },
    { type: 'tea', x: 4.45, z: 4.3, facing: '-x' },
  ],
  decor: [{ type: 'sign', wall: 'back', at: 2.05, y: 3.05 }],
}

export default function LibraryRoom1(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
