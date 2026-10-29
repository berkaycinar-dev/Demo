import TreehouseScene from './TreehouseScene'

// 3 kişi · 7x5.5 · 1 pencere masası, 1 kütük masa; giriş kapağı, kitaplık, hamak, teleskop.
const LAYOUT = {
  width: 7,
  depth: 5.5,
  seed: 9303,
  trunk: { x: 6, z: 0.85 },
  hammock: { x: 3.55, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.31 },
  ],
  windows: [2.6],
  tables: [
    { x: 3.3, z: 3.3 },
  ],
  props: [
    { type: 'telescope', x: 6.25, z: 3.2, facing: '-x' },
  ],
}

export default function TreehouseRoom3(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
