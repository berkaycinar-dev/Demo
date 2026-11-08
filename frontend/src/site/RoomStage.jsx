import { useEffect, useRef, useState } from 'react'

// Odanın o anki arka planı açık mı koyu mu: renk parlaklığına göre. Odak modundaki sayaç bununla
// yazı ve halka rengini seçer (gece koyu oda → açık yazı, gündüz açık oda → koyu yazı).
function toneOf(color) {
  const hex = color.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 'light'
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25 ? 'dark' : 'light'
}

// RoomCanvas arka planı gün zamanı ve temayla değişir (--room-bg); değişince yeniden ölçülür.
function useRoomTone(roomRef) {
  const [room, setRoom] = useState({ tone: 'light', color: '' })
  useEffect(() => {
    const host = roomRef.current
    if (!host) return undefined
    const measure = () => {
      const canvas = host.querySelector('.room-canvas')
      if (!canvas) return
      const color = getComputedStyle(canvas).getPropertyValue('--room-bg').trim()
      setRoom((old) => (old.color === color ? old : { tone: toneOf(color), color }))
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'data-time'] })
    return () => mo.disconnect()
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
