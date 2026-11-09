import { useEffect, useState } from 'react'
import Icon from './AvatarIcons'
import useImageState from './useImageState'

// Oda görselleri: scripts/render-room-thumbs.mjs ile 3D sahneden bir kez üretilir (480×360, saydam zemin).
// Koyu modda akşam ışığında çizilmiş varyant (<tema>-evening.webp): krem gündüz duvarları koyu
// zeminde parlak kutu gibi durmaz, kart canlı sahneyle aynı ışıkta görünür.
export const thumbOf = (theme, isDark) => `${import.meta.env.BASE_URL}room-thumbs/${theme}${isDark ? '-evening' : ''}.webp`

const isDocDark = () => typeof document !== 'undefined' && document.documentElement.dataset.mode === 'dark'

// Sitenin açık / koyu modu (<html data-mode>, useColorMode yazar): görsel prop beklemeden doğru ışığı seçer.
export function useDocumentDark() {
  const [dark, setDark] = useState(isDocDark)
  useEffect(() => {
    const root = document.documentElement
    const sync = () => setDark(isDocDark())
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(root, { attributes: true, attributeFilter: ['data-mode'] })
    return () => mo.disconnect()
  }, [])
  return dark
}

function Shot({ src, className, eager }) {
  const [state, imgProps] = useImageState()
  return (
    <span className={`theme-option__img ${className}`} data-state={state}>
      {state === 'error' ? (
        <Icon name="image" size={28} />
      ) : (
        <img src={src} alt="" width="480" height="360" loading={eager ? 'eager' : 'lazy'} decoding="async" {...imgProps} />
      )}
    </span>
  )
}

/** Temanın izometrik oda görseli; açık modda gündüz, koyu modda akşam. Süs görselidir (alt boş). */
export default function RoomShot({ theme, className = '', eager = false }) {
  const dark = useDocumentDark()
  const src = thumbOf(theme, dark)
  return <Shot key={src} src={src} className={className} eager={eager} />
}
