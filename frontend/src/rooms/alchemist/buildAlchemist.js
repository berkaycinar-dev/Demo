import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  alchemyBench,
  archDoor,
  backWall,
  bookshelf,
  cauldron,
  crystalBall,
  floor,
  orrery,
  potionCabinet,
  readingCorner,
  readingDesk,
  rug,
  sconce,
  studyTable,
  windowWall,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen parçalar; at: merkez x. spot: önünde mola halkası açılır.
// İlk iksir dolabının tepesinde baykuş oturur.
const WALLS = {
  door: { draw: (f) => archDoor(f), spot: { id: 'door', label: 'Giriş', distance: 1.0 } },
  books: { draw: (f, rnd, fx) => bookshelf(f, rnd, fx) },
  potions: { draw: (f, rnd, fx, first) => potionCabinet(f, rnd, fx, first) },
  bench: { draw: (f, rnd, fx) => alchemyBench(f, rnd, fx), spot: { id: 'bench', label: 'Simya tezgâhı', distance: 1.25 } },
  sconce: { draw: (f, rnd, fx) => sconce(f, fx) },
}

// Zemine konan eşyalar; dünya eksenine hizalı çizilir, facing yalnızca mola halkasının yönünü
// belirler.
const PROPS = {
  cauldron: {
    draw: (f, rnd, fx, room, item) => cauldron(f, rnd, fx, room, item.z),
    spot: { id: 'cauldron', label: 'Kazan', distance: 1.2 },
  },
  crystal: { draw: (f, rnd, fx, room) => crystalBall(f, fx, room), spot: { id: 'crystal', label: 'Kristal küre', distance: 1.25 } },
  orrery: { draw: (f, rnd, fx) => orrery(f, fx) },
}

/**
 * Simyacı odası yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   wall: [{ type, at }]                    arka duvar parçaları (WALLS), at: merkez x
 *   windows: [z]                            sol duvardaki sivri kemerli pencereler; her birinin
 *                                           altında okuma masası (1 kişi)
 *   tables: [{ x, z }]                      meşe çalışma masası (2 kişi), üstünde süzülen mumlar;
 *                                           hepsinin altında tek halı
 *   corner: { x, z }                        berjerli okuma köşesi (2 kişi), isteğe bağlı
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS): kazan, kristal küre, gök küresi
 *   spots: [{ id, label, x, z }]            ek mola noktaları
 * }
 * Lamba ışıkları (renkli): kazan yeşil, kristal küre mor, ilk çalışma masası (yoksa ilk pencere
 * masası) mum sarısı; en fazla 3.
 */
export function buildAlchemist(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], spinners: [], swingers: [], pulsers: [], wanderers: [], blinkers: [] })
  const fx = { view: group(), night: group(), room: group(), lit: group(), mist: group(), steams: [] }
  const tables = layout.tables ?? []

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  backWall(root, width, rnd)
  windowWall(
    root.frame(0, 0, depth, Math.PI / 2),
    depth,
    (layout.windows ?? []).map((z) => depth - z),
    rnd,
    fx,
  )

  let cabinets = 0
  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, fx, item.type === 'potions' && cabinets++ === 0)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    prop.draw(root.frame(item.x, 0, item.z), rnd, fx, room, item)
    if (prop.spot) {
      const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
      addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
    }
  }

  ;(layout.windows ?? []).forEach((z, i) => readingDesk(root.frame(0, 0, z, Math.PI / 2), room, fx, i === 0 && !tables.length))
  tables.forEach(({ x, z }, i) => studyTable(root.frame(x, 0, z), room, fx, i === 0))
  if (tables.length) {
    const xs = tables.map((t) => t.x)
    const zs = tables.map((t) => t.z)
    rug(root, Math.min(...xs) - 1.05, Math.min(...zs) - 0.95, Math.max(...xs) + 1.05, Math.max(...zs) + 0.95)
  }
  if (layout.corner) readingCorner(root.frame(layout.corner.x, 0, layout.corner.z), room, fx)

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
