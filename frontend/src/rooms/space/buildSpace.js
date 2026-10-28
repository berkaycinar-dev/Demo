import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  backWall,
  cargoRack,
  controlConsole,
  dispenser,
  evaSuit,
  exerciseBike,
  floor,
  floorWindow,
  hatch,
  hydroponics,
  missionTable,
  observationWall,
  telescope,
  treadmill,
  windowBench,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen donanım; at: merkez x. spot: önünde mola halkası açılır.
const WALLS = {
  hatch: { draw: (f, rnd, item, fx) => hatch(f, fx), spot: { id: 'airlock', label: 'Hava kilidi', distance: 0.95 } },
  suit: { draw: (f) => evaSuit(f) },
  console: {
    draw: (f, rnd, item, fx) => controlConsole(f, item.length, rnd, fx),
    spot: { id: 'console', label: 'Kontrol paneli', distance: 1.15 },
  },
  dispenser: { draw: (f, rnd, item, fx) => dispenser(f, fx), spot: { id: 'galley', label: 'İkmal köşesi', distance: 1.1 } },
  cargo: { draw: (f, rnd, item) => cargoRack(f, item.length) },
  hydro: {
    draw: (f, rnd, item) => hydroponics(f, item.length, rnd),
    spot: { id: 'garden', label: 'Hidroponik bahçe', distance: 1.0 },
  },
}

// Zemine konan eşyalar.
const PROPS = {
  treadmill: { draw: (f) => treadmill(f), spot: { id: 'treadmill', label: 'Koşu bandı', distance: 1.5 } },
  bench: {
    draw: (f, rnd, item, room) => windowBench(f, item.length, room),
    spot: { id: 'bench', label: 'Dinlenme bankı', distance: 0.95 },
  },
  bike: { draw: (f) => exerciseBike(f) },
  telescope: { draw: (f) => telescope(f) },
  cupola: { draw: (f, rnd) => floorWindow(f, rnd), spot: { id: 'cupola', label: 'Zemin penceresi', distance: 0 } },
}

/**
 * Uzay istasyonu yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   table: { x, z, back, front, ends }     görev masası merkezi + koltuk sayıları (ends: 1 sağ uç, 2 iki uç)
 *   wall: [{ type, at, length? }]          arka duvar donanımı (WALLS), at: merkez x
 *   props: [{ type, x, z, facing?, length? }]   zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]           ek mola noktaları
 * }
 * Sol duvar boydan boya gözlem penceresidir.
 */
export function buildSpace(layout) {
  const { width, depth, seed = 1, table } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const fx = { movers: [], blinkers: [], holos: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  backWall(root, width)
  observationWall(root.frame(0, 0, depth, Math.PI / 2), depth, rnd, fx)

  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, item, fx)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  if (table) missionTable(root.frame(table.x, 0, table.z), table, room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
    prop.draw(f, rnd, item, room)
    if (prop.spot) addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
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
