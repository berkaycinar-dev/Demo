import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  backWall,
  beanBag,
  coffeeBar,
  coffeeTable,
  column,
  credenza,
  dashboardTv,
  deskPod,
  floor,
  glassWall,
  pingPong,
  slatPanel,
  snakePlant,
  sofa,
  taskBoard,
  waterCooler,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Zemine konan eşyalar. spot: önünde mola halkası açılır.
const PROPS = {
  sofa: { draw: sofa, spot: { id: 'lounge', label: 'Lounge', distance: 1.0 } },
  coffeeTable: { draw: coffeeTable },
  beanBag: { draw: beanBag },
  pingPong: { draw: pingPong, spot: { id: 'pingpong', label: 'Masa tenisi', distance: 1.15 } },
  snakePlant: { draw: snakePlant },
  credenza: { draw: (f, rnd, item) => credenza(f, rnd, item.length) },
  waterCooler: { draw: waterCooler, spot: { id: 'water', label: 'Su sebili', distance: 0.7 } },
}

// Arka duvar süsleri; at: x konumu (merkez, panel ve barda sol uç), y: yükseklik.
const DECOR = {
  board: { draw: (f, rnd) => taskBoard(f, rnd), spot: { id: 'board', label: 'Görev panosu', distance: 1.1 } },
  tv: { draw: (f, rnd) => dashboardTv(f, rnd) },
  slats: { draw: (f, rnd, item) => slatPanel(f, item.length, item.height ?? WALL_HEIGHT - 0.3) },
  coffeeBar: {
    draw: (f, rnd, item, room) => coffeeBar(f, item.length, room),
    spot: { id: 'coffee', label: 'Kahve köşesi', distance: 1.15, center: true },
  },
}

/**
 * Ofis yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   columns: [{ x, z }]                    yapısal kolonlar (sol-arka köşedeki her zaman var)
 *   rugs: [{ x, z, w, d, color }]          sol-arka köşe + boyut
 *   pods: [{ x, z, back, front }]          masa grubu merkezi + koltuk sayıları
 *   props: [{ type, x, z, facing?, length? }]   zemin eşyaları (PROPS)
 *   decor: [{ type, at, y, length? }]      arka duvar süsleri (DECOR)
 *   spots: [{ id, label, x, z }]           ek mola noktaları
 * }
 * Sol duvar boydan boya cam cephedir.
 */
export function buildOffice(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [], blinkers: [], steams: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  backWall(root, width)
  glassWall(root.frame(0, 0, depth, Math.PI / 2), depth, rnd, room)
  for (const { x, z } of [{ x: 0, z: 0 }, ...(layout.columns ?? [])]) column(root.frame(x, 0, z))

  for (const { x, z, w, d, color } of layout.rugs ?? []) {
    root.box(x, 0, z, w, 0.012, d, color)
  }

  for (const item of layout.decor ?? []) {
    const decor = DECOR[item.type]
    const f = root.frame(item.at, item.y ?? 0, 0)
    decor.draw(f, rnd, item, room)
    if (decor.spot) {
      const u = decor.spot.center ? item.length / 2 : 0
      addSpot(decor.spot.id, decor.spot.label, root.point(item.at + u, 0, decor.spot.distance))
    }
  }

  for (const pod of layout.pods ?? []) deskPod(root.frame(pod.x, 0, pod.z), pod, rnd, room)

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
    blinkers: room.blinkers,
    steams: room.steams,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width, WALL_HEIGHT + 0.03, depth] },
  }
}
