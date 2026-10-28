import LibraryScene from './LibraryScene'

// 3 kişi · 7x6 · üçlü okuma masası, okuma koltuğu ve ayaklı lamba.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 303,
  windows: [
    { at: 1.8 },
    { at: 3.7 },
  ],
  rug: { x: 1.05, z: 1.87, w: 5.2, d: 2.45 },
  shelves: [
    { from: 0.15, to: 6.05 },
  ],
  benches: [
    { at: 1.8, length: 1.4 },
  ],
  tables: [
    { x: 3.65, z: 3.24, length: 3.6, depth: 0.95, back: 3, front: 0 },
  ],
  props: [
    { type: 'plant', x: 6.5, z: 0.55 },
    { type: 'tea', x: 6.55, z: 2.2, facing: '-x' },
    { type: 'armchair', x: 0.95, z: 4.75, facing: '+x' },
    { type: 'floorLamp', x: 0.4, z: 5.6 },
  ],
  decor: [
    { type: 'sign', wall: 'back', at: 3.1, y: 3.05 },
    { type: 'clock', wall: 'left', at: 2.75, y: 2.1 },
  ],
}

export default function LibraryRoom3(props) {
  return <LibraryScene layout={LAYOUT} {...props} />
}
