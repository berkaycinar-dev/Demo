import Icon from './AvatarIcons'
import useImageState from './useImageState'
import { thumbOf, useDocumentDark } from './roomThumbs'

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
