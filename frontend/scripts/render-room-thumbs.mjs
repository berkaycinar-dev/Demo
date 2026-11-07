// Oda seçim kartlarının statik izometrik görsellerini üretir: her tema 3D sahneden bir kez çizilir ve
// public/room-thumbs/<tema>.webp olarak yazılır (şeffaf zemin, gündüz ışığı). Uygulama çalışırken
// görsel üretilmez; tema eklenince ya da odalar değişince bu script yeniden çalıştırılır.
//
// Kullanım (frontend klasöründen):
//   npm i --no-save puppeteer-core
//   node scripts/render-room-thumbs.mjs [tema ...]
// Ortam: CHROME_PATH (Chrome/Edge yolu), THUMB_CAPACITY (varsayılan 6), THUMB_TIME (day | evening | night).
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/room-thumbs')
const THEMES = ['library', 'cabin', 'office', 'teagarden', 'camp', 'space', 'underwater', 'bar', 'treehouse', 'cyber']
const only = process.argv.slice(2)
const capacity = Number(process.env.THUMB_CAPACITY) || 6
const time = process.env.THUMB_TIME || 'day'
const browserPath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : '/usr/bin/google-chrome')
// 4:3, kartta en çok ~240 px genişlikte gösterilir; 2x keskinlik için 480 px
const WIDTH = 480
const HEIGHT = 360

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
const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars'],
})

try {
  const page = await browser.newPage()
  // reduced motion: avatar ve efekt animasyonları durur, kare kararlı olur
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
  for (const theme of only.length ? only : THEMES) {
    await page.goto(`${base}?theme=${theme}&c=${capacity}&t=${time}`, { waitUntil: 'networkidle0' })
    // panel, düğmeler ve ipucu görünmez; sahne zemini şeffaf (kartın kendi yüzeyi görünür)
    await page.addStyleTag({
      content: `.room-preview__panel, .room-canvas__toolbar, .room-canvas__hint { display: none !important; }
        html, body, #root, .room-preview, .room-canvas { background: transparent !important; }`,
    })
    await new Promise((r) => setTimeout(r, 3500))
    const out = resolve(outDir, `${theme}.webp`)
    const canvas = await page.$('.room-canvas')
    await canvas.screenshot({ path: out, type: 'webp', quality: 82, omitBackground: true })
    console.log('yazıldı', out)
  }
} finally {
  await browser.close()
  await server.close()
}
