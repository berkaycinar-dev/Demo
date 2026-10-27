import CampScene from './CampScene'

// 1 kişi · 4.5x4.5 · ateş başında kamp sandalyesi, tek çadır.
const LAYOUT = {
  width: 4.5,
  depth: 4.5,
  seed: 5101,
  fire: {
    x: 1.75,
    z: 2.45,
    radius: 1.1,
    seats: [
      { type: 'chair', angle: 180 },
    ],
  },
  tents: [
    { type: 'ridge', x: 3.45, z: 1.3, facing: 0, color: 'orange', spot: true },
  ],
  lanterns: [
    { x: 3.1, z: 3.75, facing: -134 },
  ],
  props: [
    { type: 'cooler', x: 3.9, z: 3.9, facing: -30 },
    { type: 'mushrooms', x: 2.3, z: 4.05 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 3.9 },
  ],
}

export default function CampRoom1(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
