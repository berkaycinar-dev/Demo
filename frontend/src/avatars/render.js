import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { BONES, HEAD_CROWN, HIP_HEIGHT } from './model'

// Avatarları tek InstancedMesh'e yazan yardımcılar. Her avatar için kemik dünya matrisleri
// hesaplanır, her parça kemik matrisi × parça matrisi olarak yazılır. Bellek ayrımı yok: geçici
// nesneler modül düzeyinde.

const euler = new Euler()
const quat = new Quaternion()
const pos = new Vector3()
const one = new Vector3(1, 1, 1)
const scl = new Vector3()
const local = new Matrix4()
const out = new Matrix4()
const HIDDEN = new Matrix4().makeScale(0, 0, 0)
const UP = new Vector3(0, 1, 0)

export const createBoneMatrices = () => BONES.map(() => new Matrix4())

// Kök: zemindeki konum [x, z], yaw ve yükseklik rootY; poz: hipY, hipX, hipZ ve kemik dönüşleri.
// scale: tüm avatarı kök çevresinde büyütür (önizleme için).
export function computeBones(bones, pose, x, z, yaw, rootY = 0, scale = 1) {
  BONES.forEach((bone, i) => {
    const r = pose.bones[i]
    euler.set(r[0], r[1], r[2], 'XYZ')
    quat.setFromEuler(euler)
    if (bone.parent < 0) {
      pos.set(pose.hipX ?? 0, pose.hipY, pose.hipZ ?? 0)
      local.compose(pos, quat, one)
      out.compose(pos.set(x, rootY, z), quat.setFromAxisAngle(UP, yaw), scl.setScalar(scale))
      bones[i].multiplyMatrices(out, local)
    } else {
      pos.fromArray(bone.pivot)
      local.compose(pos, quat, one)
      bones[i].multiplyMatrices(bones[bone.parent], local)
    }
  })
  return bones
}

// Bütün kemikleri dünya dönüşümüyle çarpar (salınan hamakta yatan avatar gibi).
export function transformBones(bones, matrix) {
  for (const b of bones) b.premultiply(matrix)
  return bones
}

// Parçaları mesh'e start indeksinden başlayarak yazar; görünmeyen eşyalar sıfır ölçekle gizlenir.
// Dönüş: yazılan parça sayısı.
export function writeParts(mesh, start, parts, bones, show) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.show && p.show !== show) mesh.setMatrixAt(start + i, HIDDEN)
    else mesh.setMatrixAt(start + i, out.multiplyMatrices(bones[p.bone], p.matrix))
  }
  return parts.length
}

export function hideParts(mesh, start, count) {
  for (let i = 0; i < count; i++) mesh.setMatrixAt(start + i, HIDDEN)
}

// Başın tepesinin dünya konumu (etiket ve zZz için).
export function headTop(bones, target) {
  return target.set(0, HEAD_CROWN, 0).applyMatrix4(bones[2])
}

export { HIP_HEIGHT }
