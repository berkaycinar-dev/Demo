// Sayfa içi bölümlere kaydırma (header yüksekliği kadar pay bırakır).
/** Öğeyi görünür alana kaydırır ("hareketi azalt"ta anında). block: scrollIntoView'daki gibi. */
export function revealEl(el, block = 'start') {
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block, behavior: reduce ? 'auto' : 'smooth' })
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: reduce ? 'auto' : 'smooth' })
}
