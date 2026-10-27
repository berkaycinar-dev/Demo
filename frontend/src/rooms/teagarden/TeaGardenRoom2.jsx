import TeaGardenScene from './TeaGardenScene'

// 2 kişi · 5x5 · karşılıklı tavla masası, köşede zeytin ağacı.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 4102,
  strings: [2.6],
  decor: [
    { type: 'counter', at: 0.8, length: 1.9 },
    { type: 'door', at: 3.6 },
    { type: 'lantern', at: 4.45, y: 2 },
  ],
  tables: [
    { x: 1.5, z: 3, sides: ['left', 'right'], cloth: 'blue', extra: 'tavla' },
  ],
  props: [
    { type: 'olive', x: 4.55, z: 1.05 },
    { type: 'geranium', x: 0.4, z: 0.45 },
    { type: 'geranium', x: 0.35, z: 4.6 },
    { type: 'cat', x: 4.05, z: 4.25, facing: 45 },
  ],
  spots: [
    { id: 'sea', label: 'Deniz kenarı', x: 1, z: 4.45 },
  ],
}

export default function TeaGardenRoom2(props) {
  return <TeaGardenScene layout={LAYOUT} {...props} />
}
