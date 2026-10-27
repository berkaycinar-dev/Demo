import CabinScene from './CabinScene'

// 3 kişi · 6.5x6 · üçlü masa, iki karlı pencere, duvar feneri.
const LAYOUT = {
  width: 6.5,
  depth: 6,
  seed: 333,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.4 },
  ],
  fireplace: { x: 3.9 },
  rugs: [
    { type: 'braided', x: 1.6, z: 2.8, w: 3.6, d: 2.2 },
    { type: 'fur', x: 3.9, z: 1.55, w: 1.6, d: 0.95 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [{ x: 3.4, z: 3.6, length: 3.0, depth: 0.85, back: 3 }],
  props: [
    { type: 'firewood', x: 2.2, z: 0.25 },
    { type: 'armchair', x: 5.6, z: 2.4, facing: -135, color: 'sage' },
    { type: 'plant', x: 6.05, z: 0.45 },
    { type: 'cocoa', x: 5.95, z: 5.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 5.4, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.3 },
    { type: 'sconce', wall: 'left', at: 3.15, y: 1.9 },
  ],
}

export default function CabinRoom3(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
