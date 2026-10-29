import CyberScene from './CyberScene'

// 5 kişi · 8.5x6.5 · 3 kapsül masa, 1 hologram masası; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 8.5,
  depth: 6.5,
  seed: 9905,
  wall: [
    { type: 'door', at: 1 },
    { type: 'racks', at: 2.74 },
    { type: 'datawall', at: 4.87 },
    { type: 'dock', at: 6.66 },
    { type: 'vending', at: 7.78 },
  ],
  pods: [2.3, 3.8, 5.3],
  tables: [
    { x: 4.1, z: 3.6 },
  ],
  props: [
    { type: 'vr', x: 7.6, z: 3.4, facing: '-x' },
    { type: 'terrarium', x: 7.9, z: 4.85 },
  ],
}

export default function CyberRoom5(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
