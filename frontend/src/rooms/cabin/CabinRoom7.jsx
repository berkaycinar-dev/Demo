import CabinScene from './CabinScene'

// 7 kişi · 9.5x7.5 · uzun masa (4 + bankta 3), pencere dibinde kanepe.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 777,
  windows: [
    { wall: 'left', at: 1.8 },
    { wall: 'left', at: 3.8 },
    { wall: 'back', at: 7.6 },
  ],
  fireplace: { x: 4.75 },
  rugs: [
    { type: 'braided', x: 2.28, z: 3.52, w: 4.9, d: 2.6 },
    { type: 'fur', x: 4.75, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 1.8, length: 1.3 },
  ],
  tables: [
    { x: 4.73, z: 4.82, length: 3.9, depth: 1.1, back: 4, front: 3 },
  ],
  props: [
    { type: 'firewood', x: 3.1, z: 0.25 },
    { type: 'armchair', x: 3.05, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.45, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 6.6, z: 0, facing: '+z' },
    { type: 'plant', x: 9.05, z: 0.45 },
    { type: 'cocoa', x: 9.05, z: 3.3, facing: '-x' },
    { type: 'sofa', x: 0.55, z: 5.4, facing: '+x' },
    { type: 'guitar', x: 0, z: 6.95, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 2.55, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 2.8, y: 1.9 },
  ],
}

export default function CabinRoom7(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
