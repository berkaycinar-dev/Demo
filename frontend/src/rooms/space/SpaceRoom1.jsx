import SpaceScene from './SpaceScene'

// 1 kişi · 5x4.5 · tek kişilik görev masası; hava kilidi, kontrol paneli, hidroponik bahçe.
const LAYOUT = {
  width: 5,
  depth: 4.5,
  seed: 7101,
  table: { x: 2.75, z: 2.95, back: 1, front: 0, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'console', at: 2.74, length: 1.4 },
    { type: 'hydro', at: 4.25, length: 1 },
  ],
  spots: [
    { id: 'window', label: 'Gözlem penceresi', x: 0.85, z: 3.65 },
  ],
}

export default function SpaceRoom1(props) {
  return <SpaceScene layout={LAYOUT} {...props} />
}
