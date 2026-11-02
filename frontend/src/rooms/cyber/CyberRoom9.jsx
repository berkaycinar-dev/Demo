import CyberScene from './CyberScene'

// 9 kişi · 10.5x8.5 · 3 kapsül masa, hologram adası, lounge; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 9909,
  wall: [
    { type: 'door', at: 1 },
    { type: 'stream', at: 2.17 },
    { type: 'racks', at: 3.24 },
    { type: 'stream', at: 4.31 },
    { type: 'datawall', at: 5.87 },
    { type: 'dock', at: 8.16 },
    { type: 'vending', at: 9.78 },
  ],
  pods: [2.3, 3.8, 5.3],
  tables: [
    { x: 5.1, z: 4.3, island: true },
  ],
  lounge: { x: 8.9, z: 6.2 },
  props: [
    { type: 'vr', x: 9.6, z: 3.4, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 7.65 },
  ],
}

export default function CyberRoom9(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
