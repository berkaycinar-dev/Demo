import UnderwaterScene from './UnderwaterScene'

// 10 kişi · 11x9 · 4+4+2 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi, cam önü bank, numune rafı, dalış havuzu.
const LAYOUT = {
  width: 11,
  depth: 9,
  seed: 9110,
  table: { x: 5.3, z: 3.6, back: 4, front: 4, ends: 2 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.44 },
    { type: 'sonar', at: 4.37, length: 2.4 },
    { type: 'galley', at: 6.46 },
    { type: 'specimens', at: 7.84, length: 1 },
    { type: 'kelp', at: 9.75, length: 2 },
  ],
  props: [
    { type: 'jellies', x: 10.35, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 4, facing: '-x' },
    { type: 'bench', x: 0.44, z: 6, facing: '+x', length: 2.4 },
    { type: 'tanks', x: 10.4, z: 8.1 },
    { type: 'moonpool', x: 5.6, z: 7.35, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 8.15 },
  ],
}

export default function UnderwaterRoom10(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
