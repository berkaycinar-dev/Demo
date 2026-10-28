import SpaceScene from './SpaceScene'

// 7 kişi · 9.5x7.5 · 3+3+1 görev masası; koşu bandı ve bisiklet, teleskop, pencere önü bank, kargo rafı, zemin penceresi.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 7107,
  table: { x: 4.5, z: 3.5, back: 3, front: 3, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.33 },
    { type: 'console', at: 3.94, length: 2 },
    { type: 'dispenser', at: 5.66 },
    { type: 'cargo', at: 6.85, length: 1 },
    { type: 'hydro', at: 8.45, length: 1.6 },
  ],
  props: [
    { type: 'treadmill', x: 8.8, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3.4, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5, facing: '+x', length: 2 },
    { type: 'bike', x: 8.8, z: 6.05, facing: '-z' },
    { type: 'cupola', x: 4.5, z: 6.3 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 6.65 },
  ],
}

export default function SpaceRoom7(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
