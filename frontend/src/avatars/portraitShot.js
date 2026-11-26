import { BoxGeometry, Color, DirectionalLight, HemisphereLight, InstancedMesh, MeshLambertMaterial, NoToneMapping, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three'
import { BONE_INDEX, SCALE, buildAvatarParts } from './model'
import { standPose } from './poses'
import { computeBones, createBoneMatrices, headTop, writeParts } from './render'

// Yakın plan avatar portresi (oda kişi kartı): avatarın kendisinden baş ve omuzlar, hafif sağa dönük.
// Bütün uygulama için tek bir WebGL çizici; ilk istekte kurulur. Her görünüş bir kez çizilir ve PNG
// adresi olarak saklanır (görünüş değişince anahtar değişir, yeniden çizilir). Böylece 10 kişilik odada
// da en fazla bir ek WebGL bağlamı açılır ve kart her karede çizim yapmaz.

// çizim boyutu (piksel): kart 72 px gösterir, 2× ekranlarda da keskin
const SIZE = 160
const CACHE_MAX = 32
const DEG = Math.PI / 180
// kamera: önizlemelerde π/4 (karakter sola bakar); burada eksi yönde, karakter hafifçe sağa döner
const AZIMUTH = -24 * DEG
const ELEVATION = 10 * DEG
// kadraj (m): baş ve omuzlar; uzun şapka sığmazsa büyür
const SPAN = 0.82
const { head: HEAD, torso: TORSO } = BONE_INDEX
const HEAD_CENTER = new Vector3(0, 0.2 * SCALE, 0)
const NECK_POINT = new Vector3(0, 0.36 * SCALE, 0.04 * SCALE)

const cache = new Map()
let ctx = null

function setup() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(1)
  renderer.setSize(SIZE, SIZE, false)
  renderer.toneMapping = NoToneMapping
  const scene = new Scene()
  scene.add(new HemisphereLight('#fff6e8', '#8a7a68', 2.2))
  // ışık önizlemelerdekiyle aynı açıda, kameranın tarafına aynalanmış
  const sun = new DirectionalLight('#fff1d8', 1.6)
  sun.position.set(-3, 6, 4)
  scene.add(sun)
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 50)
  const next = { renderer, scene, camera, box: new BoxGeometry(), material: new MeshLambertMaterial(), bones: createBoneMatrices() }
  canvas.addEventListener('webglcontextlost', () => {
    if (ctx === next) ctx = null
    cache.clear()
  })
  return next
}

const keyOf = (avatar) => JSON.stringify({ ...avatar, name: '' })

/** Daha önce çizilmiş portrenin adresi ya da null. */
export function cachedPortrait(avatar) {
  return avatar ? (cache.get(keyOf(avatar)) ?? null) : null
}

/** Portreyi çizer (önbellekteyse çizmez) ve PNG adresini döndürür; WebGL yoksa null. */
export function drawPortrait(avatar) {
  if (!avatar) return null
  const key = keyOf(avatar)
  const hit = cache.get(key)
  if (hit) {
    // en son kullanılan sona geçer (LRU)
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  ctx = ctx ?? setup()
  if (!ctx) return null
  const { renderer, scene, camera, box, material, bones } = ctx
  const parts = buildAvatarParts(avatar)
  const pose = standPose(0, 0)
  computeBones(bones, pose, 0, 0, 0)
  const mesh = new InstancedMesh(box, material, parts.length)
  const color = new Color()
  parts.forEach((p, i) => mesh.setColorAt(i, color.set(p.color)))
  writeParts(mesh, 0, parts, bones, pose.show)
  mesh.frustumCulled = false

  const target = HEAD_CENTER.clone().applyMatrix4(bones[HEAD]).lerp(NECK_POINT.clone().applyMatrix4(bones[TORSO]), 0.3)
  const top = headTop(bones, new Vector3(), parts.crown)
  const span = Math.max(SPAN, (top.y - target.y + 0.1) * 2)
  camera.left = camera.bottom = -span / 2
  camera.right = camera.top = span / 2
  camera.updateProjectionMatrix()
  const flat = Math.cos(ELEVATION) * 10
  camera.position.set(target.x + Math.sin(AZIMUTH) * flat, target.y + Math.sin(ELEVATION) * 10, target.z + Math.cos(AZIMUTH) * flat)
  camera.lookAt(target)

  scene.add(mesh)
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(mesh)
  mesh.dispose()

  cache.set(key, url)
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
  return url
}
