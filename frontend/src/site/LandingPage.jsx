import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { QUOTES, quoteForVisit } from './quotes'
import RoomShot from './RoomShot'
import { useDocumentDark } from './roomThumbs'
import { scrollToId } from './scroll'
import Dotted from './Dotted'
import LandingDemo from './LandingDemo'

const HERO_THEME = 'library'
const OPEN_ROOMS_SHOWN = 3

// Ana sayfa: lobinin kapısı. Önce oda görünür, sonra lobideki açık odalar ve on tema; en sonda bir oturum
// canlı bir odada oynar (LandingDemo). Ayrı adım kartları, özellik üçlüsü ve kapanış bandı yok.
// Oda arkadaşları şimdilik simülasyon olduğundan "şu an N kişi" gibi canlı sayı gösterilmez; yalnızca kapasite.
export default function LandingPage({ user, avatar, rooms = [], onGo, onEnter, isDark, onToggleMode }) {
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
            <RoomShot theme={HERO_THEME} className="lp-hero__img" eager />
            <figcaption>
              {THEMES[HERO_THEME].label}, {dark ? 'akşam ışığında' : 'gündüz'}
            </figcaption>
          </figure>

          <div className="lp-hero__text">
            <h1 id="lpBaslik" className="lp-h1">
              Birlikte çalışınca odaklanmak kolaylaşır.
            </h1>
            <p className="lp-lead">
              Odakhane, kamera ve mikrofon olmadan başkalarıyla aynı odada çalışma hissini verir. Bir oda seç, pomodoro sayacını başlat; masandaki avatarın sen çalışırken seninle oturur.
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
                      <Dotted parts={[THEMES[room.theme].label, `${room.capacity} kişilik`]} keep />
                    </span>
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

      <LandingDemo avatar={avatar} quote={[quote, by]} isDark={isDark} onToggleMode={onToggleMode} />
    </div>
  )
}
