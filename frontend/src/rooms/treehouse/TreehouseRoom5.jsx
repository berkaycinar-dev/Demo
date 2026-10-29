import TreehouseScene from './TreehouseScene'

// 5 kişi · 8x7 · 3 pencere masası, 1 kütük masa; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 9305,
  trunk: { x: 7, z: 0.85 },
  hammock: { x: 4.55, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.09 },
    { type: 'cocoa', at: 3.49 },
  ],
  windows: [2.5, 4, 5.5],
  tables: [
    { x: 3.9, z: 3.7 },
  ],
  props: [
    { type: 'telescope', x: 7.25, z: 3.4, facing: '-x' },
  ],
}

export default function TreehouseRoom5(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
