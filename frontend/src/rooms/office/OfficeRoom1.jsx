import OfficeScene from './OfficeScene'

// 1 kişi · 5x5 · özel geliştirici odası: tek masa, görev panosu, cam kenarında armut koltuk.
const LAYOUT = {
  width: 5,
  depth: 5,
  seed: 1201,
  decor: [
    { type: 'board', at: 1.6, y: 1.45 },
    { type: 'slats', at: 2.9, y: 0.08, length: 1 },
  ],
  pods: [
    { x: 2.95, z: 3.21, back: 1, front: 0 },
  ],
  props: [
    { type: 'credenza', x: 3.4, z: 0.3, length: 1 },
    { type: 'waterCooler', x: 4.45, z: 0.3 },
    { type: 'snakePlant', x: 0.6, z: 1 },
    { type: 'beanBag', x: 0.95, z: 4.05, facing: '+x' },
  ],
  spots: [
    { id: 'window', label: 'Cam kenarı', x: 1, z: 2.9 },
  ],
}

export default function OfficeRoom1(props) {
  return <OfficeScene layout={LAYOUT} {...props} />
}
