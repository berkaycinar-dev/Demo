import CabinScene from './CabinScene'

// 7 kişi · 9.5x8 · uzun masa (3 + 3) + tekli masa, üç pencere, pencere dibinde kanepe.
const LAYOUT = {
  width: 9.5,
  depth: 8,
  seed: 777,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.5 },
    { wall: 'left', at: 7.0 },
    { wall: 'back', at: 8.0 },
  ],
  fireplace: { x: 4.7 },
  rugs: [
    { type: 'braided', x: 2.2, z: 3.0, w: 4.8, d: 3.2 },
    { type: 'fur', x: 4.7, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [
    { x: 4.6, z: 4.3, length: 3.6, depth: 1.1, back: 3, front: 3 },
    { x: 8.25, z: 3.9, length: 1.3, depth: 0.7, back: 1 },
  ],
  props: [
    { type: 'firewood', x: 3.0, z: 0.25 },
    { type: 'armchair', x: 2.65, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.75, z: 2.0, facing: -135, color: 'rust' },
    { type: 'sofa', x: 0.55, z: 5.75, facing: '+x' },
    { type: 'plant', x: 9.05, z: 0.45 },
    { type: 'cocoa', x: 8.95, z: 7.2, facing: '-x' },
    { type: 'skis', x: 6.85, z: 0, facing: '+z' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.6 },
    { type: 'sconce', wall: 'left', at: 3.2, y: 1.9 },
    { type: 'sconce', wall: 'left', at: 5.75, y: 1.9 },
  ],
}

export default function CabinRoom7(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
