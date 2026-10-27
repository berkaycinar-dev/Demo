import CabinScene from './CabinScene'

// 8 kişi · 10.5x8.5 · iki masa (2+2, 2+2), kanepe, askılık, gitar.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 888,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.5 },
    { wall: 'left', at: 7.1 },
    { wall: 'back', at: 8.9 },
  ],
  fireplace: { x: 5.2 },
  rugs: [
    { type: 'braided', x: 1.8, z: 3.1, w: 7.2, d: 3.2 },
    { type: 'fur', x: 5.2, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [
    { x: 3.5, z: 4.45, length: 2.6, depth: 1.1, back: 2, front: 2 },
    { x: 7.3, z: 4.45, length: 2.6, depth: 1.1, back: 2, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 3.5, z: 0.25 },
    { type: 'armchair', x: 3.15, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 7.25, z: 2.0, facing: -135, color: 'rust' },
    { type: 'sofa', x: 0.55, z: 6.1, facing: '+x' },
    { type: 'plant', x: 10.05, z: 0.45 },
    { type: 'cocoa', x: 9.95, z: 7.7, facing: '-x' },
    { type: 'coatRack', x: 9.9, z: 5.9 },
    { type: 'skis', x: 7.95, z: 0, facing: '+z' },
    { type: 'guitar', x: 0, z: 8.0, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.8 },
    { type: 'sconce', wall: 'left', at: 3.2, y: 1.9 },
    { type: 'sconce', wall: 'left', at: 5.8, y: 1.9 },
  ],
}

export default function CabinRoom8(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
