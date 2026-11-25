// Avatar atölyesindeki seçeneklerin (saç, başlık, gözlük, sakal, bıyık, kıyafet ve aksesuarlar) küçük voxel
// görsellerini üretir:
// her seçenek avatar modelinden her beden için bir kez çizilir (scripts/avatar-thumb.html) ve
// public/avatar-thumbs/<tür>-<id>-<beden>.webp olarak yazılır (şeffaf zemin). Sakal ve bıyık yalnızca
// erkek bedende var; onlar yalnızca male olarak çizilir. Uygulama çalışırken görsel üretilmez; seçenek
// eklenince ya da model değişince bu script yeniden çalıştırılır.
//
// Kullanım (frontend klasöründen):
//   npm i --no-save puppeteer-core
//   node scripts/render-avatar-thumbs.mjs [tür | tür:id | tür:id:beden ...]   (tür: LISTS'teki adlar)
//   THUMB_RAW=1: kesmeden tam kareyi yazar (kesit ayarlarken ölçmek için)
// Ortam: CHROME_PATH (Chrome/Edge yolu), PUPPETEER_PATH (puppeteer-core başka yerdeyse).
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/avatar-thumbs')
const browserPath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : '/usr/bin/google-chrome')
// atölyede 56 px gösterilir; 2x keskinlik için 112 px kare. Sahne 224 × 304 px (CSS) çizilir, 2x
// piksel yoğunluğunda alınır ve kesilir.
const SIZE = 224
const EXTRA = 80
const DPR = 2
const OUT_PX = 112
const LIFT = 26
// sakal ve bıyık yalnızca erkek bedende var; diğer her şey iki bedende ayrı çizilir
const MALE_ONLY = ['beard', 'mustache']
const bodiesOf = (kind) => (MALE_ONLY.includes(kind) ? ['male'] : ['male', 'female'])
// kesit: gözlük, sakal, bıyık, kulaklık ve küpe yüze yakın (detay 56 px'te okunsun). Başlık saç gibi
// ölçülür: kafa gözlükteki boyda kalır, uzun başlıkta kesit yukarı büyür. Kıyafet ve diğer aksesuarlarda
// kameranın kendi odağı (upper, legs, feet, chest, wrist) zaten yakındır; kare olduğu gibi alınır.
const FACE_KINDS = ['glasses', 'beard', 'mustache', 'headphones', 'earrings']
// Kıyafet, boyun ve bilek: tam boy, platformsuz çizilir (avatar-thumb.jsx), figürün opak sınırları
// ölçülür ve figüre göre bir bölge kesilir. Figür küçük durduğu için sahne BODY_SCALE kat büyük çizilir.
// Oranlar figür yüksekliğine (H) ve genişliğine (W) göre: cy kesitin merkezi (tepeden), size kenar, dx yatay
// kayma (bilek: saat sağ elde).
const BODY_SCALE = 2
const BODY_CROP = {
  top: { cy: 0.45, size: 0.5 },
  neck: { cy: 0.4, size: 0.32 },
  bottom: { cy: 0.74, size: 0.46 },
  footwear: { cy: 0.91, size: 0.3 },
  wrist: { cy: 0.62, size: 0.3, dx: 0.3 },
  outfit: { cy: 0.53, size: 0.8 },
}
// Saç: kafa 56 px karede ~40 px olsun diye kesit kafaya göre sabittir (tepe odağında, crown: kafa
// ~110 px genişlik, saç tepesi ~y 85, çene ~y 205). Kesit varsayılanda kafayı ortalar; saç bunun üstüne taşarsa (afro, mohikan,
// topuz) kesit tepeye kadar büyür, yana taşarsa genişler. Böylece kafalar her seçenekte aynı boyda.
const HAIR = { size: 150, top: 70, bottom: 220, pad: 8, chin: 205 }
// Başlık: aynı yöntem. "hat" odağında kafa gözlükteki boyda ama ~22 px aşağıda (çene ~y 220); kesit
// varsayılanda gözlükteki gibi 150 px, uzun ya da geniş başlıkta (silindir, kovboy, büyücü) büyür.
const HAT = { size: 150, top: 115, bottom: 262, pad: 8, chin: 220 }
function clipOf(kind, box) {
  const cy = (SIZE + EXTRA) / 2
  let c
  if (BODY_CROP[kind]) {
    const k = BODY_CROP[kind]
    const h = box.bottom - box.top
    const w = box.right - box.left
    c = { size: k.size * h, x: (box.left + box.right) / 2 + (k.dx ?? 0) * w, y: box.top + k.cy * h }
  } else if (kind === 'hair') {
    const top = Math.min(HAIR.top, box.top - HAIR.pad)
    const size = Math.max(HAIR.size, HAIR.bottom - top, box.right - box.left + 2 * HAIR.pad)
    c = { size, x: (box.left + box.right) / 2, y: top + size / 2 }
  } else if (kind === 'hat') {
    const top = Math.min(HAT.top, box.top - HAT.pad)
    const size = Math.max(HAT.size, HAT.bottom - top, box.right - box.left + 2 * HAT.pad)
    c = { size, x: (box.left + box.right) / 2, y: top + size / 2 }
  } else if (kind === 'earrings') c = { size: 90, x: SIZE / 2 + 15, y: cy + 21 }
  else if (FACE_KINDS.includes(kind)) c = { size: 150, x: SIZE / 2 - 6, y: cy + 14 }
  else c = { size: SIZE, x: SIZE / 2, y: cy - LIFT }
  return { x: c.x - c.size / 2, y: c.y - c.size / 2, width: c.size, height: c.size, scale: OUT_PX / (c.size * DPR) }
}
// Saç kesiti için tam karenin opak sınırları (CSS px): en üst satır ve çenenin üstündeki yatay uçlar.
async function headBox(page, chinY) {
  const b64 = await page.screenshot({ type: 'png', omitBackground: true, encoding: 'base64' })
  return page.evaluate(
    async (b64, dpr, chin) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const cv = document.createElement('canvas')
      cv.width = img.width
      cv.height = img.height
      const g = cv.getContext('2d')
      g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, cv.width, cv.height).data
      let top = Infinity
      let bottom = -Infinity
      let left = Infinity
      let right = -Infinity
      for (let y = 0; y < Math.min(cv.height, chin * dpr); y++) {
        for (let x = 0; x < cv.width; x++) {
          if (d[(y * cv.width + x) * 4 + 3] < 40) continue
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
          left = Math.min(left, x)
          right = Math.max(right, x)
        }
      }
      return { top: top / dpr, bottom: bottom / dpr, left: left / dpr, right: right / dpr }
    },
    b64,
    DPR,
    chinY,
  )
}
// varsayılan açıdan dönüş (piksel × 0.01 rad; 4 px altı tıklama sayılır): çoğu seçenek varsayılan 3/4
// açıdan, arkası önemli saçlar (at kuyruğu, topuz, örgü) daha yandan görünür. Uzun ve yarım
// toplu saçlar önden 3/4 kalır: yandan tepe açısında yüz kaybolur, yalnızca saç bloğu görünür.
const YAW_PX = Number(process.env.THUMB_YAW_PX ?? 6)
const SIDE_HAIR = ['manbun', 'ponytail', 'bun', 'braid', 'pigtails']
const SIDE_YAW_PX = Number(process.env.THUMB_SIDE_YAW_PX ?? 115)
const yawOf = (kind, id) => (kind === 'hair' && SIDE_HAIR.includes(id) ? SIDE_YAW_PX : kind === 'earrings' ? EAR_YAW_PX : YAW_PX)

let puppeteer
try {
  puppeteer = (await import(process.env.PUPPETEER_PATH || 'puppeteer-core')).default
} catch {
  console.error('puppeteer-core bulunamadı. Önce: npm i --no-save puppeteer-core')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } })
await server.listen()
const base = server.resolvedUrls.local[0]
const O = await server.ssrLoadModule('/src/avatars/options.js')
// "Yok" seçenekleri çizilmez: atölye onları ikonla gösterir
const LISTS = {
  hair: O.HAIR_STYLES,
  hat: O.HATS,
  glasses: O.GLASSES,
  beard: O.BEARDS,
  mustache: O.MUSTACHES,
  top: O.TOPS,
  bottom: O.BOTTOMS,
  outfit: O.OUTFITS.filter((o) => o.id !== 'none'),
  footwear: O.FOOTWEAR,
  headphones: O.HEADPHONES.filter((o) => o.id !== 'none'),
  earrings: O.EARRINGS.filter((o) => o.id !== 'none'),
  neck: O.NECKWEAR.filter((o) => o.id !== 'none'),
  wrist: O.WRISTWEAR.filter((o) => o.id !== 'none'),
}
// kameranın türden farklı odağı gereken tek seçenekler
const focusOf = (kind, id) => (kind === 'headphones' && id === 'neck' ? 'chest' : '')
// küpe yandan görünsün: kulak kameraya döner; kesit kulağın çevresi (küpe 56 px'te seçilsin)
const EAR_YAW_PX = Number(process.env.THUMB_EAR_YAW_PX ?? 70)
const RAW = process.env.THUMB_RAW === '1'
// argüman: tür (hair), tek seçenek (hair:ponytail) ya da tek beden (hair:ponytail:female)
const picks = process.argv.slice(2).map((a) => a.split(':')).filter(([k]) => LISTS[k])
const jobs = (picks.length ? picks : Object.keys(LISTS).map((k) => [k])).flatMap(([kind, only, onlyBody]) =>
  LISTS[kind]
    .filter((o) => !only || o.id === only)
    .flatMap((o) => bodiesOf(kind).filter((b) => !onlyBody || b === onlyBody).map((b) => [kind, o.id, b])),
)

const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars'],
})

try {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  // sahne kare değil, aşağı uzun çizilir: kamera başın ortasına bakar; kare kesit LIFT kadar yukarıda
  // alınır ki saçın tepesi (afro, topuz) kesilmesin, omuzlar daha az görünsün
  for (const [kind, id, body] of jobs) {
    {
      const scale = BODY_CROP[kind] ? BODY_SCALE : 1
      await page.setViewport({ width: SIZE * scale, height: (SIZE + EXTRA) * scale, deviceScaleFactor: DPR })
      const focus = focusOf(kind, id)
      await page.goto(`${base}scripts/avatar-thumb.html?kind=${kind}&id=${id}&body=${body}${focus ? `&focus=${focus}` : ''}`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 900))
      // kısa sürükleme: sahneyi YAW kadar döndürür ve yeni kare ister (hareket azaltılmışken kamera ilk
      // karede başın eski konumuna bakar; ikinci kare güncel konumu kullanır)
      await page.mouse.move((SIZE * scale) / 2, (SIZE * scale) / 2)
      await page.mouse.down()
      await page.mouse.move((SIZE * scale) / 2 + yawOf(kind, id), (SIZE * scale) / 2, { steps: 4 })
      await page.mouse.up()
      await new Promise((r) => setTimeout(r, 500))
      const box =
        kind === 'hair' ? await headBox(page, HAIR.chin) : kind === 'hat' ? await headBox(page, HAT.chin) : BODY_CROP[kind] ? await headBox(page, Infinity) : null
      const out = resolve(outDir, `${kind}-${id}-${body}.webp`)
      if (RAW) await page.screenshot({ path: out.replace(/\.webp$/, '.raw.png'), type: 'png', omitBackground: true })
      else await page.screenshot({ path: out, type: 'webp', quality: 85, omitBackground: true, clip: clipOf(kind, box) })
      console.log('yazıldı', out)
    }
  }
} finally {
  await browser.close()
  await server.close()
}
