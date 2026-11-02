import { Matrix3, Matrix4 } from 'three'

// Yürünebilir alan ızgarası ve yol bulma. Oda voxel katmanlarından üretilir:
//   zemin: üstü -8..+7 cm arasında kalan ince kutular (döşeme, halı, kilim)
//   engel: üstü 7 cm'den yüksek, altı 1.5 m'den alçak her kutu (masa, sandalye, duvar dibi eşyalar)
// Engeller avatar yarıçapı kadar şişirilir; zemin olmayan yer ve oda kenarı da engel sayılır.
// Böylece bulunan yol her noktada engellerden en az RADIUS uzakta, geçitler en az 2 × RADIUS geniştir.

export const CELL = 0.1
export const RADIUS = 0.24
// Başka bir avatarın etrafında boş bırakılan yarıçap (yol ararken).
export const BODY = 0.2
// Yürüyen birinin çevresinde pahalı sayılan yarıçapın karesi (yol ararken).
const SOFT_R2 = 0.45 ** 2
const FLOOR_MIN = -0.08
const FLOOR_MAX = 0.07
const OBSTACLE_BOTTOM = 1.5
const SQRT2 = Math.SQRT2

const m4 = new Matrix4()
const m3 = new Matrix3()

// Döndürülmüş kutunun eksen hizalı yarı boyları.
function extents(item) {
  m3.setFromMatrix4(m4.makeRotationFromQuaternion(item.quat))
  const e = m3.elements
  const [w, h, d] = item.size.map((v) => v / 2)
  return [
    Math.abs(e[0]) * w + Math.abs(e[3]) * h + Math.abs(e[6]) * d,
    Math.abs(e[1]) * w + Math.abs(e[4]) * h + Math.abs(e[7]) * d,
    Math.abs(e[2]) * w + Math.abs(e[5]) * h + Math.abs(e[8]) * d,
  ]
}

// Kutular: eksen hizalı sınırlar; yalnızca y ekseninde dönmüş kutular için ayrıca yerel eksenler
// (ux, uz: kutunun x ekseni, hw, hd: yarı en ve derinlik), hücre testinde gerçek dikdörtgen kullanılır.
function boxes(room) {
  const out = []
  for (const [layer, items] of Object.entries(room.layers)) {
    if (layer === 'glow') continue
    for (const item of items) {
      const [hx, hy, hz] = extents(item)
      const c = item.center
      const box = { x0: c.x - hx, x1: c.x + hx, y0: c.y - hy, y1: c.y + hy, z0: c.z - hz, z1: c.z + hz }
      m3.setFromMatrix4(m4.makeRotationFromQuaternion(item.quat))
      const e = m3.elements
      if (Math.abs(e[4]) > 0.999 && Math.abs(e[0]) < 0.999 && Math.abs(e[0]) > 0.001) {
        Object.assign(box, { cx: c.x, cz: c.z, ux: e[0], uz: e[2], hw: item.size[0] / 2, hd: item.size[2] / 2 })
      }
      out.push(box)
    }
  }
  return out
}

// Hücre merkezi (x, z) kutunun taban izinin içinde mi (pad kadar genişletilmiş)?
function covers(b, x, z, pad) {
  if (b.ux == null) return true
  const dx = x - b.cx
  const dz = z - b.cz
  const u = dx * b.ux + dz * b.uz
  const w = -dx * b.uz + dz * b.ux
  return Math.abs(u) <= b.hw + pad && Math.abs(w) <= b.hd + pad
}

/**
 * room: buildX() çıktısı (layers, bounds). Dönüş: { cols, rows, walk, main, solid, floor, width, depth, boxes }.
 * walk[i] = 1: avatar merkezi bu hücrede durabilir. solid[i] = 1: hücrede gerçek engel var.
 * floor[i] = 1: hücrede zemin var (göl, deniz, oda dışı yok). floorTop[i]: zeminin (halı, kilim dahil)
 * en üst yüzeyi.
 */
export function buildNav(room) {
  const width = room.bounds.max[0]
  const depth = room.bounds.max[2]
  const cols = Math.ceil(width / CELL)
  const rows = Math.ceil(depth / CELL)
  const floor = new Uint8Array(cols * rows)
  const floorTop = new Float32Array(cols * rows)
  const solid = new Uint8Array(cols * rows)
  const all = boxes(room)
  for (const b of all) {
    const isFloor = b.y1 >= FLOOR_MIN && b.y1 <= FLOOR_MAX && b.y1 - b.y0 < 0.6
    const isSolid = !isFloor && b.y1 > FLOOR_MAX && b.y0 < OBSTACLE_BOTTOM
    if (!isFloor && !isSolid) continue
    // zemin: merkezi kutunun içinde kalan hücreler; engel: kutuya değen her hücre
    const i0 = Math.max(0, isFloor ? Math.ceil(b.x0 / CELL - 0.5) : Math.floor(b.x0 / CELL))
    const i1 = Math.min(cols - 1, isFloor ? Math.floor(b.x1 / CELL - 0.5) : Math.ceil(b.x1 / CELL) - 1)
    const j0 = Math.max(0, isFloor ? Math.ceil(b.z0 / CELL - 0.5) : Math.floor(b.z0 / CELL))
    const j1 = Math.min(rows - 1, isFloor ? Math.floor(b.z1 / CELL - 0.5) : Math.ceil(b.z1 / CELL) - 1)
    const grid = isFloor ? floor : solid
    const pad = isFloor ? 0 : CELL * 0.71
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (!covers(b, (i + 0.5) * CELL, (j + 0.5) * CELL, pad)) continue
        const k = j * cols + i
        grid[k] = 1
        if (isFloor) floorTop[k] = Math.max(floorTop[k], b.y1)
      }
    }
  }
  // şişirme: engel, zemin olmayan hücre ve oda kenarından RADIUS içindeki her hücre yürünemez
  const walk = new Uint8Array(cols * rows)
  const r = Math.ceil(RADIUS / CELL)
  const disk = []
  for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.hypot(di, dj) * CELL <= RADIUS + 1e-6) disk.push([di, dj])
  walk.fill(1)
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i
      if (solid[k] || !floor[k]) {
        for (const [di, dj] of disk) {
          const a = i + di
          const b = j + dj
          if (a >= 0 && b >= 0 && a < cols && b < rows) walk[b * cols + a] = 0
        }
      }
      if ((i + 0.5) * CELL < RADIUS || (j + 0.5) * CELL < RADIUS || width - (i + 0.5) * CELL < RADIUS || depth - (j + 0.5) * CELL < RADIUS) walk[k] = 0
    }
  }
  return { cols, rows, walk, main: mainRegion(walk, cols, rows), solid, floor, floorTop, width, depth, boxes: all }
}

// En büyük bağlı yürünebilir bölge: kalkış ve duruş yerleri yalnızca buradan seçilir (eşya
// arkasında kalan kapalı ceplere düşmesinler).
function mainRegion(walk, cols, rows) {
  const label = new Int32Array(cols * rows)
  let best = 0
  let bestSize = 0
  let next = 0
  for (let k0 = 0; k0 < walk.length; k0++) {
    if (!walk[k0] || label[k0]) continue
    next++
    let size = 0
    const stack = [k0]
    label[k0] = next
    while (stack.length) {
      const k = stack.pop()
      size++
      const i = k % cols
      const j = (k - i) / cols
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
        if (a < 0 || b < 0 || a >= cols || b >= rows) continue
        const nk = b * cols + a
        if (walk[nk] && !label[nk]) {
          label[nk] = next
          stack.push(nk)
        }
      }
    }
    if (size > bestSize) {
      bestSize = size
      best = next
    }
  }
  const main = new Uint8Array(walk.length)
  for (let k = 0; k < walk.length; k++) main[k] = label[k] === best ? 1 : 0
  return main
}

const cellOf = (nav, x, z) => [Math.floor(x / CELL), Math.floor(z / CELL)]
const center = (i, j) => [(i + 0.5) * CELL, (j + 0.5) * CELL]
const inside = (nav, i, j) => i >= 0 && j >= 0 && i < nav.cols && j < nav.rows

// Noktadaki zemin yüzeyinin yüksekliği (gölge bunun hemen üstüne çizilir).
export function floorAt(nav, x, z) {
  const [i, j] = cellOf(nav, x, z)
  return inside(nav, i, j) ? nav.floorTop[j * nav.cols + i] : 0
}

export function walkableAt(nav, x, z) {
  const [i, j] = cellOf(nav, x, z)
  return inside(nav, i, j) && nav.walk[j * nav.cols + i] === 1
}

// Nokta ana yürünebilir bölgede mi?
function reachable(nav, x, z) {
  const [i, j] = cellOf(nav, x, z)
  return inside(nav, i, j) && nav.main[j * nav.cols + i] === 1
}

// Başka avatarlar (blockers: [{ x, z }]) bu noktayı kapatıyor mu?
const crowded = (blockers, x, z) => blockers.some((b) => (b.x - x) ** 2 + (b.z - z) ** 2 < (BODY + RADIUS) ** 2)

// Noktaya en yakın yürünebilir hücre (r hücre içinde); yoksa null.
export function nearestWalkable(nav, x, z, r = 4, blockers = []) {
  const [ci, cj] = cellOf(nav, x, z)
  let best = null
  let bestD = Infinity
  for (let j = cj - r; j <= cj + r; j++) {
    for (let i = ci - r; i <= ci + r; i++) {
      if (!inside(nav, i, j) || !nav.walk[j * nav.cols + i]) continue
      const [px, pz] = center(i, j)
      if (crowded(blockers, px, pz)) continue
      const d = (px - x) ** 2 + (pz - z) ** 2
      if (d < bestD) {
        bestD = d
        best = [px, pz]
      }
    }
  }
  return best
}

// İki nokta arası doğru üzerinde engel var mı (yürünebilir hücreler ve diğer avatarlar)?
export function lineClear(nav, a, b, blockers = []) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const n = Math.max(1, Math.ceil(len / (CELL * 0.5)))
  for (let s = 0; s <= n; s++) {
    const x = a[0] + ((b[0] - a[0]) * s) / n
    const z = a[1] + ((b[1] - a[1]) * s) / n
    if (!walkableAt(nav, x, z) || crowded(blockers, x, z)) return false
  }
  return true
}

// İkili yığın (A* açık listesi).
function heapPush(heap, f, node) {
  heap.push([f, node])
  let i = heap.length - 1
  while (i > 0) {
    const p = (i - 1) >> 1
    if (heap[p][0] <= heap[i][0]) break
    ;[heap[p], heap[i]] = [heap[i], heap[p]]
    i = p
  }
}
function heapPop(heap) {
  const top = heap[0]
  const last = heap.pop()
  if (heap.length) {
    heap[0] = last
    let i = 0
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let m = i
      if (l < heap.length && heap[l][0] < heap[m][0]) m = l
      if (r < heap.length && heap[r][0] < heap[m][0]) m = r
      if (m === i) break
      ;[heap[m], heap[i]] = [heap[i], heap[m]]
      i = m
    }
  }
  return top[1]
}

/**
 * from'dan to'ya yol: [[x, z], ...] (ilk nokta başlangıç, son nokta hedef) ya da null. 8 yönlü A*,
 * köşe kesmez; blockers çevresindeki hücreler kapalı sayılır (başlangıç ve hedef hariç). soft:
 * yürüyen avatarlar; yakınlarından geçmek pahalıdır, başka yol varsa ondan gidilir. Yol, görüş
 * hattı kısaltmasıyla düzleştirilir.
 */
export function findPath(nav, from, to, blockers = [], soft = []) {
  const start = walkableAt(nav, from[0], from[1]) ? from : nearestWalkable(nav, from[0], from[1], 5)
  const goal = walkableAt(nav, to[0], to[1]) ? to : nearestWalkable(nav, to[0], to[1], 5)
  if (!start || !goal) return null
  const [si, sj] = cellOf(nav, start[0], start[1])
  const [gi, gj] = cellOf(nav, goal[0], goal[1])
  const { cols, rows, walk } = nav
  const near = (i, j, ci, cj) => Math.abs(i - ci) <= 2 && Math.abs(j - cj) <= 2
  const open = (i, j) => {
    if (!inside(nav, i, j) || !walk[j * cols + i]) return false
    if (near(i, j, si, sj) || near(i, j, gi, gj)) return true
    const [x, z] = center(i, j)
    return !crowded(blockers, x, z)
  }
  const g = new Float32Array(cols * rows).fill(Infinity)
  const came = new Int32Array(cols * rows).fill(-1)
  const closed = new Uint8Array(cols * rows)
  const h = (i, j) => {
    const dx = Math.abs(i - gi)
    const dz = Math.abs(j - gj)
    return dx + dz + (SQRT2 - 2) * Math.min(dx, dz)
  }
  const s = sj * cols + si
  const goalK = gj * cols + gi
  g[s] = 0
  const heap = []
  heapPush(heap, h(si, sj), s)
  let found = s === goalK
  while (heap.length && !found) {
    const k = heapPop(heap)
    if (closed[k]) continue
    closed[k] = 1
    if (k === goalK) {
      found = true
      break
    }
    const i = k % cols
    const j = (k - i) / cols
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue
        const a = i + di
        const b = j + dj
        if (!open(a, b)) continue
        if (di && dj && (!open(i + di, j) || !open(i, j + dj))) continue
        const nk = b * cols + a
        let cost = g[k] + (di && dj ? SQRT2 : 1)
        if (soft.length) {
          const [x, z] = center(a, b)
          if (soft.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < SOFT_R2)) cost += 3
        }
        if (cost < g[nk]) {
          g[nk] = cost
          came[nk] = k
          heapPush(heap, cost + h(a, b), nk)
        }
      }
    }
  }
  if (!found) return null
  const cells = []
  for (let k = goalK; k !== -1; k = came[k]) {
    const i = k % cols
    cells.push(center(i, (k - i) / cols))
    if (k === s) break
  }
  cells.reverse()
  cells[0] = start
  cells[cells.length - 1] = goal
  // görüş hattı kısaltması
  const path = [cells[0]]
  let a = 0
  while (a < cells.length - 1) {
    let b = cells.length - 1
    while (b > a + 1 && !lineClear(nav, cells[a], cells[b], blockers)) b--
    path.push(cells[b])
    a = b
  }
  if (from !== start) path.unshift(from)
  return path
}

/**
 * Koltuktan kalkış noktası: koltuğa en yakın, ana bölgedeki yürünebilir nokta (1.2 m içinde).
 * Masa koltuklarında arkası ve yanları öne tercih edilir; front: true ise (mola yerindeki kanepe,
 * bank) önü. avoid: başka koltukların kalkış noktaları; bunlara 0.45 m'den yakın noktalar ancak
 * başka yer yoksa seçilir. Yoksa null (avatar oturduğu yerde mola verir).
 */
export function seatExit(nav, seat, avoid = [], front = false) {
  const [x, , z] = seat.position
  const fx = Math.sin(seat.yaw)
  const fz = Math.cos(seat.yaw)
  const [ci, cj] = cellOf(nav, x, z)
  const r = Math.ceil(1.2 / CELL)
  let best = null
  let bestScore = Infinity
  for (let j = cj - r; j <= cj + r; j++) {
    for (let i = ci - r; i <= ci + r; i++) {
      if (!inside(nav, i, j) || !nav.main[j * nav.cols + i]) continue
      const [px, pz] = center(i, j)
      const d = Math.hypot(px - x, pz - z)
      if (d > 1.2) continue
      const ahead = ((px - x) * fx + (pz - z) * fz) / Math.max(d, 1e-6)
      const shared = avoid.some((a) => Math.hypot(a[0] - px, a[1] - pz) < 0.45)
      const score = d + 0.35 * Math.max(0, front ? -ahead : ahead) + (shared ? 10 : 0)
      if (score < bestScore) {
        bestScore = score
        best = [px, pz]
      }
    }
  }
  return best
}

// Noktadan en yakın engelin (ya da face 'open' ise zeminin bittiği yerin) yönü; r m içinde.
function facingFrom(nav, x, z, open) {
  const [ci, cj] = cellOf(nav, x, z)
  const r = Math.ceil((open ? 3 : 1.8) / CELL)
  let tx = nav.width / 2 - x
  let tz = nav.depth / 2 - z
  let bestD = Infinity
  for (let j = cj - r; j <= cj + r; j++) {
    for (let i = ci - r; i <= ci + r; i++) {
      const outside = !inside(nav, i, j)
      const k = j * nav.cols + i
      const hit = open ? outside || !nav.floor[k] : (!outside && nav.solid[k]) || (outside && (i < 0 || j < 0))
      if (!hit) continue
      const [px, pz] = center(i, j)
      const d = Math.hypot(px - x, pz - z)
      if (d < bestD && d <= r * CELL) {
        bestD = d
        tx = px - x
        tz = pz - z
      }
    }
  }
  return Math.atan2(tx, tz)
}

/**
 * Mola noktasının yerleri: en fazla iki. Önce eşyanın oturma / yatma / binme noktaları (spot.stations;
 * yer, o noktanın kalkış noktasıdır), sonra halkanın ortasında bakılan eşyaya dönük, yan yana
 * 0.6 m arayla ayakta duruş yerleri. Ayaktakiler spot.face yönüne (eşyaya) döner; yoksa en yakın
 * engele. near: ayakta duranlar eşyaya doğru yürünebilir alanın sonuna kadar yaklaşır. face 'open':
 * ayaktakiler manzaraya (zeminin bittiği yöne) döner.
 * Dönüş: [{ x, z, yaw, station? }].
 */
export function spotSlots(nav, spot, { near = false, face = null } = {}) {
  const slots = []
  // yeni yer öbürlerinden uzak olmalı ve öbürü doluyken de dışarıdan ulaşılabilmeli (biri köşede
  // öbürünün arkasında kalırsa ikinci gelen içeri geçemez)
  const far = (x, z) =>
    slots.every((s) => Math.hypot(s.x - x, s.z - z) >= 0.55 && openWith(nav, [x, z], [s.x, s.z]) && openWith(nav, [s.x, s.z], [x, z]))
  for (const st of spot.stations ?? []) {
    if (slots.length >= 2) break
    const [sx, , sz] = st.position
    if (st.kind === 'stand') {
      // nokta birkaç santimle yürünemez alana düşüyorsa 30 cm içindeki en yakın yürünebilir yere kayar
      const p = reachable(nav, sx, sz) ? [sx, sz] : nearestWalkable(nav, sx, sz, 3)
      if (p && reachable(nav, p[0], p[1]) && far(p[0], p[1])) slots.push({ x: p[0], z: p[1], yaw: st.yaw, station: st })
      continue
    }
    const exit = seatExit(nav, st, slots.map((s) => [s.x, s.z]), true)
    if (exit && far(exit[0], exit[1])) slots.push({ x: exit[0], z: exit[1], yaw: Math.atan2(sx - exit[0], sz - exit[1]), station: st })
  }
  const [x, , z] = spot.position
  const yaw = face !== 'open' && spot.face != null ? spot.face : facingFrom(nav, x, z, face === 'open')
  const fx = Math.sin(yaw)
  const fz = Math.cos(yaw)
  const px = Math.cos(yaw)
  const pz = -Math.sin(yaw)
  // yan yana iki yer; doluysa (oturak çıkışına yakınsa) biraz daha yana ya da ortaya
  for (const off of [-0.3, 0.3, -0.6, 0.6, 0, -0.9, 0.9]) {
    if (slots.length >= 2) break
    let sx = x + px * off
    let sz = z + pz * off
    if (!reachable(nav, sx, sz)) continue
    if (near) {
      for (let k = 0; k < 12 && reachable(nav, sx + fx * 0.05, sz + fz * 0.05); k++) {
        sx += fx * 0.05
        sz += fz * 0.05
      }
    }
    if (far(sx, sz)) slots.push({ x: sx, z: sz, yaw })
  }
  return slots
}

// target noktasından, blocked noktasında biri dururken, 1.8 m öteye yürünebiliyor mu?
function openWith(nav, target, blocked) {
  const { cols } = nav
  const [si, sj] = cellOf(nav, target[0], target[1])
  if (!inside(nav, si, sj) || !nav.walk[sj * cols + si]) return false
  const block = [{ x: blocked[0], z: blocked[1] }]
  const seen = new Set([sj * cols + si])
  const stack = [[si, sj]]
  while (stack.length) {
    const [i, j] = stack.pop()
    const [x, z] = center(i, j)
    if (Math.hypot(x - target[0], z - target[1]) > 1.8) return true
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      const k = b * cols + a
      if (!inside(nav, a, b) || !nav.walk[k] || seen.has(k)) continue
      const [ax, az] = center(a, b)
      if (Math.hypot(ax - target[0], az - target[1]) > 0.25 && crowded(block, ax, az)) continue
      seen.add(k)
      stack.push([a, b])
    }
  }
  return false
}

/**
 * Kenara çekilme yeri: from'dan yürünerek (en fazla maxR m) ulaşılan, avoid (yol parçaları
 * [[x0, z0, x1, z1]]) çizgilerinden en az clear m uzakta ve blockers'tan boş en yakın hücre.
 * Karşıdan gelen birine yol vermek için. Yoksa null.
 */
export function findRefuge(nav, from, avoid, blockers, clear, maxR = 1.6) {
  const start = walkableAt(nav, from[0], from[1]) ? from : nearestWalkable(nav, from[0], from[1], 3)
  if (!start) return null
  const { cols } = nav
  const [si, sj] = cellOf(nav, start[0], start[1])
  const seen = new Map([[sj * cols + si, 0]])
  const queue = [[si, sj]]
  const segDist = (x, z, [x0, z0, x1, z1]) => {
    const dx = x1 - x0
    const dz = z1 - z0
    const len2 = dx * dx + dz * dz
    const k = len2 > 0 ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / len2)) : 0
    return Math.hypot(x - x0 - dx * k, z - z0 - dz * k)
  }
  while (queue.length) {
    const [i, j] = queue.shift()
    const d = seen.get(j * cols + i)
    const [x, z] = center(i, j)
    if (d > 0 && avoid.every((seg) => segDist(x, z, seg) >= clear) && !crowded(blockers, x, z)) return [x, z]
    if (d >= maxR) continue
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di
      const b = j + dj
      const k = b * cols + a
      if (!inside(nav, a, b) || !nav.walk[k] || seen.has(k)) continue
      const [ax, az] = center(a, b)
      if (d > 0.2 && crowded(blockers, ax, az)) continue
      seen.set(k, d + CELL)
      queue.push([a, b])
    }
  }
  return null
}

/**
 * Koltuğun önündeki masa yüzeyi: koltuktan 0.25-0.55 m ileride, oturma yüksekliğinin 0.1-0.65 m
 * üstünde en yüksek kutu üstü. Masa yoksa null.
 */
export function deskHeight(nav, seat) {
  const [x, y, z] = seat.position
  const fx = Math.sin(seat.yaw)
  const fz = Math.cos(seat.yaw)
  let best = null
  for (const d of [0.3, 0.42, 0.55]) {
    const px = x + fx * d
    const pz = z + fz * d
    for (const b of nav.boxes) {
      if (px < b.x0 || px > b.x1 || pz < b.z0 || pz > b.z1) continue
      if (b.y1 < y + 0.1 || b.y1 > y + 0.65 || b.y1 - b.y0 > 1.2) continue
      if (best == null || b.y1 > best) best = b.y1
    }
  }
  return best
}
