import CampScene from './CampScene'

// 6 kişi · 8x7 · üç kütük bank, üç çadır, iskele ve kano, piknik masası, tabela.
const LAYOUT = {
  width: 8,
  depth: 7,
  seed: 5106,
  fire: {
    x: 2.9,
    z: 3.8,
    radius: 1.5,
    marshmallow: true,
    tripod: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 90 },
      { type: 'log', angle: 270 },
    ],
  },
  tents: [
    { type: 'ridge', x: 5.4, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 7.1, z: 1.45, facing: -20, color: 'blue' },
    { type: 'ridge', x: 6.8, z: 4.1, facing: -30, color: 'green' },
  ],
  lanterns: [
    { x: 5.4, z: 5.6, facing: -126 },
    { x: 4.45, z: 0.9, facing: -28 },
  ],
  dock: { z: 1.5 },
  props: [
    { type: 'woodpile', x: 1.85, z: 0.7 },
    { type: 'picnic', x: 3.4, z: 6.2, facing: 180 },
    { type: 'canoe', x: 0.55, z: 5, facing: 90 },
    { type: 'signpost', x: 7.5, z: 6.45, facing: -40 },
    { type: 'backpack', x: 7.6, z: 2.75, facing: -90 },
    { type: 'mushrooms', x: 5, z: 6.5 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 6.4 },
  ],
}

export default function CampRoom6(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
