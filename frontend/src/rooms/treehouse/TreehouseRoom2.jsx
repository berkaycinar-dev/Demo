import TreehouseScene from './TreehouseScene'

// 2 kişi · 6x5 · 2 pencere masası; giriş kapağı, hamak, teleskop.
const LAYOUT = {
  width: 6,
  depth: 5,
  seed: 9302,
  trunk: { x: 5, z: 0.85 },
  hammock: { x: 2.55, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
  ],
  windows: [2.4, 3.9],
  props: [
    { type: 'telescope', x: 5.25, z: 3, facing: '-x' },
  ],
}

export default function TreehouseRoom2(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
