import CyberScene from './CyberScene'

// 1 kişi · 5.5x4.5 · 1 kapsül masa; zırhlı kapı, drone, ramen otomatı, VR istasyonu.
const LAYOUT = {
  width: 5.5,
  depth: 4.5,
  seed: 9901,
  wall: [
    { type: 'door', at: 1 },
    { type: 'dock', at: 3.03 },
    { type: 'vending', at: 4.78 },
  ],
  pods: [2.3],
  props: [
    { type: 'vr', x: 4.6, z: 2.8, facing: '-x' },
  ],
}

export default function CyberRoom1(props) {
  return <CyberScene layout={LAYOUT} {...props} />
}
