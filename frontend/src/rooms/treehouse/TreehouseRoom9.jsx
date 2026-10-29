import TreehouseScene from './TreehouseScene'

// 9 kişi · 10.5x8.5 · 3 pencere masası, 2 kütük masa, minder köşesi; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 9309,
  trunk: { x: 9.5, z: 0.85 },
  hammock: { x: 6.75, length: 2.3 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.82 },
    { type: 'cocoa', at: 4.96 },
  ],
  windows: [2.5, 4, 5.5],
  tables: [
    { x: 4, z: 3.4 },
    { x: 6, z: 5.2 },
  ],
  nook: { x: 8.7, z: 6.4 },
  props: [
    { type: 'telescope', x: 9.75, z: 3.5, facing: '-x' },
  ],
}

export default function TreehouseRoom9(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
