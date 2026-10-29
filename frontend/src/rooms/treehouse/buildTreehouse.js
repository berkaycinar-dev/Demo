import { Euler, Quaternion, Vector3 } from 'three'
import { createVoxelBuilder, pick, seededRandom } from '../core/voxel'
import {
  C,
  CANOPY_TOP,
  FLOOR_BOTTOM,
  HATCH_HOLE,
  TRUNK_R,
  WALL,
  backWall,
  cocoaCorner,
  crateShelf,
  cushionNook,
  fairyLights,
  floor,
  hammock,
  hatch,
  kilim,
  stumpTable,
  telescope,
  trunk,
  windowDesk,
  windowWall,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Arka duvar boyunca dizilen parçalar; at: merkez x. spot: önünde mola halkası açılır.
const WALLS = {
  hatch: { draw: (f) => hatch(f), spot: { id: 'hatch', label: 'Giriş', distance: 1.55 } },
  shelf: { draw: (f, rnd, fx) => crateShelf(f, rnd, fx) },
  cocoa: { draw: (f, rnd, fx) => cocoaCorner(f, fx), spot: { id: 'cocoa', label: 'Kakao köşesi', distance: 1.1 } },
}

// Zemine konan eşyalar; dünya eksenine hizalı çizilir, facing yalnızca mola halkasının yönünü
// belirler.
const PROPS = {
  telescope: { draw: (f) => telescope(f), spot: { id: 'telescope', label: 'Teleskop', distance: 0.95 } },
}

/**
 * Ağaç ev yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   trunk: { x, z }                         odayı delip geçen ağaç gövdesi (sağ arka köşe)
 *   hammock: { x, length }                  sol direği x'te, gövdeye bağlı hamak (gövdeyle aynı z)
 *   wall: [{ type, at }]                    arka duvar parçaları (WALLS), at: merkez x; kapak
 *                                           (hatch) zemindeki deliği de açar
 *   windows: [z]                            sol duvardaki pencere merkezleri; her pencerenin
 *                                           altında tabureli masa (1 kişi)
 *   tables: [{ x, z }]                      kütük masa (2 kişi), üstünde asılı fener; hepsinin
 *                                           altında tek kilim
 *   nook: { x, z }                          minder köşesi (2 kişi), isteğe bağlı
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS)
 *   spots: [{ id, label, x, z }]            ek mola noktaları
 * }
 * Lamba ışıkları: gövdedeki fener, ilk pencere masası ve ilk kütük masa; en fazla 3.
 */
export function buildTreehouse(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], swingers: [], pulsers: [], wanderers: [], blinkers: [] })
  const fx = { view: group(), night: group(), room: group(), lit: group(), steams: [] }
  const windows = layout.windows ?? []

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  const entry = (layout.wall ?? []).find((w) => w.type === 'hatch')
  const { half, z0, z1 } = HATCH_HOLE
  floor(root, width, depth, entry && [entry.at - half, entry.at + half, z0, z1])
  backWall(root, width)
  windowWall(
    root.frame(0, 0, depth, Math.PI / 2),
    depth,
    windows.map((z) => depth - z),
    rnd,
    fx,
  )
  const tree = layout.trunk
  fairyLights(root, 0.2, tree.x - TRUNK_R - 0.35, rnd, fx)
  fairyLights(root.frame(0, 0, depth, Math.PI / 2), 0.4, depth - 0.2, rnd, fx)

  for (const item of layout.wall ?? []) {
    const part = WALLS[item.type]
    const f = root.frame(item.at, 0, 0)
    part.draw(f, rnd, fx)
    if (part.spot) addSpot(part.spot.id, part.spot.label, f.point(0, 0, part.spot.distance))
  }

  if (layout.hammock) {
    const { x, length } = layout.hammock
    hammock(root.frame(x, 0, tree.z), length, tree.z, fx)
    addSpot('hammock', 'Hamak', root.point(x + length / 2, 0, tree.z + 1.0))
  }
  trunk(root.frame(tree.x, 0, tree.z), rnd, fx, room, { back: tree.z, reach: Math.min(width * 0.5, 5) })

  windows.forEach((z, i) => windowDesk(root.frame(0, 0, z, Math.PI / 2), room, fx, i === 0))
  const tables = layout.tables ?? []
  tables.forEach(({ x, z }, i) => stumpTable(root.frame(x, 0, z), room, fx, i === 0))
  if (tables.length) {
    const xs = tables.map((t) => t.x)
    const zs = tables.map((t) => t.z)
    kilim(root, Math.min(...xs) - 1.05, Math.min(...zs) - 0.85, Math.max(...xs) + 1.05, Math.max(...zs) + 0.85)
  }
  if (layout.nook) cushionNook(root.frame(layout.nook.x, 0, layout.nook.z), room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    prop.draw(root.frame(item.x, 0, item.z), rnd, fx)
    if (prop.spot) {
      const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
      addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
    }
  }

  for (const { id, label, x, z } of layout.spots ?? []) addSpot(id, label, { x, z })

  outdoors(tree, width, rnd, fx)

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    fx,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL - 0.5], max: [width, CANOPY_TOP - 0.25, depth] },
  }
}

// Yapraklardan gövde boyunca süzülen üç yaprak (fx.lit) ve gece dalların arasında, odanın sağ
// açık kenarında dolaşan ateş böcekleri (fx.night).
function outdoors(tree, width, rnd, fx) {
  for (let i = 0; i < 3; i++) {
    const travel = 3.1
    const quat = new Quaternion().setFromEuler(new Euler(0.3 * rnd(), rnd() * Math.PI, 0.4))
    fx.lit.movers.push({
      items: [{ center: new Vector3(tree.x - 0.9 + 0.7 * i, 3.35, tree.z + 0.65 + 0.35 * rnd()), quat, size: [0.07, 0.006, 0.05], color: pick(rnd, C.fallLeaf) }],
      axis: [0, -1, 0],
      travel,
      period: travel / (0.22 + 0.06 * rnd()),
      phase: i / 3 + 0.1 * rnd(),
      fade: 0.12,
      sway: [0.18, 0, 0.12],
      swayPeriod: 2.6 + rnd(),
      flutter: { axis: [0, 0, 1], amp: 0.9 },
    })
  }
  const spots = [
    [tree.x - 1.4, 3.3, tree.z - 0.6],
    [tree.x - 0.4, 3.5, tree.z - 1.0],
    [tree.x + 0.3, 3.2, tree.z - 0.3],
    [width + 0.35, 2.4, tree.z + 1.2],
    [width + 0.45, 1.5, tree.z + 2.6],
    [width + 0.3, 0.8, tree.z + 1.8],
  ]
  for (const center of spots) {
    fx.night.wanderers.push({ center: new Vector3(...center), quat: new Quaternion(), size: [0.035, 0.035, 0.035], color: C.firefly, amp: [0.3, 0.18, 0.3], phase: rnd() * Math.PI * 2 })
  }
}
