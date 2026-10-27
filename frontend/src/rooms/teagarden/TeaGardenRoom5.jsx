import TeaGardenScene from './TeaGardenScene'

// 5 kişi · 7.5x6.5 · ikili ve üçlü masa, simitçi, köşede çınar altı.
const LAYOUT = {
  width: 7.5,
  depth: 6.5,
  seed: 4105,
  strings: [3.2, 5.1],
  decor: [
    { type: 'counter', at: 0.9, length: 2 },
    { type: 'lantern', at: 3.25, y: 2 },
    { type: 'door', at: 4 },
  ],
  tables: [
    { x: 1.4, z: 3.5, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.8, z: 3.8, sides: ['back', 'left', 'right'], cloth: 'blue', extra: 'simit' },
  ],
  props: [
    { type: 'tree', x: 6.75, z: 0.85 },
    { type: 'simitCart', x: 6.85, z: 4.15, facing: '-x' },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 6.1 },
    { type: 'cat', x: 6.55, z: 5.75, facing: 45 },
    { type: 'menuBoard', x: 3.07, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 5.95 },
  ],
}

export default function TeaGardenRoom5(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
