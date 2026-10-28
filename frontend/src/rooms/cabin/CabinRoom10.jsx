import CabinScene from './CabinScene'

// 10 kişi · 12x8.5 · iki masa (3+2, 3+2), pencere dibinde kanepe.
const LAYOUT = {
  width: 12,
  depth: 8.5,
  seed: 1110,
  windows: [
    { wall: 'left', at: 1.8 },
    { wall: 'left', at: 3.8 },
    { wall: 'back', at: 8.85 },
  ],
  fireplace: { x: 6 },
  rugs: [
    { type: 'braided', x: 1.88, z: 4.02, w: 8.2, d: 2.6 },
    { type: 'fur', x: 6, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 1.8, length: 1.3 },
  ],
  tables: [
    { x: 3.88, z: 5.32, length: 3, depth: 1.1, back: 3, front: 2 },
    { x: 8.08, z: 5.32, length: 3, depth: 1.1, back: 3, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 4.35, z: 0.25 },
    { type: 'armchair', x: 4.3, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 7.7, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 7.85, z: 0, facing: '+z' },
    { type: 'plant', x: 11.55, z: 0.45 },
    { type: 'cocoa', x: 11.55, z: 3.3, facing: '-x' },
    { type: 'sofa', x: 0.55, z: 6.4, facing: '+x' },
    { type: 'guitar', x: 0, z: 7.95, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 3.8, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 2.8, y: 1.9 },
  ],
}

export default function CabinRoom10(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
