// Ad alanları (oda adı, görünen ad) için uzunluk, emoji ve boş ad durumu: alanın altında tek satır not ve
// karakter sayacı. Ad hiçbir zaman sessizce kesilmez; sınır yaklaşınca sayaç uyarır, aşılınca hata verir ve
// kayıt engellenir. Uzunluk, kullanıcının gördüğü harf sayısıdır (emoji ve birleşik karakterler tek sayılır).

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('tr', { granularity: 'grapheme' }) : null

export const textLength = (s) => (segmenter ? [...segmenter.segment(s)].length : [...s].length)

const EMOJI = /\p{Extended_Pictographic}/u
export const hasEmoji = (s) => EMOJI.test(s)

// Sınıra kaç harf kala sayaç uyarmaya başlar
const nearAt = (max) => max - Math.max(4, Math.round(max / 6))

/** Adın durumu: tone 'ok' | 'near' | 'warn' | 'over'; message görünür not (yoksa null). */
export function nameStatus(value, max, emptyNote) {
  const n = textLength(value)
  if (n > max) return { n, tone: 'over', message: `${n - max} karakter fazla. En çok ${max} karakter olabilir.` }
  if (hasEmoji(value)) return { n, tone: 'warn', message: 'Emoji her cihazda aynı görünmeyebilir.' }
  if (n >= nearAt(max)) return { n, tone: 'near', message: n === max ? 'Sınıra ulaştın.' : `Sınıra ${max - n} karakter kaldı.` }
  if (!value.trim()) return { n, tone: 'ok', message: emptyNote }
  return { n, tone: 'ok', message: null }
}
