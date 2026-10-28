import CabinScene from './CabinScene'

// 4 kişi · 7.5x6.5 · iki yanlı masa (2 sandalye + bank), kayaklar.
const LAYOUT = {
  width: 7.5,
  depth: 6.5,
  seed: 444,
  windows: [
    { wall: 'left', at: 3.2 },
  ],
  fireplace: { x: 3.75 },
  rugs: [
    { type: 'braided', x: 2.03, z: 3.02, w: 3.4, d: 2.6 },
    { type: 'fur', x: 3.75, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 3.2, length: 1.3 },
  ],
  tables: [
    { x: 3.73, z: 4.32, length: 2.4, depth: 1.1, back: 2, front: 2 },
  ],
  props: [
    { type: 'firewood', x: 2.1, z: 0.25 },
    { type: 'armchair', x: 2.05, z: 2, facing: 135, color: 'sage' },
    { type: 'armchair', x: 5.45, z: 2, facing: -135, color: 'rust' },
    { type: 'skis', x: 5.6, z: 0, facing: '+z' },
    { type: 'plant', x: 7.05, z: 0.45 },
    { type: 'cocoa', x: 7.05, z: 3.3, facing: '-x' },
    { type: 'guitar', x: 0, z: 5.95, facing: '+x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 1.55, y: 1.5, length: 1.2 },
    { type: 'sconce', wall: 'left', at: 1.95, y: 1.9 },
  ],
}

export default function CabinRoom4(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
