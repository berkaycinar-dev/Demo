import TeaGardenScene from './TeaGardenScene'

// 9 kişi · 10.5x8.5 · dört masa, mermer çeşme, denize bakan sedir köşesi, simitçi, süs havuzu, çınar altı.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 4109,
  strings: [3.4, 6.3],
  decor: [
    { type: 'counter', at: 0.9, length: 2.6 },
    { type: 'door', at: 4.45 },
    { type: 'lantern', at: 5.35, y: 2 },
    { type: 'fountain', at: 6.55 },
  ],
  tables: [
    { x: 1.4, z: 3.7, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.8, z: 4, sides: ['back', 'left', 'right'], cloth: 'blue', extra: 'simit' },
    { x: 6.2, z: 4.3, sides: ['back', 'front'], cloth: 'green' },
    { x: 1.6, z: 6.5, sides: ['back', 'right'], cloth: 'blue' },
  ],
  props: [
    { type: 'tree', x: 9.75, z: 0.85 },
    { type: 'sedir', x: 10.12, z: 4.85, facing: '-x', length: 1.8, sini: true },
    { type: 'simitCart', x: 4.9, z: 7.45, facing: '-z' },
    { type: 'planter', x: 7.4, z: 8.2, length: 2 },
    { type: 'pool', x: 7.4, z: 6.75 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 8.1 },
    { type: 'cat', x: 9.55, z: 7.75, facing: 45 },
    { type: 'menuBoard', x: 3.67, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 7.95 },
  ],
}

export default function TeaGardenRoom9(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
