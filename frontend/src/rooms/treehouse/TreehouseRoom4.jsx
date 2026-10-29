import TreehouseScene from './TreehouseScene'

// 4 kişi · 7.5x6 · 2 pencere masası, 1 kütük masa; giriş kapağı, kitaplık, hamak, teleskop.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 9304,
  trunk: { x: 6.5, z: 0.85 },
  hammock: { x: 4.05, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.56 },
  ],
  windows: [2.5, 4.1],
  tables: [
    { x: 3.6, z: 3.5 },
  ],
  props: [
    { type: 'telescope', x: 6.75, z: 3.3, facing: '-x' },
  ],
}

export default function TreehouseRoom4(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
