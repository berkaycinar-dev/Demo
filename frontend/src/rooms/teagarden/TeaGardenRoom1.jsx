import TeaGardenScene from './TeaGardenScene'

// 1 kişi · 4.5x4.5 · denize bakan tek masa, küçük çay ocağı.
const LAYOUT = {
  width: 4.5,
  depth: 4.5,
  seed: 4101,
  strings: [2.4],
  decor: [
    { type: 'counter', at: 0.8, length: 1.6 },
    { type: 'lantern', at: 2.95, y: 2 },
    { type: 'door', at: 3.7 },
  ],
  tables: [
    { x: 1.3, z: 2.75, sides: ['back'], cloth: 'red', extra: 'simit' },
  ],
  props: [
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 4.1 },
    { type: 'cat', x: 3.55, z: 3.75, facing: 45 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 3.95 },
  ],
}

export default function TeaGardenRoom1(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
