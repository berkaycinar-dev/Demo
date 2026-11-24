import { THEMES } from '../rooms/themes'
import useImageState from './useImageState'
import { thumbOf, tintOf, useDocumentDark } from './roomThumbs'

function Shot({ theme, dark, className, eager, people }) {
  const [state, imgProps] = useImageState()
  const tint = tintOf(theme, dark)
  return (
    <span className={`theme-option__img ${className}`} data-state={state} style={state === 'error' && tint ? { '--shot-tint': tint } : undefined}>
      {state === 'error' ? (
        // yüklenemezse: temanın renginde kutu ve tema adı (adı kart zaten okutuyor, burada yalnızca görsel)
        <span className="theme-option__fallback" aria-hidden="true">
          {THEMES[theme]?.label}
        </span>
      ) : (
        <img src={thumbOf(theme, dark, people)} alt="" width="480" height="360" loading={eager ? 'eager' : 'lazy'} decoding="async" {...imgProps} />
      )}
    </span>
  )
}

/** Tema görseli, açık / koyu ışığı dışarıdan verilen sürüm. */
export function ThemeShot({ theme, dark, className = '', eager = false, people = false }) {
  return <Shot key={`${theme}-${dark}-${people}`} theme={theme} dark={dark} className={className} eager={eager} people={people} />
}

/** Temanın izometrik oda görseli; açık modda gündüz, koyu modda akşam. Süs görselidir (alt boş).
 *  people: masalarda çalışan avatarlarla çizilmiş varyant (yalnızca üretilmiş temalar için). */
export default function RoomShot({ theme, className = '', eager = false, people = false }) {
  const dark = useDocumentDark()
  return <ThemeShot theme={theme} dark={dark} className={className} eager={eager} people={people} />
}
