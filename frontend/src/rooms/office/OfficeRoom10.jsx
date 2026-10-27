import OfficeScene from './OfficeScene'

// 10 kişi · 12x9.5 · iki 3+2 masa grubu, masa tenisi, lounge, uzun kahve barı.
const LAYOUT = {
  width: 12,
  depth: 9.5,
  seed: 1210,
  columns: [{ x: 0, z: 4.75 }],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'tv', at: 6.9, y: 1.6 },
    { type: 'coffeeBar', at: 8.8, length: 3.0 },
  ],
  pods: [
    { x: 4.0, z: 4.2, back: 3, front: 2 },
    { x: 8.6, z: 4.2, back: 3, front: 2 },
  ],
  rugs: [{ x: 0.5, z: 6.6, w: 3.3, d: 2.4, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 7.8, facing: '+x' },
    { type: 'beanBag', x: 3.2, z: 7.2, facing: -90 },
    { type: 'beanBag', x: 3.2, z: 8.4, facing: -90 },
    { type: 'pingPong', x: 7.8, z: 7.8, facing: '-z' },
    { type: 'waterCooler', x: 11.65, z: 6.6, facing: '-x' },
    { type: 'snakePlant', x: 11.5, z: 8.9 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
    { type: 'snakePlant', x: 11.6, z: 5.2 },
  ],
}

export default function OfficeRoom10(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
