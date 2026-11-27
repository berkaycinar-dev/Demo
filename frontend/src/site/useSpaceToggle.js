import { useEffect, useRef } from 'react'

// Boşluk tuşu metin alanlarında yazar, düğme ve bağlantılarda kendi işini yapar; orada kısayol yok.
const OWNS_SPACE = 'input, textarea, select, button, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="textbox"], [role="combobox"]'

// Odadayken Boşluk sayacı duraklatır / sürdürür (kronometre kartı da kullanır).
export default function useSpaceToggle(toggle) {
  const ref = useRef(toggle)
  useEffect(() => {
    ref.current = toggle
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      if (e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (e.target instanceof Element && e.target.closest(OWNS_SPACE)) return
      e.preventDefault()
      ref.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
