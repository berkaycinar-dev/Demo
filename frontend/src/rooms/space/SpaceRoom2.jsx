import SpaceScene from './SpaceScene'

// 2 kişi · 6x5.5 · karşılıklı iki koltuk; duvarda uzay giysisi.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 7102,
  table: { x: 3.2, z: 3.4, back: 1, front: 1, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.36 },
    { type: 'console', at: 3.7, length: 1.4 },
    { type: 'hydro', at: 5.25, length: 1 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 4.65 },
  ],
}

export default function SpaceRoom2(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
