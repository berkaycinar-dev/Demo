import TreehouseScene from './TreehouseScene'

// 7 kişi · 9.5x7.5 · 3 pencere masası, 2 kütük masa; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 9307,
  trunk: { x: 8.5, z: 0.85 },
  hammock: { x: 5.75, length: 2.3 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.49 },
    { type: 'cocoa', at: 4.29 },
  ],
  windows: [2.5, 4, 5.5],
  tables: [
    { x: 3.9, z: 3.3 },
    { x: 5.7, z: 5 },
  ],
  props: [
    { type: 'telescope', x: 8.75, z: 3.3, facing: '-x' },
  ],
}

export default function TreehouseRoom7(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
