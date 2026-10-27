import TeaGardenScene from './TeaGardenScene'

// 6 kişi · 8.5x7 · üç ikili masa, simitçi, çınar altı, zeytin ağacı.
const LAYOUT = {
  width: 8.5,
  depth: 7,
  seed: 4106,
  strings: [3.2, 5.5],
  decor: [
    { type: 'counter', at: 0.9, length: 2.4 },
    { type: 'lantern', at: 3.75, y: 2 },
    { type: 'door', at: 4.6 },
    { type: 'lantern', at: 5.45, y: 2 },
  ],
  tables: [
    { x: 1.4, z: 3.6, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.6, z: 3.9, sides: ['back', 'front'], cloth: 'blue' },
    { x: 5.6, z: 4.3, sides: ['back', 'front'], cloth: 'green', extra: 'simit' },
  ],
  props: [
    { type: 'tree', x: 7.75, z: 0.85 },
    { type: 'simitCart', x: 7.85, z: 4.35, facing: '-x' },
    { type: 'olive', x: 4.6, z: 6.35 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 6.6 },
    { type: 'cat', x: 7.55, z: 6.25, facing: 45 },
    { type: 'menuBoard', x: 3.47, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 6.45 },
  ],
}

export default function TeaGardenRoom6(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
