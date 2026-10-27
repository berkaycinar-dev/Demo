import CampScene from './CampScene'

// 3 kişi · 6x5.5 · kütük bank ve sandalye, iki çadır, iskele.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 5103,
  fire: {
    x: 2.3,
    z: 3,
    radius: 1.3,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'chair', angle: 80 },
    ],
  },
  tents: [
    { type: 'ridge', x: 4.65, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 5.15, z: 4.4, facing: -60, color: 'green' },
  ],
  lanterns: [
    { x: 3.75, z: 4.75, facing: -140 },
  ],
  dock: { z: 1.45 },
  props: [
    { type: 'woodpile', x: 1.75, z: 0.7 },
    { type: 'cooler', x: 2.9, z: 4.8, facing: -20 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 4.9 },
  ],
}

export default function CampRoom3(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
