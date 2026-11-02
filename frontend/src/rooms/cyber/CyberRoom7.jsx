import CyberScene from './CyberScene'

// 7 kişi · 9.5x7.5 · 3 kapsül masa, hologram adası; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 9907,
  wall: [
    { type: 'door', at: 1 },
    { type: 'racks', at: 2.99 },
    { type: 'datawall', at: 5.37 },
    { type: 'dock', at: 7.41 },
    { type: 'vending', at: 8.78 },
  ],
  pods: [2.3, 3.8, 5.3],
  tables: [
    { x: 5, z: 4.2, island: true },
  ],
  props: [
    { type: 'vr', x: 8.6, z: 3.3, facing: '-x' },
    { type: 'terrarium', x: 8.9, z: 4.75 },
  ],
  spots: [
    { id: 'window', label: 'Pencere kenarı', x: 0.85, z: 6.65 },
  ],
}

export default function CyberRoom7(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
