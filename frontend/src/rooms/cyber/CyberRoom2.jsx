import CyberScene from './CyberScene'

// 2 kişi · 6x5 · 2 kapsül masa; zırhlı kapı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 6,
  depth: 5,
  seed: 9902,
  wall: [
    { type: 'door', at: 1 },
    { type: 'dock', at: 3.28 },
    { type: 'vending', at: 5.28 },
  ],
  pods: [2.3, 3.8],
  props: [
    { type: 'vr', x: 5.1, z: 3, facing: '-x' },
  ],
}

export default function CyberRoom2(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
