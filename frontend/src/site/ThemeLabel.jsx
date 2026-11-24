import { THEMES } from '../rooms/themes'

// Odanın tema adı, temanın vurgu renginde ve önünde küçük kare işaretle: renk tek başına taşımaz,
// kare biçimi de "oda kimliği" der. Renk kapsayan öğedeki data-room-theme'den gelir (theme.css).
// markOnly: başlık zaten temanın adıysa (tek kişilik oda) yalnızca kare, ad tekrarlanmaz.
export default function ThemeLabel({ theme, className = '', markOnly = false }) {
  if (markOnly)
    return <i className={`theme-label__mark theme-label__mark--lead ${className}`.trim()} data-room-theme={theme} aria-hidden="true" />
  return (
    <span className={`theme-label ${className}`.trim()} data-room-theme={theme}>
      <i className="theme-label__mark" aria-hidden="true" />
      {THEMES[theme]?.label}
    </span>
  )
}
