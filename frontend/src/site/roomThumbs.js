import { useEffect, useState } from 'react'

// Oda görselleri: scripts/render-room-thumbs.mjs ile 3D sahneden bir kez üretilir (480×360, saydam zemin).
// Koyu modda akşam ışığında çizilmiş varyant (<tema>-evening.webp): krem gündüz duvarları koyu
// zeminde parlak kutu gibi durmaz, kart canlı sahneyle aynı ışıkta görünür.
// people: masaları çalışan avatarlarla dolu tanıtım varyantı (<tema>-people[-evening].webp; THUMB_PEOPLE=focus).
export const thumbOf = (theme, isDark, people = false) =>
  `${import.meta.env.BASE_URL}room-thumbs/${theme}${people ? '-people' : ''}${isDark ? '-evening' : ''}.webp`

// Görsel yüklenemezse yer tutucunun zemini: her temanın kendi görselinin (opak piksellerin) ortalama
// rengi, [gündüz, akşam]. Görseller yeniden üretilirse bu değerler de yeniden ölçülmeli.
const THUMB_TINTS = {
  library: ['#8a623e', '#6e4121'],
  cabin: ['#815835', '#6a3c1c'],
  office: ['#959796', '#7f6750'],
  teagarden: ['#a29074', '#8b6643'],
  camp: ['#6b7746', '#625728'],
  space: ['#6d7682', '#5f5751'],
  underwater: ['#5f7a82', '#475d6e'],
  bar: ['#533b26', '#492913'],
  treehouse: ['#806236', '#6c431c'],
  cyber: ['#292f3e', '#271f26'],
}
export const tintOf = (theme, isDark) => THUMB_TINTS[theme]?.[isDark ? 1 : 0] ?? null

const isDocDark =() => typeof document !== 'undefined' && document.documentElement.dataset.mode === 'dark'

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
