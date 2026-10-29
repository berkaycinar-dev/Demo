import CyberScene from './CyberScene'

// 4 kişi · 7.5x6 · 2 kapsül masa, 1 hologram masası; zırhlı kapı, sunucular, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 7.5,
  depth: 6,
  seed: 9904,
  wall: [
    { type: 'door', at: 1 },
    { type: 'stream', at: 2.2 },
    { type: 'racks', at: 3.28 },
    { type: 'dock', at: 5.12 },
    { type: 'vending', at: 6.78 },
  ],
  pods: [2.3, 3.8],
  tables: [
    { x: 3.7, z: 3.5 },
  ],
  props: [
    { type: 'vr', x: 6.6, z: 3.4, facing: '-x' },
    { type: 'terrarium', x: 6.9, z: 4.85 },
  ],
}

export default function CyberRoom4(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
