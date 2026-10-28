import OfficeScene from './OfficeScene'

// 3 kişi · 7x6 · üçlü bench masa, dashboard ekranı, iki armut koltuk.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 1203,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'coffeeBar', at: 4.8, length: 2 },
  ],
  pods: [
    { x: 3.95, z: 3.71, back: 3, front: 0 },
  ],
  props: [
    { type: 'waterCooler', x: 4.4, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'beanBag', x: 0.95, z: 5.05, facing: '+x' },
    { type: 'beanBag', x: 0.95, z: 4.05, facing: '+x' },
  ],
  spots: [
    { id: 'window', label: 'Cam kenarı', x: 1, z: 3 },
  ],
}

export default function OfficeRoom3(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
