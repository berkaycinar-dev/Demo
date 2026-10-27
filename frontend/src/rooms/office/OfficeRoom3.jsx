import OfficeScene from './OfficeScene'

// 3 kişi · 7x6 · üçlü bench masa, dashboard ekranı, kahve barı, armut koltuklar.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 1203,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'tv', at: 3.6, y: 1.6 },
    { type: 'coffeeBar', at: 4.7, length: 2.1 },
  ],
  pods: [{ x: 3.6, z: 3.2, back: 3 }],
  props: [
    { type: 'credenza', x: 3.6, z: 0.3, length: 1.4 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
    { type: 'beanBag', x: 1.0, z: 5.0, facing: 45 },
    { type: 'beanBag', x: 2.1, z: 5.3, facing: 20 },
    { type: 'snakePlant', x: 6.5, z: 5.4 },
  ],
}

export default function OfficeRoom3(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
