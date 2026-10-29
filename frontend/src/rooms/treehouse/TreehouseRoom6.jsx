import TreehouseScene from './TreehouseScene'

// 6 kişi · 8.5x7 · 2 pencere masası, 2 kütük masa; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 9306,
  trunk: { x: 7.5, z: 0.85 },
  hammock: { x: 5.05, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.25 },
    { type: 'cocoa', at: 3.83 },
  ],
  windows: [2.5, 4.1],
  tables: [
    { x: 3.7, z: 3.3 },
    { x: 5.4, z: 5 },
  ],
  props: [
    { type: 'telescope', x: 7.75, z: 3.2, facing: '-x' },
  ],
}

export default function TreehouseRoom6(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
