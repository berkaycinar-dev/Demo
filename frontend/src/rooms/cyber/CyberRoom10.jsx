import CyberScene from './CyberScene'

// 10 kişi · 11x9 · 4 kapsül masa, hologram adası, lounge; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 9910,
  wall: [
    { type: 'door', at: 1 },
    { type: 'stream', at: 2.24 },
    { type: 'racks', at: 3.37 },
    { type: 'stream', at: 4.49 },
    { type: 'datawall', at: 6.12 },
    { type: 'dock', at: 8.54 },
    { type: 'vending', at: 10.28 },
  ],
  pods: [2.3, 3.8, 5.3, 6.8],
  tables: [
    { x: 5.3, z: 4.5, island: true },
  ],
  lounge: { x: 9.3, z: 6.4 },
  props: [
    { type: 'vr', x: 10.1, z: 3.5, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 8.15 },
  ],
}

export default function CyberRoom10(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
