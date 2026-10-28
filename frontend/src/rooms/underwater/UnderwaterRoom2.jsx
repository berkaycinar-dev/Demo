import UnderwaterScene from './UnderwaterScene'

// 2 kişi · 6x5.5 · karşılıklı iki koltuk; duvarda dalış giysisi.
const LAYOUT = {
  width: 6,
  depth: 5.5,
  seed: 9102,
  table: { x: 3.2, z: 3.4, back: 1, front: 1, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'suit', at: 2.36 },
    { type: 'sonar', at: 3.7, length: 1.4 },
    { type: 'kelp', at: 5.25, length: 1 },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 4.65 },
  ],
}

export default function UnderwaterRoom2(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
