import { useEffect, useRef } from 'react'
import { scrollToId } from './scroll'

// Sitenin çerçevesi: marka, üst menü, açık/koyu mod düğmesi ve alt bilgi.

const LANDING_SECTIONS = [
  { id: 'nasil', label: 'Nasıl çalışır' },
  { id: 'odalar', label: 'Odalar' },
  { id: 'neden', label: 'Neden işe yarar' },
]

export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="var(--header-accent)" strokeWidth="2.5" />
      <path d="M14 7v7l5 3" stroke="var(--header-accent)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function ModeToggle({ isDark, onToggle, iconOnly = false }) {
  const label = isDark ? 'Açık moda geç' : 'Koyu moda geç'
  return (
    <button type="button" className={`mode-btn${iconOnly ? ' mode-btn--icon' : ''}`} aria-pressed={isDark} aria-label={label} title={label} onClick={onToggle}>
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
      {!iconOnly && <span className="mode-btn__text">{isDark ? 'Açık mod' : 'Koyu mod'}</span>}
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

export function SiteHeader({ user, pages, page, onGo, onLogout, isDark, onToggleMode }) {
  const ref = useHeaderHeight()
  const onLanding = page === 'anasayfa'

  return (
    <header className="site-header" ref={ref}>
      <button type="button" className="site-brand" onClick={() => onGo(user ? 'sayfam' : 'anasayfa')}>
        <BrandMark />
        Odakhane
      </button>

      {user && !onLanding && (
        <nav className="site-nav" aria-label="Ana menü">
          {pages.map((p) => (
            <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => onGo(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
      )}
      {onLanding && (
        <nav className="site-nav site-nav--sections" aria-label="Sayfa bölümleri">
          {LANDING_SECTIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => scrollToId(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      )}

      <div className="site-header__tools">
        <ModeToggle isDark={isDark} onToggle={onToggleMode} iconOnly={!user || onLanding} />
        {user ? (
          <>
            {onLanding && (
              <button type="button" className="site-btn site-btn--primary header-cta" onClick={() => onGo('sayfam')}>
                Sayfama git
              </button>
            )}
            <span className="user-chip" title={`${user.displayName} (@${user.username})`}>
              <span className="user-chip__avatar" aria-hidden="true">
                {initials(user.displayName)}
              </span>
              <span className="user-chip__name">{user.displayName}</span>
            </span>
            <button type="button" className="header-link" onClick={onLogout}>
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

export function SiteFooter({ user, pages, onGo, isDark }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__about">
          <span className="site-footer__brand">
            <BrandMark size={22} />
            Odakhane
          </span>
          <span>Kamerasız, sessiz, birlikte. Herkes kendi sayacıyla aynı odada çalışır.</span>
        </div>
        <nav className="site-footer__nav" aria-label="Alt menü">
          <div className="site-footer__col">
            <span className="site-footer__heading">Odakhane</span>
            <button type="button" onClick={() => onGo('anasayfa')}>
              Ana sayfa
            </button>
            {user && pages.map((p) => (
              <button key={p.id} type="button" onClick={() => onGo(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          {!user && (
            <div className="site-footer__col">
              <span className="site-footer__heading">Hesap</span>
              <button type="button" onClick={() => onGo('giris')}>
                Giriş yap
              </button>
              <button type="button" onClick={() => onGo('kayit')}>
                Kayıt ol
              </button>
            </div>
          )}
        </nav>
      </div>
      <div className="site-footer__bottom">
        <div className="site-footer__inner">
          <span>© 2026 Odakhane (çalışma adı)</span>
          <span>Tema: Gri &amp; Mavi · {isDark ? 'koyu' : 'açık'}</span>
        </div>
      </div>
    </footer>
  )
}
