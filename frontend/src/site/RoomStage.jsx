import { useEffect } from 'react'

// Oda sayfalarının düzeni: oda sahnesi header ile footer arasındaki alanın tamamını kaplar (arka plan
// odanın kendi rengi), sağda yüzen bir panel durur. Odak modunda sayfa tam ekran olur; header,
// footer ve panelin geri kalanı gizlenir, yalnızca oda ve focusPanel kalır.
//
// renderRoom(canvasStyle): odayı çizer; canvasStyle, 3D sahneyi panelin solunda kalan alana sığdırır.
export default function RoomStage({ renderRoom, panel, focusPanel, focusMode, onFocusModeChange }) {
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
    <div className={`stage${focusMode ? ' stage--focus' : ''}`}>
      <div className="stage__room">{renderRoom({ width: 'var(--stage-canvas-w, 100%)' })}</div>
      <aside className="stage__panel" aria-label={focusMode ? 'Sayaç' : 'Oda paneli'}>
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
