import CabinScene from './CabinScene'

// 6 kişi · 9x7.5 · masa (3 + bankta 3), arka duvarda pencere, gitar ve kayaklar.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 666,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.6 },
    { wall: 'back', at: 7.4 },
  ],
  fireplace: { x: 4.6 },
  rugs: [
    { type: 'braided', x: 1.9, z: 2.9, w: 5.0, d: 3.2 },
    { type: 'fur', x: 4.6, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [{ x: 4.4, z: 4.25, length: 3.6, depth: 1.1, back: 3, front: 3 }],
  props: [
    { type: 'firewood', x: 2.9, z: 0.25 },
    { type: 'armchair', x: 2.55, z: 2.0, facing: 135, color: 'sage' },
    { type: 'armchair', x: 6.65, z: 2.0, facing: -135, color: 'rust' },
    { type: 'plant', x: 8.55, z: 0.45 },
    { type: 'cocoa', x: 8.45, z: 6.7, facing: '-x' },
    { type: 'guitar', x: 0, z: 5.6, facing: '+x' },
    { type: 'skis', x: 0, z: 6.6, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.5 },
    { type: 'sconce', wall: 'left', at: 3.25, y: 1.9 },
  ],
}

export default function CabinRoom6(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
