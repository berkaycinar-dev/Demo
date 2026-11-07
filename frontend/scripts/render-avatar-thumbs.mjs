// Avatar atölyesindeki saç, başlık, gözlük, sakal ve bıyık seçeneklerinin küçük voxel görsellerini üretir:
// her seçenek avatar modelinden bir kez çizilir (scripts/avatar-thumb.html) ve
// public/avatar-thumbs/<tür>-<id>.webp olarak yazılır (şeffaf zemin). Uygulama çalışırken görsel
// üretilmez; seçenek eklenince ya da model değişince bu script yeniden çalıştırılır.
//
// Kullanım (frontend klasöründen):
//   npm i --no-save puppeteer-core
//   node scripts/render-avatar-thumbs.mjs [tür | tür:id ...]   (tür: hair hat glasses beard mustache)
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
// atölyede 56 px gösterilir; 2x keskinlik için 112 px kare; sahne 224 px genişlikte çizilip kesilir
const SIZE = 224
const OUT_PX = 112
const EXTRA = 80
const LIFT = 26
// kesit: saç ve başlık bütün başı alır; gözlük, sakal ve bıyık yüze yakın (detay 56 px'te okunsun).
// Sonuç her türde OUT_PX kare (ölçek kesite göre).
const FACE_KINDS = ['glasses', 'beard', 'mustache']
function clipOf(kind) {
  const cy = (SIZE + EXTRA) / 2
  const c = FACE_KINDS.includes(kind) ? { size: 150, x: SIZE / 2 - 6, y: cy + 14 } : { size: SIZE, x: SIZE / 2, y: cy - LIFT }
  return { x: c.x - c.size / 2, y: c.y - c.size / 2, width: c.size, height: c.size, scale: OUT_PX / c.size }
}
// varsayılan açıdan dönüş (piksel × 0.01 rad; 4 px altı tıklama sayılır): çoğu seçenek varsayılan 3/4
// açıdan, arkası önemli saçlar (at kuyruğu, topuz, örgü) daha yandan görünür
const YAW_PX = Number(process.env.THUMB_YAW_PX ?? 6)
const SIDE_HAIR = ['manbun', 'ponytail', 'bun', 'braid', 'halfup', 'pigtails', 'long', 'wavy']
const SIDE_YAW_PX = Number(process.env.THUMB_SIDE_YAW_PX ?? 115)
const yawOf = (kind, id) => (kind === 'hair' && SIDE_HAIR.includes(id) ? SIDE_YAW_PX : YAW_PX)

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
const { HAIR_STYLES, HATS, GLASSES, BEARDS, MUSTACHES } = await server.ssrLoadModule('/src/avatars/options.js')
const LISTS = { hair: HAIR_STYLES, hat: HATS, glasses: GLASSES, beard: BEARDS, mustache: MUSTACHES }
// argüman: tür (hair) ya da tek seçenek (hair:ponytail)
const picks = process.argv.slice(2).map((a) => a.split(':')).filter(([k]) => LISTS[k])
const jobs = (picks.length ? picks : Object.keys(LISTS).map((k) => [k])).flatMap(([kind, only]) =>
  LISTS[kind].filter((o) => !only || o.id === only).map((o) => [kind, o.id]),
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
  await page.setViewport({ width: SIZE, height: SIZE + EXTRA, deviceScaleFactor: 1 })
  for (const [kind, id] of jobs) {
    {
      await page.goto(`${base}scripts/avatar-thumb.html?kind=${kind}&id=${id}`, { waitUntil: 'networkidle0' })
      await new Promise((r) => setTimeout(r, 900))
      // kısa sürükleme: sahneyi YAW kadar döndürür ve yeni kare ister (hareket azaltılmışken kamera ilk
      // karede başın eski konumuna bakar; ikinci kare güncel konumu kullanır)
      await page.mouse.move(SIZE / 2, SIZE / 2)
      await page.mouse.down()
      await page.mouse.move(SIZE / 2 + yawOf(kind, id), SIZE / 2, { steps: 4 })
      await page.mouse.up()
      await new Promise((r) => setTimeout(r, 500))
      const out = resolve(outDir, `${kind}-${id}.webp`)
      await page.screenshot({ path: out, type: 'webp', quality: 85, omitBackground: true, clip: clipOf(kind) })
      console.log('yazıldı', out)
    }
  }
} finally {
  await browser.close()
  await server.close()
}
