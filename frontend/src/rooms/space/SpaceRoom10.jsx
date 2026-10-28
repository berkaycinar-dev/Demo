import SpaceScene from './SpaceScene'

// 10 kişi · 11x9 · 4+4+2 görev masası; koşu bandı ve bisiklet, teleskop, pencere önü bank, kargo rafı, zemin penceresi.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 7110,
  table: { x: 5.3, z: 3.6, back: 4, front: 4, ends: 2 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.47 },
    { type: 'console', at: 4.42, length: 2.4 },
    { type: 'dispenser', at: 6.48 },
    { type: 'cargo', at: 7.81, length: 1 },
    { type: 'hydro', at: 9.75, length: 2 },
  ],
  props: [
    { type: 'treadmill', x: 10.3, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 4, facing: '-x' },
    { type: 'bench', x: 0.44, z: 6, facing: '+x', length: 2.4 },
    { type: 'bike', x: 10.3, z: 6.8, facing: '-z' },
    { type: 'cupola', x: 5.3, z: 7.15 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 8.15 },
  ],
}

export default function SpaceRoom10(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
