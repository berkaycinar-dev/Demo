import SpaceScene from './SpaceScene'

// 8 kişi · 10x8 · 3+3+2 görev masası; koşu bandı ve bisiklet, teleskop, pencere önü bank, kargo rafı, zemin penceresi.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 7108,
  table: { x: 4.9, z: 3.4, back: 3, front: 3, ends: 2 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.35 },
    { type: 'console', at: 4.08, length: 2.2 },
    { type: 'dispenser', at: 5.92 },
    { type: 'cargo', at: 7.13, length: 1 },
    { type: 'hydro', at: 8.85, length: 1.8 },
  ],
  props: [
    { type: 'treadmill', x: 9.3, z: 2.6 },
    { type: 'telescope', x: 0.8, z: 3.6, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5.4, facing: '+x', length: 2.2 },
    { type: 'bike', x: 9.3, z: 6.3, facing: '-z' },
    { type: 'cupola', x: 4.9, z: 6.35 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 7.15 },
  ],
}

export default function SpaceRoom8(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
