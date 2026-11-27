import { useEffect, useId, useRef, useState } from 'react'

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

const MODE_COPY = {
  label: 'Tema',
  options: [
    { id: 'light', label: 'Açık' },
    { id: 'dark', label: 'Koyu' },
  ],
  // düğme yapacağı işi söyler: açıkken "Koyu moda geç"
  toggle: { light: 'Koyu moda geç', dark: 'Açık moda geç' },
}

function ModeIcon({ id }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (id === 'light')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

// İki seçenek yan yana (Açık / Koyu): hesap sayfasındaki tema seçimi.
export function ModeChoice({ pref, onChange }) {
  return (
    <div className="mode-choice" role="group" aria-label={MODE_COPY.label}>
      {MODE_COPY.options.map((o) => (
        <button key={o.id} type="button" aria-pressed={pref === o.id} onClick={() => onChange(o.id)}>
          <ModeIcon id={o.id} />
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Header'da 44 px yuvarlak ikon düğmesi: her basışta açık ↔ koyu. İkon şu anki modu gösterir (güneş açık,
// ay koyu); etiket ve ipucu basınca ne olacağını söyler.
export function ModeToggle({ pref, onChange }) {
  const next = pref === 'dark' ? 'light' : 'dark'
  const label = MODE_COPY.toggle[pref === 'dark' ? 'dark' : 'light']
  return (
    <button type="button" className="mode-btn" aria-label={label} title={label} onClick={() => onChange(next)}>
      <ModeIcon id={pref === 'dark' ? 'dark' : 'light'} />
    </button>
  )
}

const USER_COPY = {
  label: (name) => `Hesap menüsü: ${name}`,
  profile: 'Profilim',
  avatar: 'Avatarım',
  look: 'Görünüm',
  logout: 'Çıkış yap',
}

// Menüdeki bağlantıların simgeleri (yazının rengini alır)
const MenuIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const ICON_PROFILE = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
const ICON_AVATAR = 'M4 4h16v16H4zM9 9h.01M15 9h.01M9 15h6'
const ICON_LOGOUT = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'

// Hesap menüsü: üst sağdaki ad ve baş harf. Fare üstüne gelince açılır (kısa gecikmeyle kapanır, kutuya
// geçerken kapanmasın); tıklama, dokunma ve klavye de açar. Esc kapatır ve odağı düğmeye verir, dışarı
// tıklama kapatır. İçinde: ad ve kullanıcı adı, Profilim (hesap ayarları), Avatarım, görünüm (açık / koyu)
// ve Çıkış yap.
function UserMenu({ user, page, onGo, onLogout, modePref, onModeChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const closeTimer = useRef(0)
  const popId = useId()

  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      btnRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const show = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hideSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }
  const go = (id) => {
    setOpen(false)
    onGo(id)
  }

  return (
    <div
      className="user-menu"
      ref={wrapRef}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hideSoon()}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className="user-chip"
        aria-label={USER_COPY.label(user.displayName)}
        aria-expanded={open}
        aria-controls={popId}
        aria-current={page === 'hesap' ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-chip__avatar" aria-hidden="true">
          {initials(user.displayName)}
        </span>
        <span className="user-chip__name">{user.displayName}</span>
        <svg className="user-chip__caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div id={popId} className="user-menu__pop" hidden={!open}>
        <div className="user-menu__who">
          <span className="user-chip__avatar" aria-hidden="true">
            {initials(user.displayName)}
          </span>
          <span className="user-menu__names">
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
          </span>
        </div>
        <button type="button" className="user-menu__item" aria-current={page === 'hesap' ? 'page' : undefined} onClick={() => go('hesap')}>
          <MenuIcon d={ICON_PROFILE} />
          {USER_COPY.profile}
        </button>
        <button type="button" className="user-menu__item" aria-current={page === 'avatar' ? 'page' : undefined} onClick={() => go('avatar')}>
          <MenuIcon d={ICON_AVATAR} />
          {USER_COPY.avatar}
        </button>
        <div className="user-menu__look">
          <span className="user-menu__look-label">{USER_COPY.look}</span>
          <ModeChoice pref={modePref} onChange={onModeChange} />
        </div>
        <button
          type="button"
          className="user-menu__item user-menu__item--logout"
          onClick={() => {
            setOpen(false)
            onLogout()
          }}
        >
          <MenuIcon d={ICON_LOGOUT} />
          {USER_COPY.logout}
        </button>
      </div>
    </div>
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
const QUIET_CTA = new Set(['anasayfa', 'giris', 'kayit', 'sifremi-unuttum'])

// wide: oda sayfalarında sahne tam genişlik; header da sayfa kabına değil sahnenin kenarına hizalanır.
export function SiteHeader({ user, pages, page, navPage = page, onGo, onLogout, modePref, onModeChange, wide = false }) {
  const ref = useHeaderHeight()

  return (
    <header className={`site-header${wide ? ' site-header--wide' : ''}`} ref={ref}>
      <button type="button" className="site-brand" onClick={() => onGo(user ? 'sayfam' : 'anasayfa')}>
        <BrandMark />
        <span className="site-brand__text">SameDesk</span>
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
          <ModeToggle pref={modePref} onChange={onModeChange} />
        </span>
        {user ? (
          <>
            {/* hesap menüsü: Profilim, Avatarım, görünüm ve Çıkış yap */}
            <UserMenu user={user} page={page} onGo={onGo} onLogout={onLogout} modePref={modePref} onModeChange={onModeChange} />
          </>
        ) : (
          <>
            <button type="button" className="header-link" aria-current={page === 'giris' ? 'page' : undefined} onClick={() => onGo('giris')}>
              Giriş yap
            </button>
            {/* tanıtım ve giriş/kayıt sayfalarında birincil eylem sayfanın kendisinde: üstteki düğme sakin kalır */}
            <button type="button" className={`site-btn header-cta${QUIET_CTA.has(page) ? '' : ' site-btn--primary'}`} onClick={() => onGo('kayit')}>
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
            SameDesk
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
        <span className="site-footer__copy">© 2026 SameDesk</span>
      </div>
    </footer>
  )
}
