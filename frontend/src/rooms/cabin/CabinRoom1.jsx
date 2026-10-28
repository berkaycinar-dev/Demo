import CabinScene from './CabinScene'

// 1 kişi · 5x5 · şömine başında tek masa, berjer, pencere önü oturma, kakao köşesi.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 111,
  windows: [
    { wall: 'left', at: 3.2 },
  ],
  fireplace: { x: 2.5 },
  rugs: [
    { type: 'braided', x: 1.28, z: 2.65, w: 2.4, d: 2 },
    { type: 'fur', x: 2.5, z: 1.55, w: 1.7, d: 1 },
  ],
  windowSeats: [
    { at: 3.2, length: 1.3 },
  ],
  tables: [
    { x: 2.48, z: 3.8, length: 1.4, depth: 0.8, back: 1, front: 0 },
  ],
  props: [
    { type: 'firewood', x: 0.85, z: 0.25 },
    { type: 'armchair', x: 4.2, z: 2, facing: -135, color: 'rust' },
    { type: 'plant', x: 4.55, z: 0.45 },
    { type: 'cocoa', x: 4.55, z: 3.3, facing: '-x' },
  ],
  decor: [
    { type: 'shelf', wall: 'back', at: 0.3, y: 1.5, length: 1.2 },
  ],
}

export default function CabinRoom1(props) {
  return <CabinScene layout={LAYOUT} {...props} />
}
