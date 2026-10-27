import CampScene from './CampScene'

// 10 kişi · 11x9 · büyük ateş çemberi, beş çadır, iskele ve kano, piknik masası, hamak, tabela.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 5110,
  fire: {
    x: 3.85,
    z: 4.7,
    radius: 2,
    marshmallow: true,
    tripod: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 120 },
      { type: 'log', angle: 240 },
      { type: 'log', angle: 60 },
      { type: 'log', angle: 300 },
    ],
  },
  tents: [
    { type: 'ridge', x: 6.7, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 8.45, z: 1.4, facing: -20, color: 'blue' },
    { type: 'ridge', x: 10.05, z: 3.85, facing: -30, color: 'yellow' },
    { type: 'dome', x: 7.85, z: 4, facing: -45, color: 'red' },
    { type: 'ridge', x: 10, z: 6.5, facing: -30, color: 'green' },
  ],
  lanterns: [
    { x: 7.3, z: 6, facing: -111 },
    { x: 5.35, z: 0.9, facing: -22 },
  ],
  dock: { z: 1.5 },
  props: [
    { type: 'woodpile', x: 2.6, z: 0.7 },
    { type: 'picnic', x: 3.4, z: 8.25, facing: 180 },
    { type: 'canoe', x: 0.55, z: 6, facing: 90 },
    { type: 'hammock', x: 7.4, z: 8.3, facing: 180 },
    { type: 'signpost', x: 10.55, z: 8.5, facing: -40 },
    { type: 'cooler', x: 8.6, z: 5.8, facing: -60 },
    { type: 'mushrooms', x: 5, z: 8.6 },
    { type: 'bush', x: 10.6, z: 2 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 8.4 },
  ],
}

export default function CampRoom10(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
