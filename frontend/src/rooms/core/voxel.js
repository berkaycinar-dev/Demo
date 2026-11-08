import { Euler, Quaternion, Vector3 } from 'three'

// Oda sahnesini kutulardan (voxel) kuran yardımcı. Her kutu bir katmana eklenir,
// her katman tek bir InstancedMesh olarak çizilir: tüm oda birkaç draw call'a iner.
//   solid: ışık + gölge alan ahşap, kitap, duvar...
//   glass: ışıksız pencere camı (rengi gün zamanına göre değişir)
//   bulb:  ışıksız ampul / abajur (gece parlar)
//   glow:  masa ve zemindeki ışık havuzu (additive düzlem)
//   night: yalnızca akşam/gece görünen ışıksız ışıklar (şehir pencereleri gibi)
export const LAYERS = ['solid', 'glass', 'bulb', 'glow', 'night']

const FORWARD = new Vector3(0, 0, 1)

export function createVoxelBuilder() {
  const layers = Object.fromEntries(LAYERS.map((name) => [name, []]))
  // Tıklanınca tepki veren eşyalar (lamba, bitki, makine): { id, kind, pivot, ... }. Eşyanın kutuları
  // `tag: id` taşır; VoxelMeshes onları bulup oynatır. Katman listesinde sayılmasın diye gizli alan.
  const interactives = []
  Object.defineProperty(layers, 'interactives', { value: interactives, enumerable: false })

  function makeFrame(origin, rotation, parent, tag) {
    const frame = {
      add(center, quat, size, color, layer, itemTag = tag) {
        center.applyQuaternion(rotation).add(origin)
        quat.premultiply(rotation)
        if (parent) parent.add(center, quat, size, color, layer, itemTag)
        else layers[layer].push(itemTag == null ? { center, quat, size, color } : { center, quat, size, color, tag: itemTag })
      },
      // (x, y, z) yerel köşe, (w, h, d) boyut. rot: kutu merkezine göre [rx, ry, rz].
      box(x, y, z, w, h, d, color, { layer = 'solid', rot } = {}) {
        const quat = rot
          ? new Quaternion().setFromEuler(new Euler(rot[0], rot[1], rot[2]))
          : new Quaternion()
        frame.add(new Vector3(x + w / 2, y + h / 2, z + d / 2), quat, [w, h, d], color, layer)
        return frame
      },
      // Yatay ışık havuzu (glow katmanı), y yüksekliğinde w x d. color lamba rengiyle çarpılır.
      glow(x, y, z, w, d, color = '#ffffff') {
        frame.add(new Vector3(x + w / 2, y, z + d / 2), new Quaternion(), [w, 1, d], color, 'glow')
        return frame
      },
      // Alt çerçeve: önce yaw (Y), sonra pitch (X), sonra roll (Z).
      frame(x, y, z, yaw = 0, pitch = 0, roll = 0) {
        const quat = new Quaternion().setFromEuler(new Euler(pitch, yaw, roll, 'YXZ'))
        return makeFrame(new Vector3(x, y, z), quat, frame)
      },
      /**
       * Tıklanabilir eşya çerçevesi (frame gibi; içine çizilen her kutu bu eşyaya ait sayılır).
       * kind: 'lamp' (açılıp kapanır) | 'screen' (bir an söner, kırpışıp yeniden açılır) | 'plant'
       * (yaprakları sallanır) | 'machine' (sarsılır, buhar ya da kabarcık çıkarır).
       * opts: bend (bitki: sallanmanın başladığı yerel yükseklik; altındaki saksı kıpırdamaz), each
       * (bitki: her kutu kendi yerinde sallanır, sıra sıra fide ve asılı otlar için; pivot yüksekliği
       * çerçevenin orijini), puff (makine: { at: [x, y, z] yerel, kind: 'steam' | 'bubbles' |
       * 'potion' | 'notes' }).
       */
      interactive(kind, x = 0, y = 0, z = 0, yaw = 0, opts = {}) {
        const id = interactives.length
        const quat = new Quaternion().setFromEuler(new Euler(0, yaw, 0))
        const child = makeFrame(new Vector3(x, y, z), quat, frame, id)
        const local = (px, py, pz) => child.point(px, py, pz).toArray()
        interactives.push({
          id,
          kind,
          base: local(0, 0, 0),
          pivot: local(0, opts.bend ?? 0, 0),
          ...(opts.each && { each: true }),
          ...(opts.puff && { puff: { at: local(...opts.puff.at), kind: opts.puff.kind } }),
        })
        return child
      },
      point(x, y, z) {
        const p = new Vector3(x, y, z).applyQuaternion(rotation).add(origin)
        return parent ? parent.point(p.x, p.y, p.z) : p
      },
      // Yerel +z yönünün dünyadaki yaw açısı (avatarın baktığı yön).
      facing() {
        const dir = FORWARD.clone().applyQuaternion(frame.worldRotation())
        return Math.atan2(dir.x, dir.z)
      },
      worldRotation() {
        return parent ? parent.worldRotation().multiply(rotation) : rotation.clone()
      },
    }
    return frame
  }

  return { root: makeFrame(new Vector3(), new Quaternion(), null), layers }
}

// Her render'da aynı odayı üretmek için tohumlu rastgele (mulberry32).
export function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = (rnd, list) => list[Math.floor(rnd() * list.length)]
