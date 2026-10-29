import CyberScene from './CyberScene'

// 8 kişi · 10x8 · 2 kapsül masa, 2 hologram masası, lounge; zırhlı kapı, sunucular, veri duvarı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 9908,
  wall: [
    { type: 'door', at: 1 },
    { type: 'racks', at: 3.12 },
    { type: 'datawall', at: 5.62 },
    { type: 'dock', at: 7.79 },
    { type: 'vending', at: 9.28 },
  ],
  pods: [2.3, 3.9],
  tables: [
    { x: 4, z: 3.4 },
    { x: 6, z: 5.2 },
  ],
  lounge: { x: 8.4, z: 5.9 },
  props: [
    { type: 'vr', x: 9.1, z: 3.3, facing: '-x' },
  ],
}

export default function CyberRoom8(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
