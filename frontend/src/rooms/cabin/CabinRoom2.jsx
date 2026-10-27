import CabinScene from './CabinScene'

// 2 kişi · 6x5.5 · ikili masa, şömine yanında koltuk, gitar.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 222,
  windows: [{ wall: 'left', at: 2.3 }],
  fireplace: { x: 4.2 },
  rugs: [
    { type: 'braided', x: 1.1, z: 2.7, w: 3.3, d: 2.0 },
    { type: 'fur', x: 4.2, z: 1.55, w: 1.6, d: 0.95 },
  ],
  windowSeats: [{ at: 2.3, length: 1.3 }],
  tables: [{ x: 2.75, z: 3.5, length: 2.4, depth: 0.85, back: 2 }],
  props: [
    { type: 'firewood', x: 2.5, z: 0.25 },
    { type: 'armchair', x: 5.3, z: 2.6, facing: -135, color: 'rust' },
    { type: 'cocoa', x: 5.45, z: 4.8, facing: '-x' },
    { type: 'plant', x: 0.45, z: 5.0 },
    { type: 'guitar', x: 0, z: 4.0, facing: '+x' },
  ],
  decor: [{ type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.3 }],
}

export default function CabinRoom2(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
