import { useEffect, useState } from 'react'

const KEY = 'odakhane-mode'
let fadeTimer = 0

// Açık / koyu mod: kayıtlı seçim yoksa sistem tercihine uyar. Seçim <html data-mode> ile uygulanır.
function initialMode() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* depolama kapalı olabilir */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function useColorMode() {
  const [mode, setMode] = useState(initialMode)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') root.dataset.mode = 'dark'
    else delete root.dataset.mode
    return () => {
      delete root.dataset.mode
    }
  }, [mode])

  // Geçişte renkler 200 ms'de döner (yer değiştirme yok; "hareketi azalt"ta da kalır).
  const toggle = () => {
    const root = document.documentElement
    root.dataset.modeFade = ''
    clearTimeout(fadeTimer)
    fadeTimer = setTimeout(() => delete root.dataset.modeFade, 260)
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* yok say */
      }
      return next
    })
  }

  return { mode, isDark: mode === 'dark', toggle }
}
