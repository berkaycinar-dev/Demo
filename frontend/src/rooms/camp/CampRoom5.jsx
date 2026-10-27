import CampScene from './CampScene'

// 5 kişi · 7.5x6.5 · üç oturak, üç çadır, iskele, piknik masası, tabela.
const LAYOUT = {
  width: 7.5,
  depth: 6.5,
  seed: 5105,
  fire: {
    x: 2.85,
    z: 3.5,
    radius: 1.5,
    marshmallow: true,
    seats: [
      { type: 'log', angle: 180 },
      { type: 'log', angle: 90 },
      { type: 'chair', angle: 270 },
    ],
  },
  tents: [
    { type: 'ridge', x: 5.15, z: 1.3, facing: 0, color: 'orange', spot: true },
    { type: 'dome', x: 6.7, z: 1.45, facing: -20, color: 'green' },
    { type: 'ridge', x: 6.45, z: 3.85, facing: -30, color: 'yellow' },
  ],
  lanterns: [
    { x: 5, z: 5.15, facing: -128 },
    { x: 4.25, z: 0.95, facing: -29 },
  ],
  dock: { z: 1.45 },
  props: [
    { type: 'woodpile', x: 1.9, z: 0.7 },
    { type: 'picnic', x: 2.85, z: 5.75, facing: 180 },
    { type: 'signpost', x: 7.05, z: 5.95, facing: -40 },
    { type: 'mushrooms', x: 6.9, z: 5.1 },
  ],
  spots: [
    { id: 'lake', label: 'Göl kenarı', x: 0.75, z: 5.9 },
  ],
}

export default function CampRoom5(props) {
  return <CampScene layout={LAYOUT} {...props} />
}
