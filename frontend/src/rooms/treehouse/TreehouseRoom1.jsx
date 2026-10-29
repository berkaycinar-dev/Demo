import TreehouseScene from './TreehouseScene'

// 1 kişi · 5.5x4.5 · 1 pencere masası; giriş kapağı, hamak, teleskop.
const LAYOUT = {
  width: 5.5,
  depth: 4.5,
  seed: 9301,
  trunk: { x: 4.5, z: 0.85 },
  hammock: { x: 2.05, length: 2 },
  wall: [
    { type: 'hatch', at: 0.75 },
  ],
  windows: [2.5],
  props: [
    { type: 'telescope', x: 4.75, z: 2.9, facing: '-x' },
  ],
}

export default function TreehouseRoom1(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
