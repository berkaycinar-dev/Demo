import SpaceScene from './SpaceScene'

// 6 kişi · 8.5x7 · 3+3 görev masası; koşu bandı ve bisiklet, teleskop, pencere önü bank.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 7106,
  table: { x: 4.4, z: 3.7, back: 3, front: 3, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.4 },
    { type: 'console', at: 4.09, length: 2 },
    { type: 'dispenser', at: 5.88 },
    { type: 'hydro', at: 7.45, length: 1.6 },
  ],
  props: [
    { type: 'treadmill', x: 7.8, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3.3, facing: '-x' },
    { type: 'bench', x: 0.44, z: 4.85, facing: '+x', length: 1.6 },
    { type: 'bike', x: 7.8, z: 5.8, facing: '-z' },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 6.15 },
  ],
}

export default function SpaceRoom6(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
