import CabinScene from './CabinScene'

// 5 kişi · 8x7 · masa (3 + bankta 2), iki pencere.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 555,
  windows: [
    { wall: 'left', at: 2 },
    { wall: 'left', at: 4.6 },
  ],
  fireplace: { x: 4 },
  rugs: [
    { type: 'braided', x: 1.98, z: 3.27, w: 4, d: 2.6 },
    { type: 'fur', x: 4, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 2, length: 1.3 },
  ],
  tables: [
    { x: 3.98, z: 4.57, length: 3, depth: 1.1, back: 3, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 2.35, z: 0.25 },
    { type: 'armchair', x: 2.3, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 5.7, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 5.85, z: 0, facing: '+z' },
    { type: 'plant', x: 7.55, z: 0.45 },
    { type: 'cocoa', x: 7.55, z: 3.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 6.45, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 1.8, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 3.3, y: 1.9 },
  ],
}

export default function CabinRoom5(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
