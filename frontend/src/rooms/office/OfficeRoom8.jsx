import OfficeScene from './OfficeScene'

// 8 kişi · 11x8.5 · iki 2+2 masa grubu, masa tenisi, lounge.
const LAYOUT = {
  width: 11,
  depth: 8.5,
  seed: 1208,
  columns: [{ x: 0, z: 4.3 }],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'tv', at: 6.6, y: 1.6 },
    { type: 'coffeeBar', at: 8.2, length: 2.6 },
  ],
  pods: [
    { x: 3.9, z: 3.9, back: 2, front: 2 },
    { x: 7.6, z: 3.9, back: 2, front: 2 },
  ],
  rugs: [{ x: 0.5, z: 5.8, w: 3.3, d: 2.4, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 7.0, facing: '+x' },
    { type: 'beanBag', x: 3.2, z: 6.4, facing: -90 },
    { type: 'beanBag', x: 3.2, z: 7.6, facing: -90 },
    { type: 'pingPong', x: 7.4, z: 7.0, facing: '-z' },
    { type: 'waterCooler', x: 10.65, z: 5.8, facing: '-x' },
    { type: 'snakePlant', x: 10.5, z: 8.0 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
}

export default function OfficeRoom8(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
