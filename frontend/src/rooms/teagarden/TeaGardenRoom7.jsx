import TeaGardenScene from './TeaGardenScene'

// 7 kişi · 9x7.5 · üç masa, mermer çeşme, denize bakan sedir köşesi, simitçi, çınar altı.
const LAYOUT = {
  width: 9,
  depth: 7.5,
  seed: 4107,
  strings: [3.3, 5.8],
  decor: [
    { type: 'counter', at: 0.9, length: 2.4 },
    { type: 'door', at: 4.3 },
    { type: 'fountain', at: 5.7 },
  ],
  tables: [
    { x: 1.4, z: 3.7, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.7, z: 4, sides: ['back', 'left', 'right'], cloth: 'blue', extra: 'simit' },
    { x: 5.9, z: 4.4, sides: ['back', 'front'], cloth: 'green' },
  ],
  props: [
    { type: 'tree', x: 8.25, z: 0.85 },
    { type: 'sedir', x: 8.62, z: 4.55, facing: '-x', length: 1.8, sini: true },
    { type: 'simitCart', x: 4.6, z: 6.75, facing: '-z' },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 7.1 },
    { type: 'cat', x: 8.05, z: 6.75, facing: 45 },
    { type: 'menuBoard', x: 3.47, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 6.95 },
  ],
}

export default function TeaGardenRoom7(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
