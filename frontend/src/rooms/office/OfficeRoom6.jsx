import OfficeScene from './OfficeScene'

// 6 kişi · 9x7.5 · 3+3 masa grubu, cam cephede kolon, lounge.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 1206,
  columns: [{ x: 0, z: 3.6 }],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.2 },
    { type: 'coffeeBar', at: 6.5, length: 2.3 },
  ],
  pods: [{ x: 4.6, z: 3.8, back: 3, front: 3 }],
  rugs: [{ x: 0.5, z: 5.0, w: 3.3, d: 2.4, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.0, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 6.2, facing: '+x' },
    { type: 'beanBag', x: 3.2, z: 5.6, facing: -90 },
    { type: 'beanBag', x: 3.2, z: 6.8, facing: -90 },
    { type: 'waterCooler', x: 8.65, z: 3.9, facing: '-x' },
    { type: 'snakePlant', x: 8.5, z: 6.9 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
}

export default function OfficeRoom6(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
