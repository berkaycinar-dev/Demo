import CabinScene from './CabinScene'

// 2 kişi · 6x5.5 · ikili masa, gitar.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 222,
  windows: [
    { wall: 'left', at: 3.2 },
  ],
  fireplace: { x: 3 },
  rugs: [
    { type: 'braided', x: 1.28, z: 2.9, w: 3.4, d: 2 },
    { type: 'fur', x: 3, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 3.2, length: 1.3 },
  ],
  tables: [
    { x: 2.98, z: 4.05, length: 2.4, depth: 0.8, back: 2, front: 0 },
  ],
  props: [
    { type: 'firewood', x: 1.35, z: 0.25 },
    { type: 'armchair', x: 4.7, z: 2, facing: -135, color: 'rust' },
    { type: 'plant', x: 5.55, z: 0.45 },
    { type: 'cocoa', x: 5.55, z: 3.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 4.95, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.8, y: 1.5, length: 1.2 },
  ],
}

export default function CabinRoom2(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
