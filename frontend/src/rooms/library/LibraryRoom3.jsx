import LibraryScene from './LibraryScene'

// 3 kişi · 7x6 · üçlü okuma masası, iki pencere, okuma koltuğu + ayaklı lamba.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 303,
  windows: [{ at: 1.9 }, { at: 4.4 }],
  rug: { x: 1.9, z: 1.8, w: 4.3, d: 2.7 },
  shelves: [{ from: 0.15, to: 5.95 }],
  benches: [{ at: 1.9, length: 1.4 }],
  tables: [{ x: 4.05, z: 3.15, length: 3.4, depth: 0.95, back: 3 }],
  props: [
    { type: 'plant', x: 6.5, z: 0.55 },
    { type: 'armchair', x: 0.95, z: 4.4, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.4 },
    { type: 'tea', x: 6.45, z: 5.3, facing: '-x' },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 3.05, y: 3.05 },
    { type: 'clock', wall: 'left', at: 3.15, y: 2.1 },
  ],
}

export default function LibraryRoom3(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
