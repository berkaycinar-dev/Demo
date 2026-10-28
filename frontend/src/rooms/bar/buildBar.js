import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  COUNTER_Z,
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  backBar,
  backWall,
  barCounter,
  bigPlant,
  booth,
  dartboard,
  entryDoor,
  floor,
  jukebox,
  poolTable,
  roundTable,
  windowWall,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen parçalar; at: merkez x. spot: önünde mola halkası açılır.
const WALLS = {
  door: { draw: (f) => entryDoor(f), spot: { id: 'door', label: 'Giriş', distance: 0.95 } },
  darts: { draw: (f) => dartboard(f), spot: { id: 'darts', label: 'Dart', distance: 2.1 } },
  jukebox: { draw: (f, rnd, fx) => jukebox(f, fx), spot: { id: 'jukebox', label: 'Müzik kutusu', distance: 1.05 } },
}

// Zemine konan eşyalar; dünya eksenine hizalı çizilir, facing yalnızca mola halkasının yönünü
// belirler.
const PROPS = {
  pool: { draw: (f) => poolTable(f), spot: { id: 'pool', label: 'Bilardo masası', distance: 1.15 } },
  plant: { draw: (f) => bigPlant(f) },
}

/**
 * Bar yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   counter: { x, length, stools }         bar tezgâhı merkezi x, uzunluk, tabure sayısı; arkasında
 *                                           aynı uzunlukta arka bar (raflar, espresso, neon tabela)
 *   wall: [{ type, at }]                    arka duvar parçaları (WALLS), at: merkez x
 *   windows: [z]                            sol duvardaki pencere merkezleri
 *   booths: [z]                             pencere altında sol duvara dik sedirler (2 kişi)
 *   tables: [{ x, z }]                      yuvarlak masa (2 kişi), üstünde tavan vantilatörü
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]            ek mola noktaları
 * }
 * Lamba ışıkları: tezgâh, ilk sedir ve masa; en fazla 3.
 */
export function buildBar(layout) {
  const { width, depth, seed = 1, counter } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], spinners: [], blinkers: [], pulsers: [] })
  const fx = { view: group(), room: group(), lit: group(), steams: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth)
  backWall(root, width)
  windowWall(
    root.frame(0, 0, depth, Math.PI / 2),
    depth,
    (layout.windows ?? []).map((z) => depth - z),
    rnd,
    fx,
  )

  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, fx)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  if (counter) {
    backBar(root.frame(counter.x, 0, 0), counter.length, rnd, fx)
    barCounter(root.frame(counter.x, 0, COUNTER_Z), counter, room, fx)
  }
  ;(layout.booths ?? []).forEach((z, i) => booth(root.frame(0, 0, z), room, fx, i === 0))
  for (const { x, z } of layout.tables ?? []) roundTable(root.frame(x, 0, z), room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    prop.draw(root.frame(item.x, 0, item.z), rnd, fx)
    if (prop.spot) {
      const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
      addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
    }
  }

  for (const { id, label, x, z } of layout.spots ?? []) addSpot(id, label, { x, z })

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    fx,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width, WALL_HEIGHT + 0.04, depth] },
  }
}
