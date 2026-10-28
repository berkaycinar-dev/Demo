import OfficeScene from './OfficeScene'

// 9 kişi · 11.5x9 · 3+2 ve 2+2 masa grupları, masa tenisi, lounge.
const LAYOUT = {
  width: 11.5,
  depth: 9,
  seed: 1209,
  columns: [
    { x: 0, z: 4.3 },
  ],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'tv', at: 6.45, y: 1.6 },
    { type: 'coffeeBar', at: 8.6, length: 2.7 },
  ],
  pods: [
    { x: 4.3, z: 3.85, back: 3, front: 2 },
    { x: 8.75, z: 3.85, back: 2, front: 2 },
  ],
  rugs: [
    { x: 0.5, z: 6.25, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'waterCooler', x: 8.2, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 7.45, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 6.85, facing: -90 },
    { type: 'beanBag', x: 3.3, z: 8.05, facing: -90 },
    { type: 'snakePlant', x: 0.55, z: 5.9 },
    { type: 'pingPong', x: 9.5, z: 7.9, facing: '-z' },
  ],
}

export default function OfficeRoom9(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
