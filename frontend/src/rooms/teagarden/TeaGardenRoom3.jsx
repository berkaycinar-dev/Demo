import TeaGardenScene from './TeaGardenScene'

// 3 kişi · 6x5.5 · tavlalı ikili masa ve tekli masa, menü panosu, begonvil.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 4103,
  strings: [2.5, 4.3],
  decor: [
    { type: 'counter', at: 0.9, length: 2 },
    { type: 'door', at: 4.05 },
    { type: 'lantern', at: 4.95, y: 2 },
    { type: 'vine', at: 5.55 },
  ],
  tables: [
    { x: 1.4, z: 3.2, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.8, z: 3.4, sides: ['back'], cloth: 'green', extra: 'simit' },
  ],
  props: [
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 5.1 },
    { type: 'cat', x: 5.05, z: 4.75, facing: 45 },
    { type: 'menuBoard', x: 3.07, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 4.95 },
  ],
}

export default function TeaGardenRoom3(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
