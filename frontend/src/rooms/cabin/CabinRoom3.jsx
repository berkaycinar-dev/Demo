import CabinScene from './CabinScene'

// 3 kişi · 7x6 · üçlü masa, şöminenin iki yanında berjer, duvar feneri.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 333,
  windows: [
    { wall: 'left', at: 3.2 },
  ],
  fireplace: { x: 3.5 },
  rugs: [
    { type: 'braided', x: 1.48, z: 3.15, w: 4, d: 2 },
    { type: 'fur', x: 3.5, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 3.2, length: 1.3 },
  ],
  tables: [
    { x: 3.48, z: 4.3, length: 3, depth: 0.8, back: 3, front: 0 },
  ],
  props: [
    { type: 'firewood', x: 1.85, z: 0.25 },
    { type: 'armchair', x: 1.8, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 5.2, z: 2, facing: -135, color: 'rust' },
    { type: 'plant', x: 6.55, z: 0.45 },
    { type: 'cocoa', x: 6.55, z: 3.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 5.45, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 1.3, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 1.95, y: 1.9 },
  ],
}

export default function CabinRoom3(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
