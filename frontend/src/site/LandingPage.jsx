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
  corridor: 'Koridoru gez',
  roomLabel: (name, dark) => `${name}, ${dark ? 'akşam ışığında' : 'gündüz'}`,
  corridorEyebrow: 'Gece koridoru',
  corridorTitle: 'On kapı, on oda',
  build: 'Kendi odanı kur',
  doorsLabel: (n) => `${n} oda teması`,
  start: 'Hemen başla',
  quoteNote: 'Her 25 dakikalık blok bir damla. Masan seni bekliyor.',
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
              {/* aralık kapı kanadı: süs */}
              <span className="lp-door__leaf" aria-hidden="true">
                <span className="lp-door__knob" />
              </span>
            </div>
            <span className="lp-door__sill" aria-hidden="true" />
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
