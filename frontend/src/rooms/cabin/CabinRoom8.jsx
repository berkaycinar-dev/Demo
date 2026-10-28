import CabinScene from './CabinScene'

// 8 kişi · 10.5x8 · iki masa (2+2, 2+2), pencere dibinde kanepe.
const LAYOUT = {
  width: 10.5,
  depth: 8,
  seed: 888,
  windows: [
    { wall: 'left', at: 1.8 },
    { wall: 'left', at: 3.8 },
    { wall: 'back', at: 8.1 },
  ],
  fireplace: { x: 5.25 },
  rugs: [
    { type: 'braided', x: 1.73, z: 3.77, w: 7, d: 2.6 },
    { type: 'fur', x: 5.25, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 1.8, length: 1.3 },
  ],
  tables: [
    { x: 3.43, z: 5.07, length: 2.4, depth: 1.1, back: 2, front: 2 },
    { x: 7.03, z: 5.07, length: 2.4, depth: 1.1, back: 2, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 3.6, z: 0.25 },
    { type: 'armchair', x: 3.55, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.95, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 7.1, z: 0, facing: '+z' },
    { type: 'plant', x: 10.05, z: 0.45 },
    { type: 'cocoa', x: 10.05, z: 3.3, facing: '-x' },
    { type: 'sofa', x: 0.55, z: 5.9, facing: '+x' },
    { type: 'guitar', x: 0, z: 7.45, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 3.05, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 2.8, y: 1.9 },
  ],
}

export default function CabinRoom8(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
