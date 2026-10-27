import CampScene from './CampScene'

// 7 kişi · 9x7.5 · dört oturak, dört çadır, iskele ve kano, piknik masası, hamak.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 5107,
  fire: {
    x: 3.4,
    z: 4,
    radius: 1.75,
    marshmallow: true,
    tripod: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 105 },
      { type: 'log', angle: 255 },
      { type: 'stump', angle: 30 },
    ],
  },
  tents: [
    { type: 'ridge', x: 5.9, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 7.55, z: 1.4, facing: -20, color: 'blue' },
    { type: 'ridge', x: 8, z: 3.9, facing: -30, color: 'yellow' },
    { type: 'dome', x: 6.35, z: 5.2, facing: -45, color: 'red' },
  ],
  lanterns: [
    { x: 5.15, z: 6.4, facing: -144 },
    { x: 4.75, z: 0.9, facing: -24 },
  ],
  dock: { z: 1.5 },
  props: [
    { type: 'woodpile', x: 2.2, z: 0.7 },
    { type: 'picnic', x: 2.6, z: 6.75, facing: 180 },
    { type: 'canoe', x: 0.55, z: 5.1, facing: 90 },
    { type: 'hammock', x: 7.4, z: 6.95, facing: 180 },
    { type: 'cooler', x: 5, z: 7, facing: 10 },
    { type: 'mushrooms', x: 4, z: 7.1 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 6.9 },
  ],
}

export default function CampRoom7(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
