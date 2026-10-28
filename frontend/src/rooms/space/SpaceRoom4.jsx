import SpaceScene from './SpaceScene'

// 4 kişi · 7.5x6 · 2+2 görev masası; koşu bandı, pencere önünde teleskop.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 7104,
  table: { x: 3.9, z: 3.65, back: 2, front: 2, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.35 },
    { type: 'console', at: 3.79, length: 1.6 },
    { type: 'dispenser', at: 5.33 },
    { type: 'hydro', at: 6.65, length: 1.2 },
  ],
  props: [
    { type: 'treadmill', x: 6.8, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 5.15 },
  ],
}

export default function SpaceRoom4(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
