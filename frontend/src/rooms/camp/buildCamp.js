import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  C,
  FLOOR_BOTTOM,
  FOREST,
  SEAT_HEIGHT,
  SHORE,
  SKY_TOP,
  backpack,
  birch,
  bush,
  campChair,
  campfire,
  canoe,
  cooler,
  dock,
  domeTent,
  forest,
  ground,
  hammock,
  lanternPole,
  logBench,
  mushrooms,
  nightSky,
  picnicTable,
  pine,
  ridgeTent,
  rock,
  shoreline,
  signpost,
  stump,
  woodpile,
} from './parts'

// CampfireEffect ateşin kendi ışığını ekler; toplam nokta ışık en fazla 4 kalsın.
const MAX_LAMP_LIGHTS = 3
const DOCK_HALF = 0.5

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Ateş çevresindeki oturaklar; offsets: oturak üzerindeki koltuk konumları (yerel x).
const SEATS = {
  stump: { draw: (f) => stump(f), offsets: [0] },
  chair: { draw: (f, rnd) => campChair(f, rnd), offsets: [0] },
  log: { draw: (f, rnd) => logBench(f, rnd), offsets: [-0.3, 0.3] },
}

// Zemine konan eşyalar. spot: önünde mola halkası açılır.
const PROPS = {
  picnic: { draw: picnicTable, spot: { id: 'picnic', label: 'Piknik masası', distance: 1.2 } },
  woodpile: { draw: woodpile },
  cooler: { draw: (f) => cooler(f) },
  backpack: { draw: backpack },
  canoe: { draw: (f) => canoe(f) },
  hammock: { draw: hammock, spot: { id: 'hammock', label: 'Hamak', distance: 0.85 } },
  signpost: { draw: (f) => signpost(f) },
  bush: { draw: bush },
  rock: { draw: rock },
  mushrooms: { draw: mushrooms },
  pine: { draw: (f, rnd, item) => pine(f, rnd, item.height ?? 3) },
  birch: { draw: (f, rnd, item) => birch(f, rnd, item.height ?? 2.6) },
}

const TENTS = {
  ridge: { draw: ridgeTent, distance: 1.7 },
  dome: { draw: domeTent, distance: 1.25 },
}

/**
 * Kamp yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   fire: { x, z, radius, seats: [{ type: 'log' | 'stump' | 'chair', angle }], tripod?, marshmallow? }
 *        angle derece: 0 = ateşin önü (+z), 180 = arkası; oturanlar ateşe bakar
 *   tents: [{ type: 'ridge' | 'dome', x, z, facing, color, spot? }]
 *   lanterns: [{ x, z, facing? }]              asma fenerli direkler (ışık)
 *   dock: { z }                                göle uzanan iskele
 *   props: [{ type, x, z, facing?, height? }]  zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]               ek mola noktaları
 * }
 * Sol kenar göl, arka kenar orman şeridi; açıklık [0, width] x [0, depth].
 */
export function buildCamp(layout) {
  const { width, depth, seed = 1, fire } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [], fires: [], twinkles: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  ground(root, width, depth, rnd, fire ? [[fire.x, fire.z, fire.radius + 0.75]] : [])
  const dockZ = layout.dock?.z
  shoreline(root, depth, rnd, dockZ === undefined ? [] : [[dockZ - DOCK_HALF - 0.1, dockZ + DOCK_HALF + 0.1]])
  forest(root, width, rnd)
  nightSky(root, width, depth, rnd, room)

  if (fire) {
    campfire(root.frame(fire.x, 0, fire.z), rnd, room, fire)
    for (const { type, angle } of fire.seats) {
      const a = (angle * Math.PI) / 180
      const f = root.frame(fire.x + Math.sin(a) * fire.radius, 0, fire.z + Math.cos(a) * fire.radius, a + Math.PI)
      const seat = SEATS[type]
      seat.draw(f, rnd)
      for (const dx of seat.offsets) {
        room.seats.push({ position: f.point(dx, SEAT_HEIGHT, 0).toArray(), yaw: f.facing() })
      }
    }
  }

  for (const tent of layout.tents ?? []) {
    const f = root.frame(tent.x, 0, tent.z, toYaw(tent.facing ?? '+z'))
    TENTS[tent.type].draw(f, C.tents[tent.color])
    if (tent.spot) addSpot('tent', 'Çadır', f.point(0, 0, TENTS[tent.type].distance))
  }

  for (const { x, z, facing } of layout.lanterns ?? []) lanternPole(root.frame(x, 0, z, toYaw(facing ?? '+z')), room)

  if (dockZ !== undefined) {
    dock(root.frame(0, 0, dockZ), rnd)
    addSpot('dock', 'İskele', { x: 0.85, z: dockZ })
  }

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
    prop.draw(f, rnd, item)
    if (prop.spot) addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
  }

  for (const { id, label, x, z } of layout.spots ?? []) addSpot(id, label, { x, z })

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    fires: room.fires,
    twinkles: room.twinkles,
    fireflies: fireflies(width, depth, rnd),
    bounds: { min: [-SHORE, FLOOR_BOTTOM, -FOREST], max: [width, SKY_TOP, depth] },
  }
}

// Ateş böcekleri orman kenarında ve sazlıkta dolaşır: [{ origin: [x, y, z], phase }].
function fireflies(width, depth, rnd) {
  const list = []
  const count = 6 + Math.round(width)
  for (let i = 0; i < count; i++) {
    const nearShore = i % 3 === 0
    const x = nearShore ? 0.15 + rnd() * 0.4 : 0.4 + rnd() * (width - 0.8)
    const z = nearShore ? 0.4 + rnd() * (depth - 0.8) : 0.15 + rnd() * 0.6
    list.push({ origin: [x, 0.35 + rnd() * 0.8, z], phase: rnd() * Math.PI * 2 })
  }
  return list
}
