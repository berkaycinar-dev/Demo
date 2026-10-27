import CampScene from './CampScene'

// 4 kişi · 6.5x6 · kütük bank, tabure ve sandalye; iki çadır, iskele, piknik masası.
const LAYOUT = {
  width: 6.5,
  depth: 6,
  seed: 5104,
  fire: {
    x: 2.4,
    z: 3.2,
    radius: 1.3,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'stump', angle: 95 },
      { type: 'chair', angle: 265 },
    ],
  },
  tents: [
    { type: 'ridge', x: 4.95, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 5.7, z: 4.3, facing: -60, color: 'blue' },
  ],
  lanterns: [
    { x: 4.75, z: 4.95, facing: -127 },
  ],
  dock: { z: 1.45 },
  props: [
    { type: 'woodpile', x: 1.75, z: 0.7 },
    { type: 'picnic', x: 3.4, z: 5.25, facing: 180 },
    { type: 'backpack', x: 6, z: 1.75, facing: -90 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 5.4 },
  ],
}

export default function CampRoom4(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
