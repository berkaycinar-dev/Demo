import UnderwaterScene from './UnderwaterScene'

// 9 kişi · 10.5x8.5 · 4+4+1 araştırma masası; denizanası tankı, gözlem kamerası, tüp kafesi, cam önü bank, numune rafı, dalış havuzu.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 9109,
  table: { x: 4.9, z: 3.5, back: 4, front: 4, ends: 1 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.38 },
    { type: 'sonar', at: 4.25, length: 2.4 },
    { type: 'galley', at: 6.28 },
    { type: 'specimens', at: 7.6, length: 1 },
    { type: 'kelp', at: 9.35, length: 1.8 },
  ],
  props: [
    { type: 'jellies', x: 9.85, z: 2.5, facing: '-x' },
    { type: 'camera', x: 0.8, z: 3.8, facing: '-x' },
    { type: 'bench', x: 0.44, z: 5.75, facing: '+x', length: 2.2 },
    { type: 'tanks', x: 9.9, z: 7.6 },
    { type: 'moonpool', x: 5.4, z: 7, facing: '-x' },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 7.65 },
  ],
}

export default function UnderwaterRoom9(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
