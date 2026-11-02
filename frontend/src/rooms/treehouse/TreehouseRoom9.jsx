import TreehouseScene from './TreehouseScene'

// 9 kişi · 10.5x8.5 · 3 pencere masası, yuvarlak kütük masa, minder köşesi; giriş kapağı, kitaplık, kakao köşesi, hamak, teleskop, kütük bank.
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
    { x: 5.1, z: 4.3, round: true },
  ],
  nook: { x: 8.7, z: 6.4 },
  props: [
    { type: 'telescope', x: 9.75, z: 3.5, facing: '-x' },
    { type: 'bench', x: 0.1, z: 7.3, facing: '+x', length: 1.3 },
  ],
}

export default function TreehouseRoom9(props) {
  return <TreehouseScene layout={LAYOUT} {...props} />
}
