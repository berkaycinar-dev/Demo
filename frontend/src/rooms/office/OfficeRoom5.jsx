import OfficeScene from './OfficeScene'

// 5 kişi · 8.5x7 · 3+2 masa grubu, ahşap çıta duvar, lounge.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 1205,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.1 },
    { type: 'coffeeBar', at: 6, length: 2.3 },
  ],
  pods: [
    { x: 4.7, z: 3.17, back: 3, front: 2 },
  ],
  rugs: [
    { x: 0.5, z: 4.25, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 3.95, z: 0.3, length: 1.6 },
    { type: 'waterCooler', x: 5.6, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 5.45, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 5.45, facing: -90 },
    { type: 'snakePlant', x: 0.55, z: 3.9 },
  ],
}

export default function OfficeRoom5(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
