import UnderwaterScene from './UnderwaterScene'

// 9 kişi · 10.5x8.5 · 3 lomboz masası, 6 kişilik yuvarlak sonar masası; basınç kapısı, dalış giysisi, kahve köşesi, numune rafı, yosun bahçesi, lomboz altı kanepe, batiskaflı dalış havuzu, denizanası tankı, tüp kafesi.
const LAYOUT = {
  width: 10.5,
  depth: 8.5,
  seed: 9109,
  back: [
    { type: 'port', at: 0.9, desk: true },
    { type: 'port', at: 2.49, desk: true },
    { type: 'port', at: 4.09, desk: true },
    { type: 'suit', at: 5.33 },
    { type: 'galley', at: 6.39 },
    { type: 'specimens', at: 7.66, length: 1 },
    { type: 'kelp', at: 9.35, length: 1.8 },
  ],
  left: [
    { type: 'hatch', z: 1.55 },
    { type: 'sofa', z: 4.1, length: 2 },
  ],
  table: { x: 6.2, z: 4.35, seats: 6 },
  props: [
    { type: 'jellies', x: 9.85, z: 2.6, facing: '-x' },
    { type: 'moonpool', x: 1.25, z: 7.25, facing: '+x' },
    { type: 'tanks', x: 10, z: 6.2 },
  ],
}

export default function UnderwaterRoom9(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
