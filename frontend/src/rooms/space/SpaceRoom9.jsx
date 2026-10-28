import SpaceScene from './SpaceScene'

// 9 kişi · 10.5x8.5 · 4+4+1 görev masası; koşu bandı ve bisiklet, teleskop, pencere önü bank, kargo rafı, zemin penceresi.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 7109,
  table: { x: 5, z: 3.5, back: 4, front: 4, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.41 },
    { type: 'console', at: 4.3, length: 2.4 },
    { type: 'dispenser', at: 6.3 },
    { type: 'cargo', at: 7.57, length: 1 },
    { type: 'hydro', at: 9.35, length: 1.8 },
  ],
  props: [
    { type: 'treadmill', x: 9.8, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3.8, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5.75, facing: '+x', length: 2.2 },
    { type: 'bike', x: 9.8, z: 6.55, facing: '-z' },
    { type: 'cupola', x: 5, z: 6.75 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 7.65 },
  ],
}

export default function SpaceRoom9(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
