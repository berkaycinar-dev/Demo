import OfficeScene from './OfficeScene'

// 10 kişi · 12x9.5 · iki 3+2 masa grubu, masa tenisi, lounge, uzun kahve barı.
const LAYOUT = {
  width: 12,
  depth: 9.5,
  seed: 1210,
  columns: [
    { x: 0, z: 4.55 },
  ],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'tv', at: 6.45, y: 1.6 },
    { type: 'coffeeBar', at: 8.8, length: 3 },
  ],
  pods: [
    { x: 3.9, z: 4.1, back: 3, front: 2 },
    { x: 9, z: 4.1, back: 3, front: 2 },
  ],
  rugs: [
    { x: 0.5, z: 6.75, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'waterCooler', x: 8.4, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 7.95, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 7.35, facing: -90 },
    { type: 'beanBag', x: 3.3, z: 8.55, facing: -90 },
    { type: 'snakePlant', x: 0.55, z: 6.4 },
    { type: 'pingPong', x: 10, z: 8.4, facing: '-z' },
  ],
}

export default function OfficeRoom10(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
