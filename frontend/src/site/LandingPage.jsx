import { useEffect, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { QUOTES, quoteForVisit } from './quotes'
import RoomShot, { ThemeShot } from './RoomShot'
import { useDocumentDark } from './roomThumbs'
import { scrollToId } from './scroll'
import Dotted from './Dotted'
import { membersLabel } from './access'
import LandingDemo from './LandingDemo'

const HERO_THEME = 'library'
// hero'daki canlı oda: görseldekiyle aynı kapasite ve kişiler (scripts/render-room-thumbs.mjs THUMB_CAPACITY)
const HERO_CAPACITY = 6
// sahne ilk boyamadan sonra kurulur: hero görseli sayfanın ilk görüntüsü olarak kalır
const HERO_LIVE_DELAY_MS = 400

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// gün zamanı görseldeki ve altındaki yazıdakiyle aynı: açık modda gündüz, koyu modda akşam (saate bakmaz)
function HeroLive({ dark }) {
  const { Room } = THEMES[HERO_THEME]
  const { occupants } = useRoomPeople({ capacity: HERO_CAPACITY, seed: HERO_CAPACITY, forced: 'focus' })
  return (
    <Room capacity={HERO_CAPACITY} canvasStyle={{ width: '100%' }} showcase hint={false} defaultTimeOfDay={dark ? 'evening' : 'day'}>
      <AvatarCrowd occupants={occupants} theme={HERO_THEME} />
    </Room>
  )
}

// Hero odası: önce görsel; sayfa açıldıktan kısa süre sonra aynı oda canlı (avatarlar çalışır, kamera
// yavaşça salınır) görselin yerine geçer. Hero ekrandan çıkınca canlı sahne kaldırılır, görsel kalır:
// aşağıdaki tanıtım odasıyla aynı anda iki 3D sahne çalışmaz. "Hareketi azalt"ta yalnızca görsel.
function HeroRoom({ dark }) {
  const ref = useRef(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || typeof IntersectionObserver === 'undefined') return undefined
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer)
      if (e.isIntersecting) timer = setTimeout(() => setLive(true), HERO_LIVE_DELAY_MS)
      else setLive(false)
    })
    io.observe(el)
    return () => {
      clearTimeout(timer)
      io.disconnect()
    }
  }, [])
  return (
    <div ref={ref} className="lp-hero__scene" data-live={live || undefined}>
      <RoomShot theme={HERO_THEME} className="lp-hero__img" eager people />
      {live && (
        <div className="lp-hero__live">
          <HeroLive key={dark ? 'evening' : 'day'} dark={dark} />
        </div>
      )}
    </div>
  )
}
const OPEN_ROOMS_SHOWN = 3

const COPY = {
  title: 'Odana hoş geldin.',
  sub: 'Lamba yanık, masan hazır.',
  lead: 'Birlikte çalışınca odaklanmak kolaylaşır. Kamera ve mikrofon yok; bir oda seç, sayacını başlat, avatarın masanda seninle otursun.',
  open: 'Kapıyı aç',
  home: 'Sayfama git',
  corridor: 'Odaları gör',
  door: 'Kapı',
  doorOpen: (pct) => `Yüzde ${pct} açık`,
  doorHint: 'Kapıyı sürükleyerek aç ya da kapat',
  roomLabel: (name, dark) => `${name}, ${dark ? 'akşam ışığında' : 'gündüz'}`,
  corridorEyebrow: 'Gece koridoru',
  corridorTitle: 'On kapı, on oda',
  build: 'Kendi odanı kur',
  doorsLabel: (n) => `${n} oda teması`,
  start: 'Hemen başla',
  quoteNote: 'Her 25 dakikalık blok bir damla. Masan seni bekliyor.',
}

// Sürüklenebilir kapı kanadı: menteşe solda. Sola çekince açılır, sağa itince kapanır; klavyede ok tuşları,
// Home (kapalı) ve End (sonuna kadar açık). Açı 0 (kapalı) ile DOOR_MAX (tam açık) arasında; sayfa aralık başlar.
const DOOR_MAX = 105
const DOOR_START = 72
const DOOR_KEY_STEP = 10
const RAD = Math.PI / 180
// CSS'teki perspective(1400px) ile aynı (pages.css .lp-door__leaf)
const DOOR_PERSPECTIVE = 1400

// Kanadın serbest kenarının ekrandaki yeri (menteşeden uzaklık, px). Kanat rotateY(-açı) ile izleyiciye doğru
// döner; perspektif menteşeden bakar (transform-origin: left), öne gelen kenar büyür: x = W·cos·P/(P − W·sin).
// Tarayıcıda ölçülen kenar yerleriyle birebir tutar (W 732: 72° → 450 px, 90° → 0, 105° → −382).
function edgeAt(deg, width) {
  const a = deg * RAD
  return (width * Math.cos(a) * DOOR_PERSPECTIVE) / (DOOR_PERSPECTIVE - width * Math.sin(a))
}

// Kapalıya yakın kanat izleyiciye gelirken kenar önce sağa büyür (tepe ~20-30°), sonra sola gider.
// Tepe ile tam açık arasında edgeAt azalır: açı orada ikili aramayla bulunur. İmleç tepenin de sağına itilirse
// kapı kemer genişliğinin onda biri boyunca yumuşakça tam kapanır (sıçrama yok).
function peakOf(width) {
  let best = 0
  for (let d = 0; d <= 60; d += 0.25) if (edgeAt(d, width) > edgeAt(best, width)) best = d
  return best
}

function angleFor(edge, width, peak) {
  const top = edgeAt(peak, width)
  if (edge >= top) return peak * Math.max(0, 1 - (edge - top) / (width * 0.1))
  let lo = peak
  let hi = DOOR_MAX
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (edgeAt(mid, width) > edge) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// Kanadın serbest kenarı imleci izler: kenarın ekrandaki yeri perspektifle birlikte hesaplanır (edgeAt), açı
// ondan geri çevrilir. Tutulan nokta ile kenar arasındaki fark korunur, kanadın ortasından tutunca kapı
// sıçramaz. Güncellemeler ekran yenilemesine bağlıdır (requestAnimationFrame): hızlı fare hareketinde de akıcı.
function DoorLeaf() {
  const [angle, setAngle] = useState(DOOR_START)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  const frame = useRef(0)
  const clamp = (a) => Math.min(DOOR_MAX, Math.max(0, a))
  const pct = Math.round((angle / DOOR_MAX) * 100)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    const arch = e.currentTarget.parentElement
    if (!arch) return
    // menteşe: kemerin iç sol kenarı (çerçeve kalınlığı clientLeft); genişlik: kemerin iç genişliği
    const hinge = arch.getBoundingClientRect().left + arch.clientLeft
    const width = arch.clientWidth || 1
    const edge = hinge + edgeAt(angle, width)
    drag.current = { hinge, width, peak: peakOf(width), offset: edge - e.clientX, x: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const apply = (d) => setAngle(clamp(angleFor(d.x + d.offset - d.hinge, d.width, d.peak)))
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    d.x = e.clientX
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      if (drag.current) apply(drag.current)
    })
  }
  // bırakınca bekleyen son kare beklenmez: son konum hemen uygulanır (hızlı sürüklemede kapı geride kalmaz)
  const end = (e) => {
    const d = drag.current
    if (!d) return
    cancelAnimationFrame(frame.current)
    frame.current = 0
    if (e?.type === 'pointerup') d.x = e.clientX
    apply(d)
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e) => {
    const next = {
      ArrowLeft: angle + DOOR_KEY_STEP,
      ArrowUp: angle + DOOR_KEY_STEP,
      ArrowRight: angle - DOOR_KEY_STEP,
      ArrowDown: angle - DOOR_KEY_STEP,
      Home: 0,
      End: DOOR_MAX,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    setAngle(clamp(next))
  }

  return (
    <span
      className="lp-door__leaf"
      role="slider"
      tabIndex={0}
      aria-label={COPY.door}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={COPY.doorOpen(pct)}
      title={COPY.doorHint}
      data-dragging={dragging || undefined}
      style={{ '--door-angle': `${-angle}deg` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      <span className="lp-door__knob" aria-hidden="true" />
    </span>
  )
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

// Ana sayfa: odanın kapısı. Üstte tabela ve aralık bir kapı; ardında oda (önce görsel, sonra canlı sahne).
// Altında (yalnızca giriş yapmışsa) lobideki açık odalar, sonra on temanın kapılarından oluşan koridor (her
// modda "gece": kapıların ardında akşam ışığı), bir oturumun canlı odada oynadığı tanıtım (LandingDemo;
// adımlar direğe çakılı ok tabelalarda) ve en sonda günün sözü levhası. Açık odalar sunucudan gelir;
// misafire örnek oda uydurulmaz. Kartta "şu an N kişi" yazılmaz: kapasite ve sunucunun verdiği üye sayısı.
export default function LandingPage({ user, avatar, rooms = [], onGo, onEnter }) {
  const [quote, by] = QUOTES[quoteForVisit()]
  const dark = useDocumentDark()
  const start = () => onGo(user ? 'sayfam' : 'kayit')
  const openRooms = rooms.filter((r) => r.access === 'public').slice(0, OPEN_ROOMS_SHOWN)

  return (
    <div className="landing">
      <section className="lp-section lp-door-wrap" aria-labelledby="lpBaslik">
        <div className="lp-door">
          <div className="lp-door__sign material-sign">
            <h1 id="lpBaslik" className="lp-h1">
              {COPY.title}
            </h1>
            <p className="lp-door__sub">{COPY.sub}</p>
          </div>
          <figure className="lp-door__frame">
            <div className="lp-door__arch">
              <HeroRoom dark={dark} />
              {/* aralık kapı kanadı: kullanıcı sürükleyip açar ya da kapatır */}
              <DoorLeaf />
            </div>
            <span className="lp-door__sill" aria-hidden="true" />
            <span className="lp-door__hint" aria-hidden="true">
              {COPY.doorHint}
            </span>
            <figcaption className="visually-hidden">{COPY.roomLabel(THEMES[HERO_THEME].label, dark)}</figcaption>
          </figure>
          <p className="lp-lead lp-door__lead">{COPY.lead}</p>
          <div className="site-actions lp-door__actions">
            <button type="button" className="site-btn site-btn--primary site-btn--xl" onClick={start}>
              {user ? COPY.home : COPY.open}
              <Arrow />
            </button>
            <button type="button" className="site-btn site-btn--xl lp-btn-surface" onClick={() => scrollToId('odalar')}>
              {COPY.corridor}
            </button>
          </div>
        </div>

        {openRooms.length > 0 && (
          <section className="lp-open" aria-labelledby="acikBaslik">
            <div className="lp-open__head">
              <h2 id="acikBaslik">Lobide açık odalar</h2>
              <button type="button" className="link-btn link-btn--strong" onClick={() => onGo('lobi')}>
                Tüm aktif odaları gör
              </button>
            </div>
            <ul className="lp-open__list">
              {openRooms.map((room) => (
                <li key={room.id} className="lp-open__room">
                  <RoomShot theme={room.theme} className="lp-open__img" />
                  <span className="lp-open__text">
                    <strong>
                      <Dotted text={room.name} />
                    </strong>
                    <span>
                      <Dotted parts={[THEMES[room.theme].label, `${room.capacity} kişilik`, membersLabel(room)].filter(Boolean)} keep />
                    </span>
                  </span>
                  <button type="button" className="site-btn" onClick={() => onEnter(room)} aria-label={`${room.name} odasına gir`}>
                    Gir
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      {/* koridor her modda gece: koyu token'lar (material-sign), kapıların ardında akşam ışığı */}
      <section id="odalar" className="lp-section lp-corridor material-sign" aria-labelledby="odalarBaslik">
        <div className="lp-inner">
          <div className="lp-corridor__head">
            <div>
              <span className="lp-corridor__eyebrow">{COPY.corridorEyebrow}</span>
              <h2 id="odalarBaslik" className="lp-h2">
                {COPY.corridorTitle}
              </h2>
            </div>
            <button type="button" className="link-btn link-btn--strong" onClick={() => onGo(user ? 'olustur' : 'kayit')}>
              {COPY.build}
            </button>
          </div>
          <ul className="lp-doors" aria-label={COPY.doorsLabel(LISTED_THEMES.length)}>
            {LISTED_THEMES.map(([key, t]) => (
              <li key={key} className="lp-doors__item">
                <span className="lp-doors__lamp" aria-hidden="true" />
                <span className="lp-doors__door">
                  <ThemeShot theme={key} dark className="lp-doors__img" />
                </span>
                <span className="lp-doors__plate">{t.label}</span>
                <span className="lp-doors__desc">{t.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LandingDemo avatar={avatar} />

      <section className="lp-section lp-quote-wrap" aria-label="Günün sözü">
        <div className="lp-inner lp-quote material-sign">
          <figure className="lp-quote__text">
            <blockquote>{quote}</blockquote>
            <figcaption>
              {by} · {COPY.quoteNote}
            </figcaption>
          </figure>
          <button type="button" className="site-btn site-btn--primary site-btn--xl" onClick={start}>
            {user ? COPY.home : COPY.start}
          </button>
        </div>
      </section>
    </div>
  )
}
