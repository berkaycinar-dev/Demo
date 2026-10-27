import OfficeScene from './OfficeScene'

// 4 kişi · 8x6.5 · karşılıklı 2+2 masa grubu, cam önünde kanepe, su sebili.
const LAYOUT = {
  width: 8,
  depth: 6.5,
  seed: 1204,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'tv', at: 3.7, y: 1.6 },
    { type: 'coffeeBar', at: 5.6, length: 2.2 },
  ],
  pods: [{ x: 4.2, z: 3.4, back: 2, front: 2 }],
  rugs: [{ x: 0.5, z: 4.2, w: 2.6, d: 2.2, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 3.7, z: 0.3, length: 1.4 },
    { type: 'sofa', x: 1.2, z: 5.3, facing: '+x' },
    { type: 'waterCooler', x: 7.7, z: 3.4, facing: '-x' },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
    { type: 'snakePlant', x: 7.6, z: 5.9 },
  ],
}

export default function OfficeRoom4(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
