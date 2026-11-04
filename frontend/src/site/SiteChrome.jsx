// Sitenin çerçevesi: marka, üst menü, açık/koyu mod düğmesi ve alt bilgi.

export function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" stroke="var(--header-accent)" strokeWidth="2.5" />
      <path d="M14 7v7l5 3" stroke="var(--header-accent)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

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
      <span className="mode-btn__text">{isDark ? 'Açık mod' : 'Koyu mod'}</span>
    </button>
  )
}

export function SiteHeader({ pages, page, onGo, isDark, onToggleMode }) {
  return (
    <header className="site-header">
      <button type="button" className="site-brand" onClick={() => onGo(pages[0].id)}>
        <BrandMark />
        Odakhane
      </button>
      <nav className="site-nav" aria-label="Ana menü">
        {pages.map((p) => (
          <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => onGo(p.id)}>
            {p.label}
          </button>
        ))}
      </nav>
      <div className="site-header__tools">
        <ModeToggle isDark={isDark} onToggle={onToggleMode} />
      </div>
    </header>
  )
}

export function SiteFooter({ pages, onGo, isDark }) {
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
          {pages.map((p) => (
            <button key={p.id} type="button" onClick={() => onGo(p.id)}>
              {p.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="site-footer__bottom">
        <div className="site-footer__inner">
          <span>© 2026 Odakhane (çalışma adı)</span>
          <span>Tema: Krem &amp; Ceviz · {isDark ? 'koyu' : 'açık'}</span>
        </div>
      </div>
    </footer>
  )
}
