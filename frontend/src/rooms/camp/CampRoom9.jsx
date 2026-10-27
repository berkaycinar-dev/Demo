import CampScene from './CampScene'

// 9 kişi · 10.5x8.5 · büyük ateş çemberi, beş çadır, iskele ve kano, piknik masası, hamak, tabela.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 5109,
  fire: {
    x: 3.75,
    z: 4.45,
    radius: 2,
    marshmallow: true,
    tripod: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 120 },
      { type: 'log', angle: 240 },
      { type: 'log', angle: 50 },
      { type: 'chair', angle: 315 },
    ],
  },
  tents: [
    { type: 'ridge', x: 6.6, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 8.3, z: 1.4, facing: -20, color: 'blue' },
    { type: 'ridge', x: 9.55, z: 3.8, facing: -30, color: 'yellow' },
    { type: 'dome', x: 7.6, z: 3.9, facing: -45, color: 'red' },
    { type: 'ridge', x: 9.45, z: 6.4, facing: -30, color: 'green' },
  ],
  lanterns: [
    { x: 7.05, z: 5.6, facing: -109 },
    { x: 5.25, z: 0.9, facing: -23 },
  ],
  dock: { z: 1.5 },
  props: [
    { type: 'woodpile', x: 2.5, z: 0.7 },
    { type: 'picnic', x: 3, z: 7.75, facing: 180 },
    { type: 'canoe', x: 0.55, z: 5.6, facing: 90 },
    { type: 'hammock', x: 6.9, z: 7.8, facing: 180 },
    { type: 'signpost', x: 10.1, z: 8, facing: -40 },
    { type: 'cooler', x: 8.3, z: 5.5, facing: -60 },
    { type: 'mushrooms', x: 4.6, z: 8.1 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 7.9 },
  ],
}

export default function CampRoom9(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
