import OfficeScene from './OfficeScene'

// 7 kişi · 10x8 · 3+3 masa grubu + tekli masa, dashboard ekranı, lounge.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 1207,
  columns: [{ x: 0, z: 4.0 }],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.4 },
    { type: 'tv', at: 6.3, y: 1.6 },
    { type: 'coffeeBar', at: 7.4, length: 2.4 },
  ],
  pods: [
    { x: 4.4, z: 3.9, back: 3, front: 3 },
    { x: 8.4, z: 3.6, back: 1 },
  ],
  rugs: [{ x: 0.5, z: 5.4, w: 3.3, d: 2.4, color: '#b8a58c' }],
  props: [
    { type: 'credenza', x: 4.1, z: 0.3, length: 1.6 },
    { type: 'sofa', x: 1.2, z: 6.6, facing: '+x' },
    { type: 'beanBag', x: 3.2, z: 6.0, facing: -90 },
    { type: 'beanBag', x: 3.2, z: 7.2, facing: -90 },
    { type: 'waterCooler', x: 9.65, z: 5.6, facing: '-x' },
    { type: 'snakePlant', x: 9.5, z: 7.4 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
}

export default function OfficeRoom7(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
