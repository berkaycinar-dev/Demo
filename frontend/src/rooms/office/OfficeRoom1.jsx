import OfficeScene from './OfficeScene'

// 1 kişi · 5x5 · özel geliştirici odası: çift monitörlü tek masa, görev panosu.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 1201,
  decor: [
    { type: 'board', at: 1.4, y: 1.45 },
    { type: 'slats', at: 2.6, y: 0.08, length: 2.2 },
  ],
  pods: [{ x: 2.7, z: 2.75, back: 1 }],
  props: [
    { type: 'credenza', x: 3.7, z: 0.3, length: 1.4 },
    { type: 'waterCooler', x: 4.55, z: 3.0, facing: '-x' },
    { type: 'beanBag', x: 1.0, z: 4.2, facing: 45 },
    { type: 'snakePlant', x: 4.4, z: 4.4 },
    { type: 'snakePlant', x: 0.6, z: 1.0 },
  ],
  spots: [{ id: 'window', label: 'Cam kenarı', x: 1.0, z: 2.9 }],
}

export default function OfficeRoom1(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
