import CabinScene from './CabinScene'

// 10 kişi · 12x9.5 · iki uzun masa (3+2, 3+2), kanepe, iki raf, askılık, kayaklar.
const LAYOUT = {
  width: 12,
  depth: 9.5,
  seed: 1111,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.5 },
    { wall: 'left', at: 7.1 },
    { wall: 'back', at: 9.0 },
  ],
  fireplace: { x: 5.7 },
  rugs: [
    { type: 'braided', x: 1.7, z: 3.3, w: 8.8, d: 3.5 },
    { type: 'fur', x: 5.7, z: 1.55, w: 1.8, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [
    { x: 3.75, z: 4.8, length: 3.4, depth: 1.1, back: 3, front: 2 },
    { x: 8.25, z: 4.8, length: 3.4, depth: 1.1, back: 3, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 4.0, z: 0.25 },
    { type: 'armchair', x: 3.65, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 7.75, z: 2.0, facing: -135, color: 'rust' },
    { type: 'sofa', x: 0.55, z: 6.4, facing: '+x' },
    { type: 'plant', x: 11.55, z: 0.45 },
    { type: 'plant', x: 11.5, z: 4.8 },
    { type: 'cocoa', x: 11.45, z: 8.7, facing: '-x' },
    { type: 'coatRack', x: 11.4, z: 6.9 },
    { type: 'skis', x: 9.75, z: 0, facing: '+z' },
    { type: 'guitar', x: 0, z: 8.6, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 2.2 },
    { type: 'shelf', wall: 'back', at: 10.3, y: 1.5, length: 1.0 },
    { type: 'sconce', wall: 'left', at: 3.2, y: 1.9 },
    { type: 'sconce', wall: 'left', at: 5.8, y: 1.9 },
  ],
}

export default function CabinRoom10(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
