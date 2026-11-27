import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { formatClock } from './usePomodoro'
import useShortcut from './useShortcut'

// Odak modundaki yazı renkleri (pages.css .stage__panel[data-tone] ile aynı olmalı).
const TEXT_ON_LIGHT = [0x1f, 0x24, 0x30]
const TEXT_ON_DARK = [0xee, 0xf1, 0xf6]

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Zemin rengine hangi yazı daha okunur: iki yazı rengiyle kontrast karşılaştırılır (sabit bir
// parlaklık eşiği orta tonlarda yanlış tarafı seçer).
const toneOf = (rgb) => (contrast(rgb, TEXT_ON_DARK) > contrast(rgb, TEXT_ON_LIGHT) ? 'dark' : 'light')

// Herhangi bir CSS rengini (color-mix dahil) tarayıcıya çözdürüp 0-255 RGB'ye çevirir. Tarayıcı
// sonucu rgb(...) ya da color(srgb 0-1 ...) biçiminde yazar; ikisi de okunur.
function resolveColor(value, probe) {
  probe.style.color = ''
  probe.style.color = value
  if (!probe.style.color) return null
  const out = getComputedStyle(probe).color
  const nums = out.match(/-?[\d.]+(e-?\d+)?/gi)?.map(Number)
  if (!nums || nums.length < 3) return null
  const rgb = out.startsWith('color(') ? nums.slice(0, 3).map((v) => v * 255) : nums.slice(0, 3)
  return rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))))
}

// Odanın gerçekten boyanan zemini: .room-canvas üzerindeki --room-paint (açık modda gün zamanının
// rengi, koyu modda o rengin koyu sahne zeminiyle karışımı; bkz. site.css). Ton bu boyanan renkten
// hesaplanır ve aynı renk --stage-bg olarak panele verilir, böylece sayaç yazısı, halka ve telefondaki
// panel zemini odayla aynı rengi görür. Gün zamanı, tema ya da site modu değişince yeniden ölçülür.
function useRoomTone(roomRef) {
  const [room, setRoom] = useState({ tone: 'light', color: '' })
  useEffect(() => {
    const host = roomRef.current
    if (!host) return undefined
    const probe = document.createElement('span')
    probe.hidden = true
    document.body.append(probe)
    const measure = () => {
      const canvas = host.querySelector('.room-canvas')
      if (!canvas) return
      const css = getComputedStyle(canvas)
      const paint = css.getPropertyValue('--room-paint').trim() || css.getPropertyValue('--room-bg').trim()
      const rgb = paint && resolveColor(paint, probe)
      const dark = document.documentElement.dataset.mode === 'dark'
      const next = rgb
        ? { tone: toneOf(rgb), color: `rgb(${rgb.join(' ')})` }
        : { tone: dark ? 'dark' : 'light', color: '' }
      setRoom((old) => (old.color === next.color && old.tone === next.tone ? old : next))
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'data-time'] })
    const modeMo = new MutationObserver(measure)
    modeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] })
    return () => {
      mo.disconnect()
      modeMo.disconnect()
      probe.remove()
    }
  }, [roomRef])
  return room
}

// Telefonda ekranın altına yapışan sayaç çubuğu: kalan süre, aşama ve tek eylem (Başlat / Duraklat).
// Panel kaydırılsa da sayaç görünür; paneldeki sayaç kartı bu yüzden kendi Başlat'ını göstermez.
// Masaüstünde gizli. Sahnenin son öğesidir: yapışkan çubuk sahnenin sonunda kendi yerini ayırır, panelin
// son satırı çubuğun altında kalmaz ve alt bilgiye gelince çubuk sahneyle birlikte yukarı kayar.
// Paneldeki Başlat ekrandayken çubuk aşağı çekilir: aynı düğme iki kez görünmez, ekranda hep tam bir
// Başlat kalır. Başlat ekrandan çıkınca çubuk geri gelir. Çekilince odaktan ve ekran okuyucudan da çıkar
// (inert).
function StageBar({ timer, away }) {
  const isFocus = timer.phase === 'focus'
  return (
    <div className="stage-bar" data-phase={timer.phase} data-away={away ? '' : undefined} inert={away} role="group" aria-label="Sayaç özeti">
      <span className="stage-bar__phase">{isFocus ? 'Odak' : 'Mola'}</span>
      <span className="stage-bar__clock">{formatClock(timer.remaining)}</span>
      <button type="button" className="site-btn site-btn--primary stage-bar__toggle" onClick={timer.toggle} aria-keyshortcuts="Space">
        {timer.running ? 'Duraklat' : timer.fresh ? 'Başlat' : 'Devam et'}
      </button>
    </div>
  )
}

// Varış levhası: odaya yeni girince sahnenin üstünde tabela ahşabından bir levha ~1.5 sn durur, sonra
// kendiliğinden kalkar. Bilgi ekran okuyucuya sayfa başlığından gelir (odak oda adına taşınır); levha
// görsel bir yankıdır, aria-hidden. "Hareketi azalt"ta kaymadan, yalnızca belirip söner.
function ArrivalSign({ lead, name }) {
  const [shown, setShown] = useState(true)
  if (!shown) return null
  return (
    <div className="stage__arrival" aria-hidden="true" onAnimationEnd={() => setShown(false)}>
      <span className="stage__arrival-lead">{lead}</span>
      <span className="stage__arrival-name">{name}</span>
    </div>
  )
}

// Oda sayfalarının düzeni: oda sahnesi header'ın altındaki alanın tamamını kaplar, sayfa kaymaz (arka plan
// odanın kendi rengi), sağda yüzen bir panel durur. Odak modunda sayfa tam ekran olur; header,
// footer ve panelin geri kalanı gizlenir, yalnızca oda ve focusPanel kalır.
//
// renderRoom(canvasStyle): odayı çizer; canvasStyle, 3D sahneyi panelin solunda kalan alana sığdırır.
// timer verilirse telefonda ekranın altında sayaç çubuğu çıkar (odak modunda panelin kendisi sayaçtır).
// arrival ({ lead, name }) verilirse odaya yeni girildiği için varış levhası gösterilir.
// Paneldeki Başlat düğmesi ekranda mı (telefonda yapışkan çubuğun kapladığı alt şerit hariç).
function useMainInView(panelRef, active) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!active) return undefined
    const main = panelRef.current?.querySelector('.timer-card__main')
    if (!main || !('IntersectionObserver' in window)) return undefined
    // Başlat'ın bir kenarı çubuğun üstünde görünür görünmez çubuk çekilir: iki Başlat aynı anda ekranda
    // kalmaz (yatay telefonda panel kendi içinde kaydığı için yarım görünen düğme sık olur).
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '0px 0px -72px 0px', threshold: 0 })
    io.observe(main)
    return () => io.disconnect()
  }, [panelRef, active])
  return active && inView
}

export default function RoomStage({ renderRoom, panel, focusPanel, focusMode, onFocusModeChange, timer, arrival }) {
  const roomRef = useRef(null)
  const panelRef = useRef(null)
  const { tone, color } = useRoomTone(roomRef)
  const mainInView = useMainInView(panelRef, !!timer && !focusMode)

  // Tam ekran: tarayıcı izin verirse gerçek tam ekran, vermezse yalnızca sayfa içi tam boy.
  useEffect(() => {
    if (!focusMode) return undefined
    const root = document.documentElement
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => {})
    const onChange = () => {
      if (!document.fullscreenElement) onFocusModeChange(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onFocusModeChange(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      window.removeEventListener('keydown', onKey)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [focusMode, onFocusModeChange])

  return (
    <div className={`stage${focusMode ? ' stage--focus' : ''}`} style={color ? { '--stage-bg': color } : undefined}>
      <div className="stage__room" ref={roomRef}>
        {renderRoom({ width: 'var(--stage-canvas-w, 100%)' })}
        {arrival && !focusMode && <ArrivalSign lead={arrival.lead} name={arrival.name} />}
      </div>
      <aside ref={panelRef} className="stage__panel" data-tone={focusMode ? tone : undefined} aria-label={focusMode ? 'Sayaç' : 'Oda paneli'}>
        {focusMode ? (
          <>
            {focusPanel}
            <button type="button" className="site-btn stage__exit" onClick={() => onFocusModeChange(false)}>
              Odak modundan çık
            </button>
          </>
        ) : (
          panel
        )}
      </aside>
      {timer && !focusMode && <StageBar timer={timer} away={mainInView} />}
    </div>
  )
}

// Odak modu düğmesinin metinleri: düğme adı ve kısa açıklama. Tam cümleler; çeviride birleştirilmez.
const FOCUS_MODE_COPY = {
  button: 'Odak modu',
  note: 'Tam ekran: yalnızca oda ve sayaç kalır. Kısayol F; Esc ile çık.',
  // dokunmatik cihaz (fare ve klavye yok sayılır): tuş anılmaz
  noteTouch: 'Tam ekran: yalnızca oda ve sayaç kalır. Çıkmak için “Odak modundan çık” düğmesine dokun.',
  // simge düğmenin ipucu
  iconTitle: 'Odak modu (F)',
}
const FOCUS_NOTE_ID = 'focusModeNote'

// Birincil işaretçi dokunmatik ve üstüne gelme yoksa (telefon, tablet) true; değişince yeniden çizer.
const TOUCH = '(hover: none) and (pointer: coarse)'
function useTouch() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia?.(TOUCH)
      m?.addEventListener('change', cb)
      return () => m?.removeEventListener('change', cb)
    },
    () => window.matchMedia?.(TOUCH).matches ?? false,
  )
}

// İkincil eylem: panelde tek terracotta düğme sayacın Başlat'ıdır. Açıklaması FocusModeNote'ta; not
// gizliyken (ilk ziyaretten sonra) fareyle üstüne gelince title olarak da okunur.
// compact: yalnızca simge (çok kişili odada durum satırında); adı aria-label, açıklaması title'da.
export function FocusModeButton({ onClick, hints = false, compact = false }) {
  // F: odak moduna geç (çıkış Esc)
  useShortcut('f', onClick)
  return (
    <button
      type="button"
      className={`site-btn focus-btn${compact ? ' site-btn--small focus-btn--icon' : ''}`}
      onClick={onClick}
      aria-keyshortcuts="F"
      aria-label={compact ? FOCUS_MODE_COPY.button : undefined}
      aria-describedby={FOCUS_NOTE_ID}
      title={compact ? FOCUS_MODE_COPY.iconTitle : hints ? undefined : FOCUS_MODE_COPY.note}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
      {!compact && FOCUS_MODE_COPY.button}
    </button>
  )
}

// Kısayol listesinin metinleri. Tuş adları ve açıklamalar ayrı; çeviride tuş adı da değişebilir.
const KEYS_COPY = {
  button: 'Kısayollar',
  title: 'Kısayollar (?)',
  list: [
    { keys: ['Boşluk'], what: 'Başlat / duraklat' },
    { keys: ['1', '2', '3'], what: 'Süre seç' },
    { keys: ['F'], what: 'Odak modu' },
    { keys: ['Esc'], what: 'Odak modundan çık' },
    { keys: ['?'], what: 'Bu liste' },
  ],
}

// İstenince açılan kısayol listesi (görünür lejant değil): klavye simgeli küçük düğme ve altında bir
// kutu. "?" ile de açılır/kapanır; dışarı tıklayınca ya da Esc ile kapanır, Esc odağı düğmeye verir.
// Dokunmatik ekranda (fare yok) gizlidir: orada kısayol yoktur.
export function ShortcutHelp() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const popId = useId()
  useShortcut('?', () => setOpen((v) => !v))
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
  return (
    <span className="keys-help" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="site-btn site-btn--small keys-help__btn"
        aria-label={KEYS_COPY.button}
        aria-expanded={open}
        aria-controls={popId}
        aria-keyshortcuts="?"
        title={KEYS_COPY.title}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </svg>
      </button>
      <div id={popId} className="keys-help__pop" role="group" aria-label={KEYS_COPY.button} hidden={!open}>
        <dl className="keys-help__list">
          {KEYS_COPY.list.map((row) => (
            <div key={row.what} className="keys-help__row">
              <dt>
                {row.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </dt>
              <dd>{row.what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </span>
  )
}

// Odak modu düğmesinin açıklaması; sayfada bir FocusModeButton ile birlikte bir kez. İlk ziyarette
// (hints) görünür, sonra yalnızca ekran okuyucuya kalır.
export function FocusModeNote({ hints = false }) {
  const touch = useTouch()
  return (
    <p id={FOCUS_NOTE_ID} className={hints ? 'stage-note' : 'sr-only'}>
      {touch ? FOCUS_MODE_COPY.noteTouch : FOCUS_MODE_COPY.note}
    </p>
  )
}
