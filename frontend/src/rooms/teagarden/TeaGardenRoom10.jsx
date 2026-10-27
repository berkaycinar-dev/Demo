import TeaGardenScene from './TeaGardenScene'

// 10 kişi · 11x9 · dört masa, pencere önünde sedir, simitçi, süs havuzu, çınar altı, çiçeklik.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 4110,
  strings: [3.5, 6.5],
  decor: [
    { type: 'counter', at: 0.9, length: 2.8 },
    { type: 'lantern', at: 4.2, y: 2 },
    { type: 'door', at: 5.05 },
    { type: 'lantern', at: 5.95, y: 2 },
    { type: 'window', at: 7.3, y: 1.1 },
  ],
  tables: [
    { x: 1.4, z: 3.8, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.8, z: 4.1, sides: ['back', 'left', 'right'], cloth: 'blue', extra: 'simit' },
    { x: 6.3, z: 4.4, sides: ['back', 'front', 'right'], cloth: 'green' },
    { x: 1.6, z: 6.9, sides: ['back', 'right'], cloth: 'blue', extra: 'simit' },
  ],
  props: [
    { type: 'tree', x: 10.25, z: 0.85 },
    { type: 'sedir', x: 7.3, z: 0.36, length: 1.8, sini: true },
    { type: 'simitCart', x: 10.35, z: 5, facing: '-x' },
    { type: 'olive', x: 8.7, z: 8.35 },
    { type: 'planter', x: 4.6, z: 8.7, length: 2.2 },
    { type: 'pool', x: 5.9, z: 7.3 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 8.6 },
    { type: 'cat', x: 10.05, z: 8.25, facing: 45 },
    { type: 'menuBoard', x: 3.87, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 8.45 },
  ],
}

export default function TeaGardenRoom10(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
