import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  aquariumWall,
  backWall,
  divingSuit,
  floor,
  galley,
  jellyTank,
  kelpFarm,
  moonPool,
  pressureHatch,
  researchTable,
  sonarConsole,
  specimenShelf,
  surveyCamera,
  tankCage,
  windowBench,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen donanım; at: merkez x. spot: önünde mola halkası açılır.
const WALLS = {
  hatch: { draw: (f, rnd, item, fx) => pressureHatch(f, fx), spot: { id: 'hatch', label: 'Basınç kapısı', distance: 0.95 } },
  suit: { draw: (f) => divingSuit(f) },
  sonar: {
    draw: (f, rnd, item, fx) => sonarConsole(f, item.length, rnd, fx),
    spot: { id: 'sonar', label: 'Sonar paneli', distance: 1.15 },
  },
  galley: { draw: (f, rnd, item, fx) => galley(f, fx), spot: { id: 'galley', label: 'Kahve köşesi', distance: 1.15 } },
  specimens: { draw: (f, rnd, item) => specimenShelf(f, item.length, rnd) },
  kelp: {
    draw: (f, rnd, item) => kelpFarm(f, item.length, rnd),
    spot: { id: 'kelp', label: 'Yosun bahçesi', distance: 1.0 },
  },
}

// Zemine konan eşyalar. upright: dünya eksenine hizalı çizilir (açık ön camları hep kameraya
// dönük kalsın), facing yalnızca mola halkasının yönünü belirler.
const PROPS = {
  jellies: {
    upright: true,
    draw: (f, rnd, item, room, fx) => jellyTank(f, fx),
    spot: { id: 'jellies', label: 'Denizanası tankı', distance: 1.0 },
  },
  camera: { draw: (f) => surveyCamera(f) },
  tanks: { upright: true, draw: (f) => tankCage(f) },
  bench: {
    draw: (f, rnd, item, room) => windowBench(f, item.length, room),
    spot: { id: 'bench', label: 'Seyir bankı', distance: 0.95 },
  },
  moonpool: {
    upright: true,
    draw: (f, rnd, item, room, fx) => moonPool(f, fx, rnd),
    spot: { id: 'moonpool', label: 'Dalış havuzu', distance: 1.4 },
  },
}

/**
 * Sualtı üssü yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   table: { x, z, back, front, ends }     araştırma masası merkezi + koltuk sayıları (ends: 1 sağ uç, 2 iki uç)
 *   wall: [{ type, at, length? }]          arka duvar donanımı (WALLS), at: merkez x
 *   props: [{ type, x, z, facing?, length? }]   zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]           ek mola noktaları
 * }
 * Sol duvar boydan boya akvaryum camıdır.
 */
export function buildUnderwater(layout) {
  const { width, depth, seed = 1, table } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], spinners: [], blinkers: [] })
  const fx = { view: group(), room: group(), steams: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  backWall(root, width)
  aquariumWall(root.frame(0, 0, depth, Math.PI / 2), depth, rnd, fx)

  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, item, fx)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  if (table) researchTable(root.frame(table.x, 0, table.z), table, room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
    prop.draw(prop.upright ? root.frame(item.x, 0, item.z) : f, rnd, item, room, fx)
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
