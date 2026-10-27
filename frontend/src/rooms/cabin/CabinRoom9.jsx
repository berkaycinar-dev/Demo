import CabinScene from './CabinScene'

// 9 kişi · 11x9 · iki masa (3+2, 2+2), iki köknar, askılık.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 999,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.5 },
    { wall: 'left', at: 7.1 },
    { wall: 'back', at: 8.7 },
  ],
  fireplace: { x: 5.4 },
  rugs: [
    { type: 'braided', x: 1.7, z: 3.2, w: 7.8, d: 3.3 },
    { type: 'fur', x: 5.4, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [
    { x: 3.65, z: 4.6, length: 3.4, depth: 1.1, back: 3, front: 2 },
    { x: 7.95, z: 4.6, length: 2.6, depth: 1.1, back: 2, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 3.7, z: 0.25 },
    { type: 'armchair', x: 3.35, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 7.45, z: 2.0, facing: -135, color: 'rust' },
    { type: 'sofa', x: 0.55, z: 6.3, facing: '+x' },
    { type: 'plant', x: 10.55, z: 0.45 },
    { type: 'plant', x: 10.5, z: 4.6 },
    { type: 'cocoa', x: 10.45, z: 8.2, facing: '-x' },
    { type: 'coatRack', x: 10.4, z: 6.6 },
    { type: 'skis', x: 9.45, z: 0, facing: '+z' },
    { type: 'guitar', x: 0, z: 8.3, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 2.0 },
    { type: 'sconce', wall: 'left', at: 3.2, y: 1.9 },
    { type: 'sconce', wall: 'left', at: 5.8, y: 1.9 },
  ],
}

export default function CabinRoom9(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
