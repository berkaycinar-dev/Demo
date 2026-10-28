import UnderwaterScene from './UnderwaterScene'

// 8 kişi · 10x8 · 3+3+2 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi, cam önü bank, numune rafı, dalış havuzu.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 9108,
  table: { x: 4.9, z: 3.4, back: 3, front: 3, ends: 2 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.32 },
    { type: 'sonar', at: 4.03, length: 2.2 },
    { type: 'galley', at: 5.9 },
    { type: 'specimens', at: 7.16, length: 1 },
    { type: 'kelp', at: 8.85, length: 1.8 },
  ],
  props: [
    { type: 'jellies', x: 9.35, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3.6, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5.4, facing: '+x', length: 2.2 },
    { type: 'tanks', x: 9.4, z: 7.1 },
    { type: 'moonpool', x: 5.3, z: 6.6, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 7.15 },
  ],
}

export default function UnderwaterRoom8(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
