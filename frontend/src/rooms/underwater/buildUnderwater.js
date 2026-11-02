import { createVoxelBuilder, seededRandom } from '../core/voxel'
import { stations } from '../core/stations'
import {
  FLOOR_BOTTOM,
  WALL,
  WALL_HEIGHT,
  backWall,
  divingSuit,
  floor,
  galley,
  jellyTank,
  kelpFarm,
  leftWall,
  moonPool,
  portDesk,
  pressureHatch,
  sofa,
  sonarTable,
  specimenShelf,
  tankCage,
} from './parts'

const MAX_LAMP_LIGHTS = 4

const FACING = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 }
// facing: '+z' | '+x' | '-z' | '-x' ya da derece
const toYaw = (facing) => (typeof facing === 'number' ? (facing * Math.PI) / 180 : FACING[facing])

const PORT_SPOT = { id: 'window', label: 'Lomboz', distance: 0.9 }

// Duvar donanımı (arka ve sol duvar); f: duvar dibinde parçanın ortası, +z odanın içi.
// port: lomboz (desk: altında tek kişilik masa, yoksa önünde mola halkası). spot: önünde mola
// halkası açılır.
const WALLS = {
  port: { port: true },
  hatch: { draw: (f, rnd, item, fx) => pressureHatch(f, fx) },
  suit: { draw: (f) => divingSuit(f) },
  galley: { draw: (f, rnd, item, fx) => galley(f, fx), spot: { id: 'galley', label: 'Kahve köşesi', distance: 1.15 } },
  specimens: { draw: (f, rnd, item) => specimenShelf(f, item.length, rnd) },
  kelp: {
    draw: (f, rnd, item) => kelpFarm(f, item.length, rnd),
    spot: { id: 'kelp', label: 'Yosun bahçesi', distance: 1.0 },
  },
  // lomboz altı kanepe: üstünde lomboz
  sofa: {
    port: true,
    draw: (f, rnd, item) => sofa(f, item.length),
    spot: {
      id: 'bench',
      label: 'Lomboz kanepesi',
      distance: 1.25,
      stations: (item) => [-1, 1].map((s) => [s * Math.min(0.4, item.length / 4), 0.46, 0.4]),
    },
  },
}

// Zemine konan eşyalar; dünya eksenine hizalı çizilir (açık ön camları hep kameraya dönük kalsın),
// facing yalnızca mola halkasının yönünü belirler.
const PROPS = {
  jellies: {
    draw: (f, rnd, fx) => jellyTank(f, fx),
    spot: { id: 'jellies', label: 'Denizanası tankı', distance: 1.0 },
  },
  tanks: { draw: (f) => tankCage(f) },
  moonpool: {
    draw: (f, rnd, fx) => moonPool(f, fx, rnd),
    spot: { id: 'moonpool', label: 'Dalış havuzu', distance: 1.5 },
  },
}

/**
 * Sualtı üssü yerleşim tanımını voxel katmanlarına, koltuklara ve mola noktalarına çevirir.
 *
 * layout = {
 *   width, depth, seed,
 *   back: [{ type, at, length?, desk? }]    arka duvar donanımı (WALLS), at: merkez x
 *   left: [{ type, z, length? }]            sol duvar donanımı (WALLS), z: merkez
 *   table: { x, z, seats }                  yuvarlak sonar masası ve çevresindeki koltuklar
 *   props: [{ type, x, z, facing? }]        zemin eşyaları (PROPS)
 * }
 * İki duvarda da lombozlar (port, sofa) açılır; arkalarında deniz. Lamba ışıkları: sonar masası ve
 * ilk lomboz masası.
 */
export function buildUnderwater(layout) {
  const { width, depth, seed = 1 } = layout
  const rnd = seededRandom(seed)
  const { root, layers } = createVoxelBuilder()
  const room = { seats: [], spots: [], lights: [] }
  const group = () => ({ movers: [], spinners: [], blinkers: [] })
  const fx = { view: group(), room: group(), steams: [] }

  // face: ayaktakilerin döneceği yön (yaw; eşyaya doğru), verilmezse en yakın engele dönülür
  const addSpot = (id, label, point, places, face) => {
    const taken = room.spots.filter((s) => s.id.startsWith(id)).length
    room.spots.push({ id: taken ? `${id}-${taken + 1}` : id, label, position: [point.x, 0, point.z], ...(places && { stations: places }), ...(face != null && { face }) })
  }

  floor(root, width, depth, rnd)
  const back = layout.back ?? []
  const left = (layout.left ?? []).map((item) => ({ ...item, at: depth - item.z }))
  const ports = (items) => items.filter((w) => WALLS[w.type].port).map((w) => w.at)
  backWall(root, width, ports(back), rnd, fx)
  const leftFrame = root.frame(0, 0, depth, Math.PI / 2)
  leftWall(leftFrame, depth, ports(left), rnd, fx)

  let desks = 0
  for (const [wall, items] of [[root, back], [leftFrame, left]]) {
    for (const item of items) {
      const part = WALLS[item.type]
      const f = wall.frame(item.at, 0, 0)
      part.draw?.(f, rnd, item, fx)
      if (item.desk) portDesk(f, room, desks++ === 0)
      const spot = part.spot ?? (part.port && !item.desk && PORT_SPOT)
      if (spot) addSpot(spot.id, spot.label, f.point(0, 0, spot.distance), stations(spot.stations, f, item), f.facing() + Math.PI)
    }
  }

  const { table } = layout
  if (table) sonarTable(root.frame(table.x, 0, table.z), table.seats, room, fx)

  for (const item of layout.props ?? []) {
    const prop = PROPS[item.type]
    prop.draw(root.frame(item.x, 0, item.z), rnd, fx)
    if (prop.spot) {
      const f = root.frame(item.x, 0, item.z, toYaw(item.facing ?? '+z'))
      addSpot(prop.spot.id, prop.spot.label, f.point(0, 0, prop.spot.distance), null, f.facing() + Math.PI)
    }
  }

  return {
    layers,
    seats: room.seats.map((s, i) => ({ id: `seat-${i + 1}`, ...s })),
    spots: room.spots,
    lights: room.lights.slice(0, MAX_LAMP_LIGHTS),
    fx,
    bounds: { min: [-WALL, FLOOR_BOTTOM, -WALL], max: [width, WALL_HEIGHT + 0.04, depth] },
  }
}
