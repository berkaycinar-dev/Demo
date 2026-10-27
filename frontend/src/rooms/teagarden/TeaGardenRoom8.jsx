import TeaGardenScene from './TeaGardenScene'

// 8 kişi · 9.5x8 · dört ikili masa, pencere önünde sedir, simitçi, süs havuzu, çiçeklik.
const LAYOUT = {
  width: 9.5,
  depth: 8,
  seed: 4108,
  strings: [3.3, 6.1],
  decor: [
    { type: 'counter', at: 0.9, length: 2.6 },
    { type: 'door', at: 4.75 },
    { type: 'lantern', at: 5.65, y: 2 },
    { type: 'window', at: 7.05, y: 1.1 },
    { type: 'vine', at: 8.85 },
  ],
  tables: [
    { x: 1.4, z: 3.6, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.7, z: 3.9, sides: ['back', 'front'], cloth: 'blue' },
    { x: 3.8, z: 6.3, sides: ['left', 'right'], cloth: 'green', extra: 'simit' },
    { x: 6.2, z: 4.3, sides: ['back', 'front'], cloth: 'red' },
  ],
  props: [
    { type: 'sedir', x: 7.05, z: 0.36, length: 1.8, sini: true },
    { type: 'simitCart', x: 8.85, z: 4.7, facing: '-x' },
    { type: 'planter', x: 6.6, z: 7.7, length: 2 },
    { type: 'olive', x: 1.25, z: 5.7 },
    { type: 'pool', x: 6.4, z: 6.3 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 7.6 },
    { type: 'cat', x: 8.55, z: 7.25, facing: 45 },
    { type: 'menuBoard', x: 3.67, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 7.45 },
  ],
}

export default function TeaGardenRoom8(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
