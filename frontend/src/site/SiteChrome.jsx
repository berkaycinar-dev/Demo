import { useEffect, useRef } from 'react'

// Sitenin çerçevesi: marka, üst menü, açık/koyu mod düğmesi ve alt bilgi.

// Marka işareti: izometrik tek voxel blok, sol yüzünde ışığı yanan bir kapı. Odalar gibi kil/terakota
// tonlarında üç yüz; kapı içeride birinin çalıştığını söyler. public/favicon.svg ile aynı çizim.
export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 2.5 25 8.5 14 14.5 3 8.5Z" fill="#e3a47f" />
      <path d="M3 8.5 14 14.5V26.5L3 20.5Z" fill="#b5502d" />
      <path d="M25 8.5 14 14.5V26.5L25 20.5Z" fill="#7d3519" />
      <path d="M6.5 14.4 10.5 16.6V24.6L6.5 22.4Z" fill="#ffd89a" />
    </svg>
  )
}

// Header'da tek biçim: 44 px yuvarlak ikon düğmesi (misafir de oturumlu da, her sayfada aynı).
export function ModeToggle({ isDark, onToggle }) {
  const label = isDark ? 'Açık moda geç' : 'Koyu moda geç'
  return (
    <button type="button" className="mode-btn" aria-pressed={isDark} aria-label={label} title={label} onClick={onToggle}>
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('tr'))
    .join('')

// Header yüksekliği --header-h değişkenine yazılır; oda sahnesi kalan alanı bununla hesaplar.
function useHeaderHeight() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const root = document.documentElement
    const sync = () => root.style.setProperty('--header-h', `${el.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return ref
}

// Tek yapı: marka · (oturumluysa) sayfa menüsü · araçlar [mod, sonra hesap ya da giriş/kayıt].
// Hangi sayfada olunursa olunsun aynı öğeler aynı yerde durur.
// wide: oda sayfalarında sahne tam genişlik; header da sayfa kabına değil sahnenin kenarına hizalanır.
export function SiteHeader({ user, pages, page, navPage = page, onGo, onLogout, isDark, onToggleMode, wide = false }) {
  const ref = useHeaderHeight()

  return (
    <header className={`site-header${wide ? ' site-header--wide' : ''}`} ref={ref}>
      <button type="button" className="site-brand" onClick={() => onGo(user ? 'sayfam' : 'anasayfa')}>
        <BrandMark />
        <span className="site-brand__text">Odakhane</span>
      </button>

      {user && (
        <nav className="site-nav" aria-label="Ana menü">
          {pages.map((p) => (
            <button key={p.id} type="button" aria-current={navPage === p.id ? 'page' : undefined} onClick={() => onGo(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
      )}
      <div className="site-header__tools">
        <span className={user ? 'site-header__mode' : undefined}>
          <ModeToggle isDark={isDark} onToggle={onToggleMode} />
        </span>
        {user ? (
          <>
            <button
              type="button"
              className="user-chip"
              title={`Hesap ayarları · @${user.username}`}
              aria-label={`Hesap ayarları: ${user.displayName}`}
              aria-current={page === 'hesap' ? 'page' : undefined}
              onClick={() => onGo('hesap')}
            >
              <span className="user-chip__avatar" aria-hidden="true">
                {initials(user.displayName)}
              </span>
              <span className="user-chip__name">{user.displayName}</span>
            </button>
            {/* telefonda üst menü tek satır: mod ve çıkış hesap sayfasında (AccountPage SessionCard) */}
            <button type="button" className="header-link header-link--logout" onClick={onLogout}>
              Çıkış yap
            </button>
          </>
        ) : (
          <>
            <button type="button" className="header-link" aria-current={page === 'giris' ? 'page' : undefined} onClick={() => onGo('giris')}>
              Giriş yap
            </button>
            <button type="button" className="site-btn site-btn--primary header-cta" onClick={() => onGo('kayit')}>
              Kayıt ol
            </button>
          </>
        )}
      </div>
    </header>
  )
}

// Alt bilgi tek satır: marka ve tek cümle, yasal bağlantılar, telif. Sayfa menüsü üstte zaten var;
// burada tekrarlanmaz.
export function SiteFooter({ onGo }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__about">
          <span className="site-footer__brand">
            <BrandMark size={22} />
            Odakhane
          </span>
          <span>Kamerasız, sessiz, birlikte.</span>
        </div>
        <nav className="site-footer__nav" aria-label="Yasal">
          <button type="button" onClick={() => onGo('kosullar')}>
            Kullanım koşulları
          </button>
          <button type="button" onClick={() => onGo('gizlilik')}>
            Gizlilik politikası
          </button>
        </nav>
        <span className="site-footer__copy">© 2026 Odakhane</span>
      </div>
    </footer>
  )
}
