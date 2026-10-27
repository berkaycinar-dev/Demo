import CabinScene from './CabinScene'

// 4 kişi · 7.5x6.5 · iki yanlı masa (2 sandalye + bank), kayaklar.
const LAYOUT = {
  width: 7.5,
  depth: 6.5,
  seed: 444,
  windows: [
    { wall: 'left', at: 1.9 },
    { wall: 'left', at: 4.5 },
  ],
  fireplace: { x: 4.3 },
  rugs: [
    { type: 'braided', x: 1.7, z: 2.7, w: 4.0, d: 2.9 },
    { type: 'fur', x: 4.3, z: 1.55, w: 1.7, d: 1.0 },
  ],
  windowSeats: [{ at: 1.9, length: 1.3 }],
  tables: [{ x: 3.7, z: 3.95, length: 2.8, depth: 1.1, back: 2, front: 2 }],
  props: [
    { type: 'firewood', x: 2.6, z: 0.25 },
    { type: 'armchair', x: 6.3, z: 2.3, facing: -135, color: 'mustard' },
    { type: 'plant', x: 7.05, z: 0.45 },
    { type: 'cocoa', x: 6.95, z: 5.7, facing: '-x' },
    { type: 'skis', x: 0, z: 5.7, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.5 },
    { type: 'sconce', wall: 'left', at: 3.2, y: 1.9 },
  ],
}

export default function CabinRoom4(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
