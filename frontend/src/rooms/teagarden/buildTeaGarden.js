import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  POST_HEIGHT,
  WALL,
  WALL_HEIGHT,
  backWall,
  bougainvillea,
  cat,
  door,
  floor,
  fountain,
  geraniumTin,
  lampPost,
  lantern,
  menuBoard,
  oliveTree,
  planeTree,
  planter,
  pool,
  seaEdge,
  sedir,
  shutteredWindow,
  simitCart,
  stringLights,
  teaCounter,
  teaTable,
} from './parts'

// Her ampul zinciri bir nokta ışık ekler; toplam en fazla 4.
const MAX_LAMP_LIGHTS = 4
// Deniz kenarında dikmeler arası en fazla bu kadar açık kalır.
const MAX_BAY = 2.8
const POLE_INSET = 0.3

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Zemine konan eşyalar. spot: önünde mola halkası açılır (distance sayı ya da item'a göre).
const PROPS = {
  tree: { draw: planeTree, spot: { id: 'tree', label: 'Çınar altı', distance: 1.2 } },
  olive: { draw: oliveTree },
  geranium: { draw: geraniumTin },
  cat: { draw: cat },
  sedir: {
    draw: (f, rnd, item) => sedir(f, rnd, item.length, item.sini),
    // sini sehpa varsa halka sehpanın ötesinde açılır
    spot: { id: 'sedir', label: 'Sedir', distance: (item) => (item.sini ? 1.55 : 0.85) },
  },
  menuBoard: { draw: (f) => menuBoard(f) },
  simitCart: { draw: (f) => simitCart(f), spot: { id: 'simit', label: 'Simitçi', distance: 0.95 } },
  planter: { draw: (f, rnd, item) => planter(f, rnd, item.length) },
  pool: { draw: pool },
}

// Arka duvar parçaları; at: x konumu (merkez, tezgâhta sol uç), y: yükseklik.
const DECOR = {
  door: { draw: (f) => door(f) },
  window: { draw: (f, rnd) => shutteredWindow(f, rnd) },
  lantern: { draw: (f, rnd, item) => lantern(f, item.y) },
  vine: { draw: (f, rnd) => bougainvillea(f, rnd) },
  fountain: { draw: (f) => fountain(f), spot: { id: 'fountain', label: 'Çeşme', distance: 0.9 } },
  counter: {
    draw: (f, rnd, item, room) => teaCounter(f, item.length, rnd, room),
    spot: { id: 'counter', label: 'Çay ocağı', distance: 1.1, center: true },
  },
}

// Denize bakan kenardaki dikmeler: iki uçta, her ampul zincirinin hizasında ve aralar
// MAX_BAY'den uzunsa arada.
function postPositions(depth, strings) {
  const zs = [...new Set([0.06, ...strings, depth - 0.06])].sort((a, b) => a - b)
  const result = []
  zs.forEach((z, i) => {
    if (i > 0) {
      const gap = z - zs[i - 1]
      const extra = Math.ceil(gap / MAX_BAY) - 1
      for (let k = 1; k <= extra; k++) result.push(zs[i - 1] + (gap * k) / (extra + 1))
    }
    result.push(z)
  })
  return result
}

/**
 * Çay bahçesi yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   strings: [z]                               ampul zincirleri: sol dikmeden sağdaki fener direğine
 *   decor: [{ type, at, y?, length? }]          arka duvar (DECOR)
 *   tables: [{ x, z, sides, cloth?, extra? }]  masa merkezi; sides: 'back' | 'front' | 'left' | 'right'
 *   props: [{ type, x, z, facing?, length?, sini? }]  zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]               ek mola noktaları
 * }
 * Sol kenar denize bakan korkuluk, arka duvar kahvehane cephesidir.
 */
export function buildTeaGarden(layout) {
  const { width, depth, seed = 1, strings = [] } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [], steams: [], view: { movers: [], gulls: [], twinkles: [] } }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  backWall(root, width, rnd)
  // sol kenarda u = depth - z
  const posts = postPositions(depth, strings).map((z) => depth - z)
  seaEdge(root.frame(0, 0, depth, Math.PI / 2), depth, posts, rnd, room)

  for (const z of strings) {
    lampPost(root.frame(width - POLE_INSET, 0, z))
    stringLights(root, [-0.11, POST_HEIGHT - 0.04, z], [width - POLE_INSET, POST_HEIGHT - 0.02], rnd, room)
  }

  for (const item of layout.decor ?? []) {
    const decor = DECOR[item.type]
    decor.draw(root.frame(item.at, item.y ?? 0, 0), rnd, item, room)
    if (decor.spot) {
      const u = decor.spot.center ? item.length / 2 : 0
      addSpot(decor.spot.id, decor.spot.label, root.point(item.at + u, 0, decor.spot.distance))
    }
  }

  for (const table of layout.tables ?? []) teaTable(root.frame(table.x, 0, table.z), table, rnd, room)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
    prop.draw(f, rnd, item)
    if (prop.spot) {
      const { distance } = prop.spot
      addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, typeof distance === 'function' ? distance(item) : distance))
    }
  }

  for (const { id, label, x, z } of layout.spots ?? []) addSpot(id, label, { x, z })

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    steams: room.steams,
    view: room.view,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width, WALL_HEIGHT + 0.2, depth] },
  }
}
