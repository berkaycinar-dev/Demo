import UnderwaterScene from './UnderwaterScene'

// 7 kişi · 9.5x7.5 · 3+3+1 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi, cam önü bank, numune rafı, dalış havuzu.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 9107,
  table: { x: 4.5, z: 3.5, back: 3, front: 3, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.3 },
    { type: 'sonar', at: 3.89, length: 2 },
    { type: 'galley', at: 5.64 },
    { type: 'specimens', at: 6.88, length: 1 },
    { type: 'kelp', at: 8.45, length: 1.6 },
  ],
  props: [
    { type: 'jellies', x: 8.85, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3.4, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5, facing: '+x', length: 2 },
    { type: 'tanks', x: 8.9, z: 6.6 },
    { type: 'moonpool', x: 5, z: 6.3, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 6.65 },
  ],
}

export default function UnderwaterRoom7(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
