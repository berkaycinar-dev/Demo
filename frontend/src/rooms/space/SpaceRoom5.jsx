import SpaceScene from './SpaceScene'

// 5 kişi · 8x6.5 · 2+2+1 görev masası; koşu bandı ve bisiklet, teleskop.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 7105,
  table: { x: 3.9, z: 3.85, back: 2, front: 2, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.38 },
    { type: 'console', at: 3.94, length: 1.8 },
    { type: 'dispenser', at: 5.61 },
    { type: 'hydro', at: 7.05, length: 1.4 },
  ],
  props: [
    { type: 'treadmill', x: 7.3, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3.2, facing: '-x' },
    { type: 'bike', x: 7.3, z: 5.55, facing: '-z' },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 5.65 },
  ],
}

export default function SpaceRoom5(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
