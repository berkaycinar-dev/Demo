import CyberScene from './CyberScene'

// 3 kişi · 7x5.5 · 1 kapsül masa, 1 hologram masası; zırhlı kapı, sunucular, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 7,
  depth: 5.5,
  seed: 9903,
  wall: [
    { type: 'door', at: 1 },
    { type: 'racks', at: 3.12 },
    { type: 'dock', at: 4.78 },
    { type: 'vending', at: 6.28 },
  ],
  pods: [2.4],
  tables: [
    { x: 3.4, z: 3.3 },
  ],
  props: [
    { type: 'vr', x: 6.1, z: 3.2, facing: '-x' },
    { type: 'terrarium', x: 6.4, z: 4.65 },
  ],
}

export default function CyberRoom3(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
