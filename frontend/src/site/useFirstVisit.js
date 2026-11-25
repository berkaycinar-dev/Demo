import { useEffect, useState } from 'react'

const KEY = 'samedesk.seen-hints'

function readSeen() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// Yardım satırlarının ilk ziyaret anahtarı: bu sayfa (id) ilk kez açıldıysa true döner ve bu ziyaret
// boyunca true kalır; bir sonraki ziyarette false. Depolama yoksa (gizli pencere) her ziyaret ilk sayılır.
export default function useFirstVisit(id) {
  const [first] = useState(() => !readSeen().includes(id))
  useEffect(() => {
    if (!first) return
    try {
      const seen = readSeen()
      if (!seen.includes(id)) localStorage.setItem(KEY, JSON.stringify([...seen, id]))
    } catch {
      // depolama kapalı: ipuçları her ziyarette görünür
    }
  }, [first, id])
  return first
}
