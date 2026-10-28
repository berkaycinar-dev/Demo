import { createVoxelBuilder, seededRandom } from '../core/voxel'
import {
  FLOOR_BOTTOM,
  WALL,
  armchair,
  bust,
  cardCatalog,
  floor,
  floorLamp,
  globe,
  painting,
  plant,
  quietSign,
  readingTable,
  rug,
  shelfRun,
  sideTable,
  teaCorner,
  vitrine,
  wallClock,
  walls,
  windowBench,
} from './parts'

const WALL_HEIGHT = 3.4
const SHELF_HEIGHT = 2.75
const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }

// Zemine konan eşyalar. spot: önünde mola halkası açılır ({ id, label, distance }).
const PROPS = {
  plant: { draw: (f) => plant(f) },
  globe: { draw: (f) => globe(f) },
  bust: { draw: (f) => bust(f) },
  floorLamp: { draw: (f) => floorLamp(f) },
  sideTable: { draw: (f, rnd) => sideTable(f, rnd) },
  tea: { draw: (f, rnd, room) => teaCorner(f, room), spot: { id: 'tea', label: 'Çay köşesi', distance: 0.95 } },
  armchair: { draw: (f) => armchair(f), spot: { id: 'reading', label: 'Okuma koltuğu', distance: 1 } },
  catalog: { draw: (f) => cardCatalog(f), spot: { id: 'catalog', label: 'Kart kataloğu', distance: 0.9 } },
  vitrine: { draw: (f) => vitrine(f), spot: { id: 'vitrine', label: 'El yazması vitrini', distance: 0.95 } },
}

const DECOR = { clock: (f, room) => wallClock(f, room), painting: (f) => painting(f), sign: (f) => quietSign(f) }

/**
 * Kütüphane yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   windows: [{ at }]                       sol duvar pencereleri (z merkezi)
 *   rug: { x, z, w, d }                     sol-arka köşe + boyut
 *   shelves: [{ from, to, ladders? }]       arka duvar kitaplıkları (x aralığı, merdiven x'leri)
 *   benches: [{ at, length }]               sol duvarda pencere önü bank
 *   tables: [{ x, z, length, depth, back, front }]   merkez + koltuk sayıları
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS)
 *   decor: [{ type, wall, at, y }]          duvar süsleri (DECOR)
 *   spots: [{ id, label, x, z }]            ek mola noktaları
 * }
 */
export function buildLibrary(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [], steams: [], clocks: [] }

  const addSpot = (id, label, point) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z] })
  }

  floor(root, width, depth, rnd)
  walls(root, width, depth, WALL_HEIGHT, layout.windows)

  if (layout.rug) {
    const { x, z, w, d } = layout.rug
    rug(root.frame(x, 0, z), w, d)
  }

  for (const { from, to, ladders = [] } of layout.shelves ?? []) {
    shelfRun(root.frame(from, 0, 0), to - from, SHELF_HEIGHT, rnd, {
      ladders: ladders.map((x) => x - from),
    })
  }

  for (const { at, length } of layout.benches ?? []) {
    const f = root.frame(0, 0, at + length / 2, Math.PI / 2)
    windowBench(f, length)
    addSpot('window', 'Pencere kenarı', f.point(length / 2, 0, 1.05))
  }

  for (const table of layout.tables ?? []) {
    readingTable(root.frame(table.x - table.length / 2, 0, table.z - table.depth / 2), table, rnd, room)
  }

  for (const { type, x, z, facing = '+z' } of layout.props ?? []) {
    const prop = PROPS[type]
    const f = root.frame(x, 0, z, FACING[facing])
    prop.draw(f, rnd, room)
    if (prop.spot) addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance))
  }

  for (const { type, wall, at, y } of layout.decor ?? []) {
    const f = wall === 'left' ? root.frame(0, y, at, Math.PI / 2) : root.frame(at, y, 0)
    DECOR[type](f, room)
  }

  for (const { id, label, x, z } of layout.spots ?? []) {
    addSpot(id, label, { x, z })
  }

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    steams: room.steams,
    clocks: room.clocks,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width, WALL_HEIGHT + 0.05, depth] },
  }
}
