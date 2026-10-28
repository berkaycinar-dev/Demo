import OfficeScene from './OfficeScene'

// 2 kişi · 6x5.5 · yan yana iki masa, kahve barı ve su sebili.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 1202,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'coffeeBar', at: 3.8, length: 2 },
  ],
  pods: [
    { x: 3.45, z: 3.46, back: 2, front: 0 },
  ],
  props: [
    { type: 'waterCooler', x: 3.4, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'beanBag', x: 0.95, z: 4.55, facing: '+x' },
  ],
  spots: [
    { id: 'window', label: 'Cam kenarı', x: 1, z: 3.4 },
  ],
}

export default function OfficeRoom2(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
