import UnderwaterScene from './UnderwaterScene'

// 1 kişi · 5x4.5 · 1 lomboz masası; basınç kapısı, yosun bahçesi, denizanası tankı.
const LAYOUT = {
  width: 5,
  depth: 4.5,
  seed: 9101,
  back: [
    { type: 'port', at: 0.9, desk: true },
    { type: 'port', at: 2.7 },
    { type: 'kelp', at: 4.3, length: 0.9 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
  ],
  props: [
    { type: 'jellies', x: 4.35, z: 2.7, facing: '-x' },
  ],
}

export default function UnderwaterRoom1(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
