import { useEffect, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { QUOTES, quoteForVisit } from './quotes'
import RoomShot from './RoomShot'
import RoomMates from './RoomMates'
import { useDocumentDark } from './roomThumbs'
import { scrollToId } from './scroll'
import Dotted from './Dotted'
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

// Ana sayfa: lobinin kapısı. Önce oda görünür, sonra lobideki açık odalar ve on tema; en sonda bir oturum
// canlı bir odada oynar (LandingDemo). Ayrı adım kartları, özellik üçlüsü ve kapanış bandı yok.
// Oda arkadaşları şimdilik simülasyon olduğundan "şu an N kişi" gibi canlı sayı gösterilmez; kapasite ve
// odaya girince göreceğin yüzler (RoomMates) gösterilir. Hero'daki oda masalarında çalışan avatarlarla çizilir.
export default function LandingPage({ user, avatar, rooms = [], onGo, onEnter }) {
  const [quote, by] = QUOTES[quoteForVisit()]
  const dark = useDocumentDark()
  const start = () => onGo(user ? 'sayfam' : 'kayit')
  const sit = (room) => (user ? onEnter(room) : onGo('kayit'))
  const openRooms = rooms.filter((r) => r.access === 'public').slice(0, OPEN_ROOMS_SHOWN)

  return (
    <div className="landing">
      <section className="lp-section lp-hero-wrap" aria-labelledby="lpBaslik">
        <div className="lp-hero">
          <figure className="lp-hero__room">
            <HeroRoom dark={dark} />
            <figcaption>
              {THEMES[HERO_THEME].label}, {dark ? 'akşam ışığında' : 'gündüz'}
            </figcaption>
          </figure>

          <div className="lp-hero__text">
            <h1 id="lpBaslik" className="lp-h1">
              Birlikte çalışınca odaklanmak kolaylaşır.
            </h1>
            <p className="lp-lead">
              SameDesk, kamera ve mikrofon olmadan başkalarıyla aynı odada çalışma hissini verir. Bir oda seç, pomodoro sayacını başlat; masandaki avatarın sen çalışırken seninle oturur.
            </p>
            <div className="site-actions">
              <button type="button" className="site-btn site-btn--primary site-btn--xl" onClick={start}>
                {user ? 'Sayfama git' : 'Hemen başla'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button type="button" className="site-btn site-btn--xl lp-btn-surface" onClick={() => scrollToId('odalar')}>
                Odalara göz at
              </button>
            </div>
          </div>
        </div>

        {openRooms.length > 0 && (
          <section className="lp-open" aria-labelledby="acikBaslik">
            <div className="lp-open__head">
              <h2 id="acikBaslik">Lobide açık odalar</h2>
              {/* lobi oturum ister: misafire bağlantı nereye gittiğini söyler */}
              <button type="button" className="link-btn link-btn--strong" onClick={() => onGo(user ? 'lobi' : 'giris')}>
                {user ? 'Tüm aktif odaları gör' : 'Tüm odalar için giriş yap'}
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
                      <Dotted parts={[THEMES[room.theme].label, `${room.capacity} kişilik`]} keep />
                    </span>
                    <RoomMates room={room} className="room-mates--small" />
                  </span>
                  <button type="button" className="site-btn" onClick={() => sit(room)} aria-label={`${room.name} odasına gir`}>
                    Gir
                  </button>
                </li>
              ))}
            </ul>
            {!user && <p className="lp-open__note">Girmek için önce bir hesap açarsın; bir dakika sürer.</p>}
          </section>
        )}
      </section>

      <section id="odalar" className="lp-section lp-themes" aria-labelledby="odalarBaslik">
        <div className="lp-inner">
          <div className="section-head section-head--row">
            <h2 id="odalarBaslik" className="lp-h2">
              Nasıl çalışmayı seviyorsan öyle bir oda
            </h2>
            <button type="button" className="link-btn link-btn--strong" onClick={() => onGo(user ? 'olustur' : 'kayit')}>
              Kendi odanı kur
            </button>
          </div>
        </div>
        {/* yatay şerit: on tema; kaydırılabilir bölge klavyeyle de kayar */}
        <ul className="lp-strip" tabIndex={0} aria-label={`${LISTED_THEMES.length} oda teması, yana kaydır`}>
          {LISTED_THEMES.map(([key, t]) => (
            <li key={key} className="lp-strip__item">
              <span className="theme-option__shot">
                <RoomShot theme={key} />
              </span>
              <span className="theme-option__name">{t.label}</span>
              <span className="theme-option__desc">{t.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <LandingDemo avatar={avatar} quote={[quote, by]} />
    </div>
  )
}
