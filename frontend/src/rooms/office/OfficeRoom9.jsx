import OfficeScene from './OfficeScene'

// 9 kişi · 11.5x9 · 3+2 ve 2+2 masa grupları, masa tenisi, lounge.
const LAYOUT = {
  width: 11.5,
  depth: 9,
  seed: 1209,
  columns: [{ x: 0, z: 4.5 }],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'tv', at: 6.9, y: 1.6 },
    { type: 'coffeeBar', at: 8.6, length: 2.7 },
  ],
  pods: [
    { x: 3.95, z: 4.0, back: 3, front: 2 },
    { x: 8.4, z: 4.0, back: 2, front: 2 },
  ],
  rugs: [{ x: 0.5, z: 6.2, w: 3.3, d: 2.4, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 7.4, facing: '+x' },
    { type: 'beanBag', x: 3.2, z: 6.8, facing: -90 },
    { type: 'beanBag', x: 3.2, z: 8.0, facing: -90 },
    { type: 'pingPong', x: 7.6, z: 7.4, facing: '-z' },
    { type: 'waterCooler', x: 11.15, z: 6.0, facing: '-x' },
    { type: 'snakePlant', x: 11.0, z: 8.4 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
}

export default function OfficeRoom9(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
