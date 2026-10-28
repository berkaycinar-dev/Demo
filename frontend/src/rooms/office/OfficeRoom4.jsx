import OfficeScene from './OfficeScene'

// 4 kişi · 8x6.5 · karşılıklı 2+2 masa grubu, cam önünde kanepe.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 1204,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'tv', at: 3.55, y: 1.6 },
    { type: 'coffeeBar', at: 5.6, length: 2.2 },
  ],
  pods: [
    { x: 4.45, z: 3.17, back: 2, front: 2 },
  ],
  rugs: [
    { x: 0.5, z: 3.75, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 3.55, z: 0.3, length: 1.2 },
    { type: 'waterCooler', x: 5.2, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 4.95, facing: '+x' },
    { type: 'snakePlant', x: 0.55, z: 3.4 },
  ],
}

export default function OfficeRoom4(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
