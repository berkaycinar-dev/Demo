import UnderwaterScene from './UnderwaterScene'

// 8 kişi · 10x8 · 2 lomboz masası, 6 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, numune rafı, yosun bahçesi, lomboz altı kanepe, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 10,
  depth: 8,
  seed: 9108,
  back: [
    { type: 'port', at: 0.9, desk: true },
    { type: 'port', at: 2.71, desk: true },
    { type: 'suit', at: 4.17 },
    { type: 'galley', at: 5.46 },
    { type: 'specimens', at: 6.94, length: 1 },
    { type: 'kelp', at: 8.85, length: 1.8 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'sofa', z: 3.9, length: 2 },
  ],
  table: { x: 5.9, z: 4.15, seats: 6 },
  props: [
    { type: 'jellies', x: 9.35, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 6.75, facing: '+x' },
    { type: 'tanks', x: 9.5, z: 5.7 },
  ],
}

export default function UnderwaterRoom8(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
