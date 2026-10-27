import OfficeScene from './OfficeScene'

// 2 kişi · 6x5.5 · yan yana iki masa, kahve barı.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 1202,
  decor: [
    { type: 'board', at: 1.5, y: 1.45 },
    { type: 'coffeeBar', at: 3.8, length: 2.0 },
  ],
  pods: [{ x: 3.0, z: 3.0, back: 2 }],
  props: [
    { type: 'snakePlant', x: 0.6, z: 1.0 },
    { type: 'beanBag', x: 1.0, z: 4.6, facing: 45 },
    { type: 'snakePlant', x: 5.5, z: 4.9 },
  ],
  spots: [{ id: 'window', label: 'Cam kenarı', x: 1.0, z: 3.2 }],
}

export default function OfficeRoom2(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
