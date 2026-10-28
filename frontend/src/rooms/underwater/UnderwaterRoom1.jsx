import UnderwaterScene from './UnderwaterScene'

// 1 kişi · 5x4.5 · tek kişilik araştırma masası; basınç kapısı, sonar paneli, yosun bahçesi.
const LAYOUT = {
  width: 5,
  depth: 4.5,
  seed: 9101,
  table: { x: 2.75, z: 2.95, back: 1, front: 0, ends: 0 },
  wall: [
    { type: 'hatch', at: 0.87 },
    { type: 'sonar', at: 2.74, length: 1.4 },
    { type: 'kelp', at: 4.25, length: 1 },
  ],
  spots: [
    { id: 'window', label: 'Akvaryum camı', x: 0.85, z: 3.65 },
  ],
}

export default function UnderwaterRoom1(props) {
  return <UnderwaterScene layout={LAYOUT} {...props} />
}
