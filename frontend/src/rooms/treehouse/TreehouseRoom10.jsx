import TreehouseScene from './TreehouseScene'

// 10 kişi · 11x9 · 4 pencere masası, yuvarlak kütük masa, minder köşesi; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop, kütük bank.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 9310,
  trunk: { x: 10, z: 0.85 },
  hammock: { x: 7.25, length: 2.3 },
  wall: [
    { type: 'hatch', at: 0.75 },
    { type: 'shelf', at: 2.99 },
    { type: 'cocoa', at: 5.29 },
  ],
  windows: [2.5, 4, 5.5, 7],
  tables: [
    { x: 5.3, z: 4.4, round: true },
  ],
  nook: { x: 9.1, z: 6.8 },
  props: [
    { type: 'telescope', x: 10.25, z: 3.6, facing: '-x' },
    { type: 'bench', x: 0.1, z: 8.25, facing: '+x', length: 1.1 },
  ],
}

export default function TreehouseRoom10(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
