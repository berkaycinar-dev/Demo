import CabinScene from './CabinScene'

// 5 kişi · 8x7 · masa (3 + bankta 2), şöminenin iki yanında koltuk.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 555,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.6 },
  ],
  fireplace: { x: 4.6 },
  rugs: [
    { type: 'braided', x: 1.8, z: 2.8, w: 4.6, d: 3.0 },
    { type: 'fur', x: 4.6, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [{ x: 4.1, z: 4.05, length: 3.4, depth: 1.1, back: 3, front: 2 }],
  props: [
    { type: 'firewood', x: 2.9, z: 0.25 },
    { type: 'armchair', x: 2.55, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.65, z: 2.0, facing: -135, color: 'rust' },
    { type: 'plant', x: 7.55, z: 0.45 },
    { type: 'cocoa', x: 7.45, z: 6.2, facing: '-x' },
    { type: 'guitar', x: 0, z: 6.2, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.5 },
    { type: 'sconce', wall: 'left', at: 3.25, y: 1.9 },
  ],
}

export default function CabinRoom5(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
