import CampScene from './CampScene'

// 2 kişi · 5x5 · ateş başında kütük bank, kubbe çadır, odun yığını.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 5102,
  fire: {
    x: 1.75,
    z: 2.75,
    radius: 1.1,
    seats: [
      { type: 'log', angle: 180 },
    ],
  },
  tents: [
    { type: 'dome', x: 3.85, z: 1.3, facing: 0, color: 'blue', spot: true },
  ],
  lanterns: [
    { x: 4.5, z: 3.3, facing: -101 },
  ],
  props: [
    { type: 'woodpile', x: 1.1, z: 0.75 },
    { type: 'backpack', x: 4.65, z: 2.25, facing: -60 },
    { type: 'mushrooms', x: 3.3, z: 4.4 },
    { type: 'rock', x: 4.45, z: 4.45 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 4.4 },
  ],
}

export default function CampRoom2(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
