import { useEffect, useRef } from 'react'

// Yazı yazılan alanlar harf ve rakamları kendisi kullanır; orada kısayol çalışmaz.
const TYPING =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"]'

// Tek tuşlu kısayol: key küçük harfle verilir ("f", "1", "/"). Ctrl, Alt ya da Cmd ile basılınca çalışmaz
// (tarayıcı kısayolları). Shift serbest: Türkçe klavyede "/" Shift+7'dir. Basılı tutma tekrarlamaz.
// Görünür öğede aria-keyshortcuts ile duyurulmalıdır.
export default function useShortcut(key, handler, enabled = true) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      if (e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.toLocaleLowerCase('tr') !== key) return
      if (e.target instanceof Element && e.target.closest(TYPING)) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, enabled])
}
