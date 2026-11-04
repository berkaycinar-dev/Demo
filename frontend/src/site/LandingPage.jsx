import { THEMES } from '../rooms/themes'
import { QUOTES, quoteForVisit } from './quotes'
import { scrollToId } from './scroll'
import { swatchOf } from './themeLook'

const STEPS = [
  { no: '01', title: 'Bir oda seç', text: 'Sessiz kütüphane, şömineli dağ evi ya da kod yazanların ofisi. Herkese açık odalara katıl ya da arkadaşlarına davet kodu gönder.' },
  { no: '02', title: 'Sayacını başlat', text: '25, 50 ya da 90 dakikalık bloklar. Avatarın masasına oturur; molada mola köşesine yürür. Kimse seni görmez, herkes çalıştığını bilir.' },
  { no: '03', title: 'Damlaları biriktir', text: 'Her odak dakikası sayılır. Bugünkü süreni gör, odadaki sıralamada arkadaşlarınla birlikte yüksel.' },
]

const EXAMPLE_ROOMS = [
  { theme: 'library', rule: 'Tam sessizlik · okuma masaları' },
  { theme: 'cabin', rule: 'Şömine sesiyle uzun bloklar' },
  { theme: 'office', rule: 'Kod yazanların buluşma yeri' },
  { theme: 'teagarden', rule: 'Molada deniz manzarası' },
  { theme: 'camp', rule: 'Gece vardiyası, kamp ateşi' },
  { theme: 'space', rule: 'Hologram masada derin odak' },
]

const FEATURES = [
  { title: 'Kamera yok', text: 'Avatarın seni temsil eder; yüzün, sesin, odan görünmez.', icon: 'M3 3l18 18M10.6 6H15a2 2 0 0 1 2 2v1l4-2v10M17 17H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2' },
  { title: 'Kendi odan', text: 'Tek kişilik odanı istediğin temayla kur; yağmur ya da şömine sesi aç.', icon: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { title: 'Odak modu', text: 'Tek tıkla tam ekran: yalnızca odan ve sayacın kalır.', icon: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' },
  { title: 'Göz yormayan', text: 'Sade gri tonlar ve sakin mavi vurgular, istersen tek tıkla koyu mod.', icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' },
]

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
)

// Ana sayfa: giriş yapmamış ziyaretçinin gördüğü tanıtım sayfası.
export default function LandingPage({ user, onGo }) {
  const [quote, by, note] = QUOTES[quoteForVisit()]
  const start = () => onGo(user ? 'sayfam' : 'kayit')

  return (
    <div className="landing">
      <section className="lp-section lp-hero-wrap">
        <div className="lp-hero">
          <div className="lp-hero__text">
            <h1 className="lp-h1">
              Birlikte çalışınca odaklanmak <span className="accent">kolaylaşır.</span>
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
            <div className="lp-checks">
              <span>
                <Check />
                Kamera yok
              </span>
              <span>
                <Check />
                Mikrofon yok
              </span>
            </div>
          </div>

        </div>
      </section>

      <section className="lp-quote-wrap" aria-label="Söz">
        <figure className="lp-quote">
          <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" className="lp-quote__mark">
            <path d="M10 7H6a3 3 0 0 0-3 3v4h4v4l3-4v-4H6v-.5A1.5 1.5 0 0 1 7.5 8H10zm11 0h-4a3 3 0 0 0-3 3v4h4v4l3-4v-4h-4v-.5A1.5 1.5 0 0 1 18.5 8H21z" />
          </svg>
          <blockquote>“{quote}”</blockquote>
          <figcaption>— {by}</figcaption>
          <p>{note}</p>
        </figure>
      </section>

      <section id="nasil" className="lp-section" aria-labelledby="nasilBaslik">
        <div className="lp-inner">
          <div className="section-head">
            <span className="eyebrow">Nasıl çalışır</span>
            <h2 id="nasilBaslik" className="lp-h2">
              Üç adımda masana otur
            </h2>
          </div>
          <div className="lp-grid lp-grid--steps">
            {STEPS.map((s) => (
              <div key={s.no} className="lp-card lp-step">
                <span className="lp-step__no">{s.no}</span>
                <span className="lp-card__title">{s.title}</span>
                <span className="lp-card__text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="odalar" className="lp-section" aria-labelledby="odalarBaslik">
        <div className="lp-inner">
          <div className="section-head section-head--row">
            <div>
              <span className="eyebrow">Odalar</span>
              <h2 id="odalarBaslik" className="lp-h2">
                Nasıl çalışmayı seviyorsan öyle bir oda
              </h2>
            </div>
            <button type="button" className="link-btn link-btn--strong" onClick={() => onGo(user ? 'olustur' : 'kayit')}>
              Tüm aktif odaları gör
            </button>
          </div>
          <div className="lp-grid lp-grid--rooms">
            {EXAMPLE_ROOMS.map(({ theme, rule }) => (
              <div key={theme} className="lp-card lp-room">
                <span className="lp-room__swatch" style={{ background: swatchOf(theme) }} aria-hidden="true" />
                <span className="lp-room__body">
                  <span className="lp-card__title">{THEMES[theme].label}</span>
                  <span className="lp-card__text">{THEMES[theme].description}</span>
                  <span className="lp-room__rule">{rule}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="neden" className="lp-section" aria-labelledby="nedenBaslik">
        <div className="lp-inner lp-why">
          <div className="lp-why__text">
            <span className="eyebrow">Neden işe yarar</span>
            <h2 id="nedenBaslik" className="lp-h2">
              Yanında biri çalışırken sen de çalışırsın
            </h2>
            <p>
              Kütüphanede ders çalışmanın evden kolay gelmesinin bir nedeni var: başkalarını çalışırken görmek seni de masada tutar. Buna “body doubling” deniyor. Odakhane bu hissi internete taşır;
              kimse seni izlemez, ama yalnız da değilsin.
            </p>
          </div>
          <div className="lp-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-card lp-feature">
                <span className="lp-feature__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={f.icon} />
                  </svg>
                </span>
                <span className="lp-feature__title">{f.title}</span>
                <span className="lp-card__text lp-card__text--sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-cta-wrap">
        <div className="lp-cta">
          <div className="lp-cta__text">
            <h2>İlk adımı bugün at.</h2>
            <p>Hesap açmak bir dakika sürer. İlk pomodoronu bitirdiğinde odak yolculuğun da başlamış olur.</p>
          </div>
          <div className="site-actions">
            <button type="button" className="site-btn site-btn--xl lp-cta__main" onClick={start}>
              {user ? 'Sayfama git' : 'Hesap oluştur'}
            </button>
            {!user && (
              <button type="button" className="site-btn site-btn--xl lp-cta__ghost" onClick={() => onGo('giris')}>
                Giriş yap
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

