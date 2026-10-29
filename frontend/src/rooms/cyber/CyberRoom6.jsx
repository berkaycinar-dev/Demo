import CyberScene from './CyberScene'

// 6 kişi · 9x7 · 2 kapsül masa, 2 hologram masası; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 9,
  depth: 7,
  seed: 9906,
  wall: [
    { type: 'door', at: 1 },
    { type: 'racks', at: 2.87 },
    { type: 'datawall', at: 5.12 },
    { type: 'dock', at: 7.04 },
    { type: 'vending', at: 8.28 },
  ],
  pods: [2.3, 3.9],
  tables: [
    { x: 3.9, z: 3.4 },
    { x: 5.8, z: 5 },
  ],
  props: [
    { type: 'vr', x: 8.1, z: 3.3, facing: '-x' },
    { type: 'terrarium', x: 8.4, z: 4.75 },
  ],
}

export default function CyberRoom6(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
