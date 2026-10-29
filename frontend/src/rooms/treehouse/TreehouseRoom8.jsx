import TreehouseScene from './TreehouseScene'

// 8 kişi · 10x8 · 2 pencere masası, 2 kütük masa, minder köşesi; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 9308,
  trunk: { x: 9, z: 0.85 },
  hammock: { x: 6.25, length: 2.3 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.65 },
    { type: 'cocoa', at: 4.63 },
  ],
  windows: [2.5, 4.1],
  tables: [
    { x: 3.9, z: 3.4 },
    { x: 5.8, z: 5.2 },
  ],
  nook: { x: 8.3, z: 6 },
  props: [
    { type: 'telescope', x: 9.25, z: 3.4, facing: '-x' },
  ],
}

export default function TreehouseRoom8(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
