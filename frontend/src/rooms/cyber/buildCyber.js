import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  backWall,
  blastDoor,
  dataStream,
  dataWall,
  droneDock,
  floor,
  holoTable,
  lounge,
  podDesk,
  serverRacks,
  terrarium,
  vendingMachine,
  vrStation,
  windowWall,
} from './parts'

const MAX_LAMP_LIGHTS = 4
// Panoramik pencerenin ön ve arka kenara uzaklığı (sol duvar).
const WINDOW_FRONT = 0.55
const WINDOW_BACK = 0.35

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen parçalar; at: merkez x. spot: önünde mola halkası açılır.
const WALLS = {
  door: { draw: (f, rnd, fx) => blastDoor(f, fx), spot: { id: 'door', label: 'Giriş', distance: 1.0 } },
  racks: { draw: (f, rnd, fx) => serverRacks(f, rnd, fx) },
  datawall: { draw: (f, rnd, fx) => dataWall(f, rnd, fx), spot: { id: 'datawall', label: 'Veri duvarı', distance: 1.15 } },
  dock: { draw: (f, rnd, fx) => droneDock(f, fx) },
  stream: { draw: (f, rnd, fx) => dataStream(f, rnd, fx) },
  vending: {
    draw: (f, rnd, fx, room) => vendingMachine(f, rnd, fx, room),
    spot: { id: 'vending', label: 'Ramen otomatı', distance: 1.26 },
  },
}

// Zemine konan eşyalar; dünya eksenine hizalı çizilir, facing yalnızca mola halkasının yönünü
// belirler.
const PROPS = {
  vr: { draw: (f, fx) => vrStation(f, fx), spot: { id: 'vr', label: 'VR istasyonu', distance: 1.1 } },
  terrarium: { draw: (f) => terrarium(f) },
}

/**
 * Siber Loft yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   wall: [{ type, at }]                    arka duvar parçaları (WALLS), at: merkez x
 *   pods: [z]                               sol duvardaki panoramik pencerenin önünde kapsül masa (1 kişi)
 *   tables: [{ x, z }]                      hologram masası (2 kişi)
 *   lounge: { x, z }                        yumurta koltuklu lounge (2 kişi), isteğe bağlı
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]            ek mola noktaları
 * }
 * Lamba ışıkları (renkli): ilk kapsül masa eflatun, ramen otomatı kehribar, ilk hologram masası
 * camgöbeği; en fazla 3.
 */
export function buildCyber(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], spinners: [], bars: [], blinkers: [] })
  const fx = { view: group(), room: group(), lit: group(), steams: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth)
  backWall(root, width)
  windowWall(root.frame(0, 0, depth, Math.PI / 2), depth, WINDOW_FRONT, depth - WINDOW_BACK, rnd, fx)

  ;(layout.pods ?? []).forEach((z, i) => podDesk(root.frame(0, 0, z, Math.PI / 2), room, fx, i === 0))

  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, fx, room)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  ;(layout.tables ?? []).forEach(({ x, z }, i) => holoTable(root.frame(x, 0, z), room, fx, i === 0))
  if (layout.lounge) lounge(root.frame(layout.lounge.x, 0, layout.lounge.z), room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    prop.draw(root.frame(item.x, 0, item.z), fx)
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
