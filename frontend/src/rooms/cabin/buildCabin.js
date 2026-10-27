import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  C,
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  armchair,
  braidedRug,
  coatRack,
  cocoaCorner,
  farmTable,
  firPlant,
  fireplace,
  firewood,
  floor,
  furRug,
  guitar,
  logWall,
  sconce,
  skis,
  sofa,
  wallShelf,
  windowSeat,
} from './parts'

// FireEffect kendi ışığını ekler; toplam nokta ışık en fazla 4 kalsın.
const MAX_LAMP_LIGHTS = 3
const WINDOW_WIDTH = 1.0

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece (çapraz yerleşim için)
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

// Zemine konan eşyalar. spot: önünde mola halkası açılır.
const PROPS = {
  firewood: { draw: firewood },
  plant: { draw: firPlant },
  armchair: { draw: (f, rnd, item) => armchair(f, item.color) },
  sofa: { draw: sofa, spot: { id: 'sofa', label: 'Kanepe', distance: 0.95 } },
  cocoa: { draw: cocoaCorner, spot: { id: 'cocoa', label: 'Kakao köşesi', distance: 0.95 } },
  skis: { draw: skis },
  guitar: { draw: guitar },
  coatRack: { draw: coatRack },
}

// Duvar süsleri; at: duvar boyunca konum (raf için sol uç), y: yükseklik.
const DECOR = {
  sconce: (f) => sconce(f),
  shelf: (f, rnd, item) => wallShelf(f, item.length, rnd),
}

/**
 * Dağ evi yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   windows: [{ wall: 'left' | 'back', at }]   pencere merkezi (sol duvarda z, arkada x)
 *   fireplace: { x }                           arka duvardaki taş şömine
 *   rugs: [{ type: 'fur' | 'braided', x, z, w, d }]   fur: merkez, braided: sol-arka köşe
 *   windowSeats: [{ at, length }]              sol duvarda pencere önü oturma
 *   tables: [{ x, z, length, depth, back, front }]   merkez + koltuk sayıları (front = bank)
 *   props: [{ type, x, z, facing?, color? }]   zemin eşyaları (PROPS)
 *   decor: [{ type, wall, at, y, length? }]    duvar süsleri (DECOR)
 * }
 */
export function buildCabin(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [], fires: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }
  const openings = (wall, toU) =>
    (layout.windows ?? [])
      .filter((w) => w.wall === wall)
      .map(({ at }) => [toU(at) - WINDOW_WIDTH / 2, toU(at) + WINDOW_WIDTH / 2])

  floor(root, width, depth, rnd)
  // arka duvar x = -WALL'dan başlar (köşe), sol duvarda u = depth - z
  logWall(root.frame(-WALL, 0, 0), width + WALL, openings('back', (x) => x + WALL), 'end', rnd)
  logWall(root.frame(0, 0, depth, Math.PI / 2), depth, openings('left', (z) => depth - z), 'start', rnd)
  root.box(0, 0, 0, 0.16, WALL_HEIGHT, 0.16, C.logs[1])

  for (const rug of layout.rugs ?? []) {
    if (rug.type === 'fur') furRug(root.frame(rug.x, 0, rug.z), rug.w, rug.d)
    else braidedRug(root.frame(rug.x, 0, rug.z), rug.w, rug.d)
  }

  if (layout.fireplace) {
    const f = root.frame(layout.fireplace.x, 0, 0)
    fireplace(f, rnd, room)
    addSpot('fireplace', 'Şömine başı', f.point(0, 0, 1.55))
  }

  for (const { at, length } of layout.windowSeats ?? []) {
    const f = root.frame(0, 0, at + length / 2, Math.PI / 2)
    windowSeat(f, length)
    addSpot('window', 'Pencere kenarı', f.point(length / 2, 0, 1.05))
  }

  for (const table of layout.tables ?? []) {
    farmTable(root.frame(table.x - table.length / 2, 0, table.z - table.depth / 2), table, rnd, room)
  }

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
    prop.draw(f, rnd, item)
    if (prop.spot) addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
  }

  for (const item of layout.decor ?? []) {
    const f = item.wall === 'left' ? root.frame(0, item.y, item.at, Math.PI / 2) : root.frame(item.at, item.y, 0)
    DECOR[item.type](f, rnd, item)
  }

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    fires: room.fires,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width + 0.02, WALL_HEIGHT, depth] },
  }
}
