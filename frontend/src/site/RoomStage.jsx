import { useEffect, useRef, useState } from 'react'

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

// Oda sayfalarının düzeni: oda sahnesi header ile footer arasındaki alanın tamamını kaplar (arka plan
// odanın kendi rengi), sağda yüzen bir panel durur. Odak modunda sayfa tam ekran olur; header,
// footer ve panelin geri kalanı gizlenir, yalnızca oda ve focusPanel kalır.
//
// renderRoom(canvasStyle): odayı çizer; canvasStyle, 3D sahneyi panelin solunda kalan alana sığdırır.
export default function RoomStage({ renderRoom, panel, focusPanel, focusMode, onFocusModeChange }) {
  const roomRef = useRef(null)
  const { tone, color } = useRoomTone(roomRef)

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
      </div>
      <aside className="stage__panel" data-tone={focusMode ? tone : undefined} aria-label={focusMode ? 'Sayaç' : 'Oda paneli'}>
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
    </div>
  )
}

export function FocusModeButton({ onClick }) {
  return (
    <button type="button" className="site-btn site-btn--primary site-btn--wide focus-btn" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
      Odak modu
    </button>
  )
}
