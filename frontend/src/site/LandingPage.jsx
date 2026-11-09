import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { QUOTES, quoteForVisit } from './quotes'
import RoomShot from './RoomShot'
import { useDocumentDark } from './roomThumbs'
import { scrollToId } from './scroll'

const HERO_THEME = 'library'
const OPEN_ROOMS_SHOWN = 3

const STEPS = [
  { no: '1', title: 'Bir oda seç', text: 'Sessiz kütüphane, şömineli dağ evi ya da kod yazanların ofisi. Herkese açık odalara katıl ya da arkadaşlarına davet kodu gönder.' },
  { no: '2', title: 'Sayacını başlat', text: '25, 50 ya da 90 dakikalık bloklar. Avatarın masasına oturur; molada mola köşesine yürür. Kimse seni görmez, herkes çalıştığını bilir.' },
  { no: '3', title: 'Odak süreni izle', text: 'Her odak dakikası sayılır. Bugünkü toplamını ve bitirdiğin pomodoroları Sayfam’da gör; ortak odada sıralamadaki yerini izle.' },
]

// "Kamera yok" hero'da söyleniyor; burada yalnızca ürünün geri kalanı.
const FEATURES = [
  { title: 'Kendi odan', text: 'Tek kişilik odanı istediğin temayla kur; yağmur ya da şömine sesi aç.' },
  { title: 'Odak modu', text: 'Tek tıkla tam ekran: yalnızca odan ve sayacın kalır.' },
  { title: 'Göz yormayan', text: 'Kâğıt tonlarında zemin, tek bir terakota vurgu; istersen tek tıkla koyu mod.' },
]

// Ana sayfa: lobinin kapısı. Önce oda görünür, sonra lobideki açık odalar ve on tema; anlatım en sonda.
// Oda arkadaşları şimdilik simülasyon olduğundan "şu an N kişi" gibi canlı sayı gösterilmez; yalnızca kapasite.
export default function LandingPage({ user, rooms = [], onGo, onEnter }) {
  const [quote, by, note] = QUOTES[quoteForVisit()]
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
                    <strong>{room.name}</strong>
                    <span>
                      {THEMES[room.theme].label} · {room.capacity} kişilik
                    </span>
                  </span>
                  <button type="button" className="site-btn site-btn--primary" onClick={() => sit(room)} aria-label={`${room.name} odasına otur`}>
                    Otur
                  </button>
                </li>
              ))}
            </ul>
            {!user && <p className="lp-open__note">Oturmak için önce bir hesap açarsın; bir dakika sürer.</p>}
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

      <section id="nasil" className="lp-section" aria-labelledby="nasilBaslik">
        <div className="lp-inner">
          <h2 id="nasilBaslik" className="lp-h2">
            Üç adımda masana otur
          </h2>
          <ol className="lp-steps">
            {STEPS.map((s) => (
              <li key={s.no}>
                <span className="lp-steps__no" aria-hidden="true">
                  {s.no}
                </span>
                <span className="lp-steps__title">{s.title}</span>
                <span className="lp-steps__text">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="neden" className="lp-section" aria-labelledby="nedenBaslik">
        <div className="lp-inner lp-why">
          <div className="lp-why__text">
            <h2 id="nedenBaslik" className="lp-h2">
              Yanında biri çalışırken sen de çalışırsın
            </h2>
            <p>
              Kütüphanede ders çalışmanın evden kolay gelmesinin bir nedeni var: başkalarını çalışırken görmek seni de masada tutar. Buna “body doubling” deniyor. Odakhane bu hissi internete taşır;
              kimse seni izlemez, ama yalnız da değilsin.
            </p>
          </div>
          <dl className="lp-features">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <dt>{f.title}</dt>
                <dd>{f.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* kullanıcı yorumu değil: kaynağı belli bir söz ya da atasözü (quotes.js) */}
      <section className="lp-quote-wrap" aria-label="Söz">
        <figure className="lp-quote">
          <blockquote>“{quote}”</blockquote>
          <figcaption>— {by}</figcaption>
          <p>{note}</p>
        </figure>
      </section>

      <section className="lp-section lp-cta-wrap">
        <div className="lp-cta">
          <div className="lp-cta__text">
            <h2>İlk adımı bugün at.</h2>
            <p>Hesap açmak bir dakika sürer. İlk pomodoronu bitirdiğinde odak yolculuğun da başlamış olur.</p>
          </div>
          <button type="button" className="site-btn site-btn--xl lp-cta__main" onClick={start}>
            {user ? 'Sayfama git' : 'Hesap oluştur'}
          </button>
        </div>
      </section>
    </div>
  )
}
