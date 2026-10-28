import CabinScene from './CabinScene'

// 9 kişi · 11x8 · iki masa (3+2, 2+2), pencere dibinde kanepe.
const LAYOUT = {
  width: 11,
  depth: 8,
  seed: 999,
  windows: [
    { wall: 'left', at: 1.8 },
    { wall: 'left', at: 3.8 },
    { wall: 'back', at: 8.35 },
  ],
  fireplace: { x: 5.5 },
  rugs: [
    { type: 'braided', x: 1.68, z: 3.77, w: 7.6, d: 2.6 },
    { type: 'fur', x: 5.5, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 1.8, length: 1.3 },
  ],
  tables: [
    { x: 3.68, z: 5.07, length: 3, depth: 1.1, back: 3, front: 2 },
    { x: 7.58, z: 5.07, length: 2.4, depth: 1.1, back: 2, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 3.85, z: 0.25 },
    { type: 'armchair', x: 3.8, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 7.2, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 7.35, z: 0, facing: '+z' },
    { type: 'plant', x: 10.55, z: 0.45 },
    { type: 'cocoa', x: 10.55, z: 3.3, facing: '-x' },
    { type: 'sofa', x: 0.55, z: 5.9, facing: '+x' },
    { type: 'guitar', x: 0, z: 7.45, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 3.3, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 2.8, y: 1.9 },
  ],
}

export default function CabinRoom9(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
