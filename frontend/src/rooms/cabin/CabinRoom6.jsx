import CabinScene from './CabinScene'

// 6 kişi · 9x7.5 · masa (3 + bankta 3), arka duvarda pencere.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 666,
  windows: [
    { wall: 'left', at: 2 },
    { wall: 'left', at: 4.6 },
    { wall: 'back', at: 7.35 },
  ],
  fireplace: { x: 4.5 },
  rugs: [
    { type: 'braided', x: 2.48, z: 3.52, w: 4, d: 2.6 },
    { type: 'fur', x: 4.5, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 2, length: 1.3 },
  ],
  tables: [
    { x: 4.48, z: 4.82, length: 3, depth: 1.1, back: 3, front: 3 },
  ],
  props: [
    { type: 'firewood', x: 2.85, z: 0.25 },
    { type: 'armchair', x: 2.8, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.2, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 6.35, z: 0, facing: '+z' },
    { type: 'plant', x: 8.55, z: 0.45 },
    { type: 'cocoa', x: 8.55, z: 3.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 6.95, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 2.3, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 3.3, y: 1.9 },
  ],
}

export default function CabinRoom6(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
