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

  function makeFrame(origin, rotation, parent) {
    const frame = {
      add(center, quat, size, color, layer) {
        center.applyQuaternion(rotation).add(origin)
        quat.premultiply(rotation)
        if (parent) parent.add(center, quat, size, color, layer)
        else layers[layer].push({ center, quat, size, color })
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
