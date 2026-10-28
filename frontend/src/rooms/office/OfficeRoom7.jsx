import OfficeScene from './OfficeScene'

// 7 kişi · 10x8 · 4+3 masa grubu, dashboard ekranı, lounge, kolon.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 1207,
  columns: [
    { x: 0, z: 3.8 },
  ],
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 2.6 },
    { type: 'coffeeBar', at: 7.4, length: 2.4 },
  ],
  pods: [
    { x: 5.45, z: 3.35, back: 4, front: 3 },
  ],
  rugs: [
    { x: 0.5, z: 5.25, w: 3.3, d: 2.4, color: '#b8a58c' },
  ],
  props: [
    { type: 'credenza', x: 4.2, z: 0.3, length: 1.6 },
    { type: 'waterCooler', x: 7, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'sofa', x: 1.2, z: 6.45, facing: '+x' },
    { type: 'beanBag', x: 3.3, z: 5.85, facing: -90 },
    { type: 'beanBag', x: 3.3, z: 7.05, facing: -90 },
    { type: 'snakePlant', x: 0.55, z: 4.9 },
  ],
}

export default function OfficeRoom7(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
