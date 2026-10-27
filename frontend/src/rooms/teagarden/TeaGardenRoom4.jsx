import TeaGardenScene from './TeaGardenScene'

// 4 kişi · 7x6 · tavlalı masa ve ikili masa, menü panosu, begonvil, zeytin ağacı.
const LAYOUT = {
  width: 7,
  depth: 6,
  seed: 4104,
  strings: [2.4, 4.4],
  decor: [
    { type: 'counter', at: 0.9, length: 2.2 },
    { type: 'door', at: 4.25 },
    { type: 'lantern', at: 5.15, y: 2 },
    { type: 'vine', at: 6.45 },
  ],
  tables: [
    { x: 1.4, z: 3.3, sides: ['back', 'front'], cloth: 'red', extra: 'tavla' },
    { x: 3.8, z: 3.5, sides: ['back', 'right'], cloth: 'blue', extra: 'simit' },
  ],
  props: [
    { type: 'olive', x: 6.5, z: 3.4 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 5.6 },
    { type: 'cat', x: 6.05, z: 5.25, facing: 45 },
    { type: 'menuBoard', x: 3.27, z: 0.95, facing: 20 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 5.45 },
  ],
}

export default function TeaGardenRoom4(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
