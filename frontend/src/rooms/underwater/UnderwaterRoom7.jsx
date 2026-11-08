import UnderwaterScene from './UnderwaterScene'

// 7 kişi · 9.5x7.5 · 1 lomboz masası, 6 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, numune rafı, yosun bahçesi, lomboz altı kanepe, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 9.5,
  depth: 7.5,
  seed: 9107,
  back: [
    { type: 'port', at: 0.9, desk: true },
    { type: 'port', at: 2.65 },
    { type: 'suit', at: 4.05 },
    { type: 'galley', at: 5.28 },
    { type: 'specimens', at: 6.7, length: 1 },
    { type: 'kelp', at: 8.45, length: 1.6 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'sofa', z: 3.7, length: 1.8 },
  ],
  table: { x: 5.6, z: 3.95, seats: 6 },
  props: [
    { type: 'jellies', x: 8.85, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 6.25, facing: '+x' },
    { type: 'tanks', x: 9, z: 5.2 },
  ],
}

export default function UnderwaterRoom7(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
