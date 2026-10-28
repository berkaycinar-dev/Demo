import SpaceScene from './SpaceScene'

// 3 kişi · 7x6 · 2+1 görev masası; ikmal otomatı, koşu bandı.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 7103,
  table: { x: 3.6, z: 3.65, back: 2, front: 1, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.32 },
    { type: 'console', at: 3.64, length: 1.4 },
    { type: 'dispenser', at: 5.05 },
    { type: 'hydro', at: 6.25, length: 1 },
  ],
  props: [
    { type: 'treadmill', x: 6.3, z: 2.6 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 5.15 },
  ],
}

export default function SpaceRoom3(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
