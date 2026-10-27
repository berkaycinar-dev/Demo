import OfficeScene from './OfficeScene'

// 5 kişi · 8.5x7 · 3+2 masa grubu, ahşap çıta duvar, lounge.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 1205,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 3.0, y: 0.08, length: 2.4 },
    { type: 'coffeeBar', at: 6.0, length: 2.3 },
  ],
  pods: [{ x: 4.4, z: 3.6, back: 3, front: 2 }],
  rugs: [{ x: 0.5, z: 4.7, w: 2.8, d: 2.2, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 5.8, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 6.3, facing: -60 },
    { type: 'waterCooler', x: 8.15, z: 3.6, facing: '-x' },
    { type: 'snakePlant', x: 8.0, z: 6.4 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
}

export default function OfficeRoom5(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
