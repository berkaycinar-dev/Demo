import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, Matrix4, Quaternion, Vector3 } from 'three'

// Tıklanabilir eşyalar (voxel.js `interactive`): lamba açılıp kapanır, ekran bir an söner ve
// kırpışarak yeniden açılır, bitkinin yaprakları sallanıp durulur, makine kısa bir sarsıntıyla
// buhar, kabarcık ya da nota çıkarır. Eşyanın kutuları oda
// katmanlarında kalır; tepki sırasında yalnızca o kutuların matrisi / rengi yeniden yazılır.
// Görünmez çarpışma kutuları tek bir InstancedMesh'tir (renk ve derinlik yazmaz).

const BOX = new BoxGeometry()
const PAD = 0.04
const LAMP_OFF = new Color('#4d463c')
const LAMP_OFF_TIME = 0.12
// açılırken ampul iki kez kırpışıp yanar: [bitiş sn, parlaklık]
const FLICKER = [[0.05, 1], [0.1, 0.2], [0.16, 0.9], [0.21, 0.45], [0.3, 1]]
// ekran: güç kırpışması (söner, iki kez yanıp söner, açılır); kalıcı kapanmaz, ekranın fx
// efektleri (tarama çizgisi, imleç) karanlık ekranda kalmasın
const SCREEN = [[0.07, 0], [0.13, 0.7], [0.19, 0.1], [0.27, 1.25], [0.45, 1]]
// bitki: büyük bitkide 0.13 rad; küçük bitkide (pervazdaki eğrelti) uç ~4 cm salınacak kadar büyür
const SWAY = { amp: 0.13, maxAmp: 0.32, tip: 0.04, freq: 1.5, damp: 2.2, dur: 2.4 }
// makine: boyuna göre çöküp toparlanma (her boyda ~4 cm görünür), alçak eşya (çaydanlık, kahve
// makinesi) ayrıca küçük bir sıçrama yapar
const SHAKE = { dur: 0.5, travel: 0.045, maxAmp: 0.12, hop: 0.035, hopBelow: 0.8 }
const PUFF = { count: 6, life: 1.3, spread: 0.12 }
const PARTICLES = 18
const PUFF_COLORS = { steam: '#f3f0ea', bubbles: '#e4f5ff', potion: '#9dff8a', notes: '#ffd27a' }
// parçacık türü: yükselme (m), sona doğru büyüme, yana salınım, sabit boy
const PUFF_KINDS = {
  steam: { rise: 0.4, grow: 0.07, size: 0.04, sway: 1, depth: true },
  bubbles: { rise: 0.3, grow: 0, size: 0.028, sway: 0.4, depth: false },
  potion: { rise: 0.35, grow: 0, size: 0.035, sway: 0.5, depth: true, ring: 0.22 },
  notes: { rise: 0.55, grow: 0, size: 0.05, sway: 2.2, depth: false },
}
// tepki sürerken yeni tıklama ancak bu kadar sonra yeniden başlatır (titremesin)
const RETRIGGER = 0.45

const m = new Matrix4()
const pivotM = new Matrix4()
const backM = new Matrix4()
const rotM = new Matrix4()
const pos = new Vector3()
const scl = new Vector3()
const quat = new Quaternion()
const axis = new Vector3()
const color = new Color()
const WHITE = new Color('#ffffff')

const now = () => performance.now() / 1000
const write = (mesh, i, item, sx = 1, sy = 1, sz = 1) =>
  mesh.setMatrixAt(i, m.compose(item.center, item.quat, scl.set(item.size[0] * sx, item.size[1] * sy, item.size[2] * sz)))

function screenLevel(e) {
  for (const [end, level] of SCREEN) if (e < end) return level
  return 1
}

function lampLevel(e, on) {
  if (!on) return Math.max(0, 1 - e / LAMP_OFF_TIME)
  for (const [end, level] of FLICKER) if (e < end) return level
  return 1
}

/**
 * getLayer(name): VoxelMeshes'in katman kaydı ({ mesh, items }, items çizim sırasıyla).
 * interactives: voxel.js'in eşya listesi. layers: kutuların ham listesi (çarpışma kutusu için).
 */
export default function Interactives({ getLayer, interactives, layers, animated }) {
  const invalidate = useThree((s) => s.invalidate)
  const hitRef = useRef(null)
  const puffRef = useRef(null)
  const fx = useRef({ active: new Map(), lampOff: new Set(), puffs: [], parts: null })

  // Çarpışma kutuları: eşyanın katı, cam ve ampul kutularının eksen hizalı sınırı (ışık havuzu hariç;
  // yere tıklamak lambayı kapatmasın).
  const hits = useMemo(() => {
    const boxes = interactives.map(() => ({ min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }))
    for (const name of ['solid', 'glass', 'bulb']) {
      for (const it of layers[name]) {
        if (it.tag == null) continue
        const b = boxes[it.tag]
        for (let k = 0; k < 3; k++) {
          const h = it.size[k] / 2
          b.min[k] = Math.min(b.min[k], it.center.getComponent(k) - h)
          b.max[k] = Math.max(b.max[k], it.center.getComponent(k) + h)
        }
      }
    }
    return boxes.map((b, id) => ({ id, ...b })).filter((b) => b.min[0] < Infinity)
  }, [interactives, layers])
  const hitById = useMemo(() => new Map(hits.map((h) => [h.id, h])), [hits])

  useLayoutEffect(() => {
    const mesh = hitRef.current
    if (!mesh) return
    hits.forEach((b, i) => {
      pos.set((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2)
      scl.set(b.max[0] - b.min[0] + PAD, b.max[1] - b.min[1] + PAD, b.max[2] - b.min[2] + PAD)
      mesh.setMatrixAt(i, m.compose(pos, quat.identity(), scl))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    // katmanlar yeniden kurulduysa eşya parçalarının yerleri de yeniden bulunur
    fx.current.parts = null
    fx.current.active.clear()
    fx.current.lampOff.clear()
  }, [hits])

  useLayoutEffect(() => {
    const mesh = puffRef.current
    if (!mesh) return
    for (let i = 0; i < PARTICLES; i++) {
      mesh.setMatrixAt(i, m.makeScale(0, 0, 0))
      mesh.setColorAt(i, color.set(PUFF_COLORS.steam))
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  }, [])

  // Eşya → katmanlardaki yerleri: { layer: [{ index, item }] }. İlk tıklamada kurulur.
  const partsOf = (id) => {
    const state = fx.current
    if (!state.parts) {
      state.parts = new Map()
      for (const name of ['solid', 'glass', 'bulb', 'glow']) {
        const entry = getLayer(name)
        if (!entry) continue
        entry.items.forEach((item, index) => {
          if (item.tag == null) return
          if (!state.parts.has(item.tag)) state.parts.set(item.tag, {})
          const byLayer = state.parts.get(item.tag)
          ;(byLayer[name] ??= []).push({ index, item })
        })
      }
    }
    return state.parts.get(id) ?? {}
  }

  const trigger = (id) => {
    const info = interactives[id]
    const state = fx.current
    const t = now()
    const cur = state.active.get(id)
    if (info.kind === 'lamp') {
      const on = state.lampOff.has(id)
      if (on) state.lampOff.delete(id)
      else state.lampOff.add(id)
      state.active.set(id, { start: animated ? t : -Infinity, on })
    } else {
      // hareket azaltılmışsa ekran kırpışması da (yanıp sönme) yok
      if (!animated) return
      if (cur && t - cur.start < RETRIGGER) return
      state.active.set(id, { start: t })
      if (info.puff) {
        for (let k = 0; k < PUFF.count; k++) state.puffs.push({ start: t + k * 0.09, at: info.puff.at, kind: info.puff.kind, seed: Math.random() * 10 })
        state.puffs = state.puffs.slice(-PARTICLES)
      }
    }
    invalidate()
  }

  // Geliştirmede denetim betikleri için: eşyalar ve çarpışma kutusu merkezlerinin ekran konumu.
  const get = useThree((s) => s.get)
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.__roomInteractives = {
      list: interactives,
      click: (id) => trigger(id),
      // eşyanın kutularının dinlenme konumundan en büyük kayması (m) ve ampullerin en düşük parlaklık oranı
      motion(id) {
        const parts = partsOf(id)
        let moved = 0
        let dim = 1
        const at = new Matrix4()
        const p = new Vector3()
        for (const name of ['solid', 'glass', 'bulb']) {
          for (const { index, item } of parts[name] ?? []) {
            getLayer(name).mesh.getMatrixAt(index, at)
            moved = Math.max(moved, p.setFromMatrixPosition(at).distanceTo(item.center))
          }
        }
        for (const { index, item } of parts.bulb ?? []) {
          getLayer('bulb').mesh.getColorAt(index, color)
          const base = new Color(item.color)
          dim = Math.min(dim, (color.r + color.g + color.b) / Math.max(1e-3, base.r + base.g + base.b))
        }
        return { moved, dim }
      },
      screen(id) {
        const b = hits.find((h) => h.id === id)
        const { camera, size } = get()
        const v = new Vector3((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2).project(camera)
        const rect = get().gl.domElement.getBoundingClientRect()
        return [rect.left + ((v.x + 1) / 2) * size.width, rect.top + ((1 - v.y) / 2) * size.height]
      },
    }
    return () => delete window.__roomInteractives
  }, [interactives, hits, get]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const state = fx.current
    if (!state.active.size && !state.puffs.length) return
    const t = now()
    const touched = new Set()
    for (const [id, a] of state.active) {
      const info = interactives[id]
      const parts = partsOf(id)
      const e = t - a.start
      let done
      if (info.kind === 'lamp' || info.kind === 'screen') {
        const screen = info.kind === 'screen'
        const level = screen ? screenLevel(e) : lampLevel(e, a.on)
        done = screen ? e >= SCREEN.at(-1)[0] : a.on ? e >= FLICKER.at(-1)[0] : e >= LAMP_OFF_TIME
        for (const { index, item } of parts.bulb ?? []) {
          color.set(item.color)
          // 1'in üstü: açılırken bir an fazla parlar
          if (level > 1) color.lerp(WHITE, level - 1)
          else color.lerp(LAMP_OFF, 1 - level)
          getLayer('bulb').mesh.setColorAt(index, color)
          touched.add('bulb')
        }
        for (const { index, item } of parts.glow ?? []) {
          write(getLayer('glow').mesh, index, item, Math.max(level, 1e-4), 1, Math.max(level, 1e-4))
          touched.add('glow')
        }
      } else {
        // bitki: verilen sallanma noktası; makine: kendi kutusunun taban ortası (orijin nerede olursa)
        const hb = hitById.get(id)
        const [bx, by, bz] = info.kind === 'plant' ? info.pivot : [(hb.min[0] + hb.max[0]) / 2, hb.min[1], (hb.min[2] + hb.max[2]) / 2]
        pivotM.makeTranslation(bx, by, bz)
        backM.makeTranslation(-bx, -by, -bz)
        if (info.kind === 'plant') {
          done = e >= SWAY.dur
          const tall = Math.max(0.05, hb.max[1] - by)
          const amp = Math.min(SWAY.maxAmp, Math.max(SWAY.amp, SWAY.tip / tall))
          const angle = done ? 0 : amp * Math.exp(-e * SWAY.damp) * Math.sin(e * SWAY.freq * Math.PI * 2)
          // kameraya bakış doğrultusu çevresinde döner: ekranda yana sallanır
          rotM.makeRotationAxis(axis.set(1, 0, 1).normalize(), angle)
        } else {
          const p = Math.min(1, e / SHAKE.dur)
          done = p >= 1
          const height = Math.max(0.05, hb.max[1] - hb.min[1])
          const amp = Math.min(SHAKE.maxAmp, SHAKE.travel / height)
          const f = -amp * Math.cos(p * Math.PI * 1.5) * (1 - p) ** 2
          const hop = height < SHAKE.hopBelow && p > 0.12 && p < 0.62 ? SHAKE.hop * Math.sin(((p - 0.12) / 0.5) * Math.PI) : 0
          rotM.makeScale(1 - f * 0.5, 1 + f, 1 - f * 0.5).setPosition(0, hop, 0)
        }
        const xf = pivotM.clone().multiply(rotM).multiply(backM)
        for (const name of ['solid', 'glass', 'bulb']) {
          const entry = getLayer(name)
          for (const { index, item } of parts[name] ?? []) {
            // tek bitkide saksı (sallanma noktasının altı) kıpırdamaz
            if (info.kind === 'plant' && !info.each && item.center.y < by) continue
            write(entry.mesh, index, item)
            entry.mesh.getMatrixAt(index, m)
            if (info.each) {
              // sıradaki her fide / asılı ot kendi tabanı (ya da asıldığı nokta) çevresinde
              pivotM.makeTranslation(item.center.x, by, item.center.z)
              backM.makeTranslation(-item.center.x, -by, -item.center.z)
              entry.mesh.setMatrixAt(index, m.premultiply(pivotM.clone().multiply(rotM).multiply(backM)))
            } else entry.mesh.setMatrixAt(index, m.premultiply(xf))
            touched.add(name)
          }
        }
      }
      if (done) state.active.delete(id)
    }

    // buhar / kabarcık
    const puff = puffRef.current
    state.puffs = state.puffs.filter((p) => t - p.start < PUFF.life)
    for (let i = 0; i < PARTICLES; i++) {
      const p = state.puffs[i]
      const life = p ? (t - p.start) / PUFF.life : -1
      if (!p || life < 0) {
        puff.setMatrixAt(i, m.makeScale(0, 0, 0))
        continue
      }
      const [x, y, z] = p.at
      const k = PUFF_KINDS[p.kind]
      const fade = life > 0.6 ? (1 - life) / 0.4 : Math.min(1, life / 0.1)
      const size = (k.size + k.grow * life) * fade
      // iksir: kazan ağzında rastgele bir yerden çıkar
      const rx = k.ring ? Math.cos(p.seed * 2.3) * k.ring * (p.seed % 1) : 0
      const rz = k.ring ? Math.sin(p.seed * 2.3) * k.ring * (p.seed % 1) : 0
      pos.set(
        x + rx + PUFF.spread * 0.5 * Math.sin(p.seed + life * 5) * k.sway * (k.grow ? life : 0.4),
        y + life * k.rise,
        // kabarcık ve notalar önde, kameraya dönük düzlemde kalır (damacananın içi opak)
        z + rz + (k.depth ? PUFF.spread * 0.4 * Math.cos(p.seed * 1.7 + life * 4) * (k.grow ? life : 0.4) : 0),
      )
      puff.setMatrixAt(i, m.compose(pos, quat.identity(), scl.setScalar(Math.max(size, 1e-4))))
      puff.setColorAt(i, color.set(PUFF_COLORS[p.kind]))
    }
    puff.instanceMatrix.needsUpdate = true
    if (puff.instanceColor) puff.instanceColor.needsUpdate = true

    for (const name of touched) {
      const mesh = getLayer(name).mesh
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    if (state.active.size || state.puffs.length) invalidate()
  })

  if (!hits.length) return null
  // imleç: tıklanabilir eşyanın üstünde el
  const cursor = (value) => (e) => {
    e.nativeEvent.target.style.cursor = value
  }
  return (
    <>
      <instancedMesh
        ref={hitRef}
        args={[BOX, undefined, hits.length]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation()
          const hit = hits[e.instanceId]
          if (hit) trigger(hit.id)
        }}
        onPointerOver={cursor('pointer')}
        onPointerOut={cursor('')}
      >
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={puffRef} args={[BOX, undefined, PARTICLES]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
    </>
  )
}
