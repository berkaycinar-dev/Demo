// Markanın statik görsellerini üretir: uygulama ikonları (public/icons/) ve paylaşım görseli
// (public/og-image.png). Hepsi koddan çizilir: marka işareti SiteChrome.jsx BrandMark ile aynı SVG,
// paylaşım görselindeki oda public/room-thumbs/library-evening.webp (render-room-thumbs.mjs çıktısı),
// yazı tipleri src/site/fonts altındaki kendi barındırılan Pixelify Sans ve Inter (OFL). Dışarıdan
// görsel ya da üretken model çıktısı yoktur. Marka, renk ya da başlık değişince yeniden çalıştırılır.
//
// Kullanım (frontend klasöründen):
//   npm i --no-save puppeteer-core
//   node scripts/render-brand-assets.mjs
// Ortam: CHROME_PATH (Chrome/Edge yolu).
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')
const browserPath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : '/usr/bin/google-chrome')

let puppeteer
try {
  puppeteer = (await import(process.env.PUPPETEER_PATH || 'puppeteer-core')).default
} catch {
  console.error('puppeteer-core bulunamadı: npm i --no-save puppeteer-core')
  process.exit(1)
}

const url = (p) => pathToFileURL(resolve(root, p)).href
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><path d="M14 2.5 25 8.5 14 14.5 3 8.5Z" fill="#e3a47f"/><path d="M3 8.5 14 14.5V26.5L3 20.5Z" fill="#b5502d"/><path d="M25 8.5 14 14.5V26.5L25 20.5Z" fill="#7d3519"/><path d="M6.5 14.4 10.5 16.6V24.6L6.5 22.4Z" fill="#ffd89a"/></svg>`
const FONTS = `
@font-face { font-family: 'Pixelify Sans'; src: url('${url('src/site/fonts/pixelify-sans/pixelify-sans-latin-ext.woff2')}') format('woff2'); }
@font-face { font-family: 'Pixelify Sans'; src: url('${url('src/site/fonts/pixelify-sans/pixelify-sans-latin.woff2')}') format('woff2'); }
@font-face { font-family: 'Inter'; src: url('${url('src/site/fonts/inter/inter-tr.woff2')}') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'Inter'; src: url('${url('src/site/fonts/inter/inter-latin-ext.woff2')}') format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
`

// Uygulama ikonu: akşam odasının koyu ahşap zemini, ortada marka işareti. maskable için işaret
// güvenli bölgede (%62) kalır.
const icon = (size, scale = 0.62) => `<!doctype html><html><head><style>${FONTS}
html, body { width: ${size}px; height: ${size}px; }
body { display: grid; place-items: center; background: radial-gradient(70% 70% at 50% 40%, #4a3f36, #2a2622); }
svg { width: ${Math.round(size * scale)}px; height: ${Math.round(size * scale)}px; }
</style></head><body>${MARK}</body></html>`

// Paylaşım görseli 1200×630: solda ad ve tek cümle, sağda akşam ışığında kütüphane odası.
const og = `<!doctype html><html lang="tr"><head><style>${FONTS}
html, body { width: 1200px; height: 630px; }
body { position: relative; overflow: hidden; display: grid; grid-template-columns: 1fr 600px; align-items: center;
  padding: 0 0 0 80px; background: radial-gradient(80% 90% at 75% 50%, #3b332b, #24211e 70%); color: #efe9e1; font-family: Inter, sans-serif; }
.brand { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
.brand svg { width: 56px; height: 56px; }
.brand span { font-size: 34px; font-weight: 700; letter-spacing: -0.01em; }
h1 { font-family: 'Pixelify Sans', sans-serif; font-weight: 500; font-size: 66px; line-height: 1.12; letter-spacing: 0; }
p { margin-top: 28px; max-width: 470px; color: #d4ccc1; font-size: 26px; line-height: 1.45; }
img { width: 640px; height: auto; margin-left: -40px; filter: drop-shadow(0 30px 40px rgba(0,0,0,.45)); }
</style></head><body>
<div><div class="brand">${MARK}<span>Odakhane</span></div>
<h1>Birlikte çalışınca odaklanmak kolaylaşır.</h1>
<p>Kamerasız, sessiz, birlikte: avatarınla bir odaya otur, sayacını başlat.</p></div>
<img src="${url('public/room-thumbs/library-evening.webp')}" alt="">
</body></html>`

const work = join(tmpdir(), `odakhane-brand-${process.pid}`)
mkdirSync(work, { recursive: true })
mkdirSync(resolve(pub, 'icons'), { recursive: true })
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
const render = async (name, html, width, height, out) => {
  const file = join(work, `${name}.html`)
  writeFileSync(file, html)
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: out, type: 'png' })
  console.log('yazıldı', out)
}
await render('apple', icon(180), 180, 180, resolve(pub, 'icons/apple-touch-icon.png'))
await render('i192', icon(192), 192, 192, resolve(pub, 'icons/icon-192.png'))
await render('i512', icon(512), 512, 512, resolve(pub, 'icons/icon-512.png'))
await render('og', og, 1200, 630, resolve(pub, 'og-image.png'))
await browser.close()
rmSync(work, { recursive: true, force: true })
