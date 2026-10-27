import CampScene from './CampScene'

// 8 kişi · 9.5x8 · beş oturak, dört çadır, iskele ve kano, piknik masası, hamak, tabela.
const LAYOUT = {
  width: 9.5,
  depth: 8,
  seed: 5108,
  fire: {
    x: 3.4,
    z: 4.3,
    radius: 1.75,
    marshmallow: true,
    tripod: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 108 },
      { type: 'log', angle: 252 },
      { type: 'stump', angle: 40 },
      { type: 'stump', angle: 320 },
    ],
  },
  tents: [
    { type: 'ridge', x: 6, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 7.7, z: 1.4, facing: -20, color: 'blue' },
    { type: 'ridge', x: 8.5, z: 4, facing: -30, color: 'yellow' },
    { type: 'dome', x: 6.75, z: 5.5, facing: -45, color: 'red' },
  ],
  lanterns: [
    { x: 5.4, z: 6.6, facing: -139 },
    { x: 5, z: 0.9, facing: -25 },
  ],
  dock: { z: 1.5 },
  props: [
    { type: 'woodpile', x: 2.3, z: 0.7 },
    { type: 'picnic', x: 3.1, z: 7.25, facing: 180 },
    { type: 'canoe', x: 0.55, z: 5.4, facing: 90 },
    { type: 'hammock', x: 7.7, z: 7.35, facing: 180 },
    { type: 'signpost', x: 9.05, z: 5.9, facing: -40 },
    { type: 'cooler', x: 5.4, z: 7.45, facing: 10 },
    { type: 'mushrooms', x: 4.6, z: 7.65 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 7.4 },
  ],
}

export default function CampRoom8(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
