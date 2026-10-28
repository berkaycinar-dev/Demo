import OfficeScene from './OfficeScene'

// 6 kişi · 9x7.5 · 3+3 masa grubu, lounge.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 1206,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'coffeeBar', at: 6.5, length: 2.3 },
  ],
  pods: [
    { x: 4.95, z: 3.17, back: 3, front: 3 },
  ],
  rugs: [
    { x: 0.5, z: 4.75, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'waterCooler', x: 6.1, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 5.95, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 5.35, facing: -90 },
    { type: 'beanBag', x: 3.3, z: 6.55, facing: -90 },
    { type: 'snakePlant', x: 0.55, z: 4.4 },
  ],
}

export default function OfficeRoom6(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
