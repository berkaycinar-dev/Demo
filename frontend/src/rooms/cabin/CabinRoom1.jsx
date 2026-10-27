import CabinScene from './CabinScene'

// 1 kişi · 5x5 · şömine başında tek masa, pencere önü oturma, kayaklar.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 111,
  windows: [{ wall: 'left', at: 2.2 }],
  fireplace: { x: 3.4 },
  rugs: [
    { type: 'braided', x: 1.0, z: 2.4, w: 2.2, d: 1.8 },
    { type: 'fur', x: 3.4, z: 1.55, w: 1.5, d: 0.9 },
  ],
  windowSeats: [{ at: 2.2, length: 1.3 }],
  tables: [{ x: 2.05, z: 3.15, length: 1.4, depth: 0.75, back: 1 }],
  props: [
    { type: 'firewood', x: 1.7, z: 0.25 },
    { type: 'armchair', x: 4.4, z: 2.55, facing: -135, color: 'sage' },
    { type: 'cocoa', x: 4.45, z: 4.35, facing: '-x' },
    { type: 'plant', x: 0.45, z: 4.55 },
    { type: 'skis', x: 0, z: 3.7, facing: '+x' },
  ],
  decor: [{ type: 'shelf', wall: 'back', at: 0.25, y: 1.5, length: 1.0 }],
}

export default function CabinRoom1(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
