import { useEffect, useState } from 'react'

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
