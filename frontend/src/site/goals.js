import { useCallback, useState } from 'react'

// Günlük ve haftalık odak hedefi (dakika). Odam'daki "Hedefleri düzenle" penceresinde seçilir, Sayfam'daki
// Bugün ve Bu hafta kartları okur. Kullanıcı başına bu tarayıcıda tutulur (Odam ayarları gibi).
export const GOAL_DEFAULTS = { daily: 180, weekly: 900 }

// Hazır seçenekler (dakika) ve "Özel" için sınırlar: günlük 30 dk - 16 sa, haftalık 1 - 112 sa.
export const DAILY_OPTIONS = [60, 120, 180, 240]
export const WEEKLY_OPTIONS = [600, 900, 1200, 1500]
export const GOAL_LIMITS = { daily: [30, 960], weekly: [60, 6720] }

const keyOf = (username) => `samedesk.goals.${username}`
const valid = (v, [min, max]) => Number.isFinite(v) && v >= min && v <= max

export function loadGoals(username) {
  try {
    const s = JSON.parse(localStorage.getItem(keyOf(username)) ?? 'null')
    return {
      daily: valid(s?.daily, GOAL_LIMITS.daily) ? s.daily : GOAL_DEFAULTS.daily,
      weekly: valid(s?.weekly, GOAL_LIMITS.weekly) ? s.weekly : GOAL_DEFAULTS.weekly,
    }
  } catch {
    return { ...GOAL_DEFAULTS }
  }
}

function saveGoals(username, goals) {
  try {
    localStorage.setItem(keyOf(username), JSON.stringify(goals))
  } catch {
    /* depolama kapalıysa yalnızca bu oturumda */
  }
}

/** [goals, setGoals]: oturumdaki kullanıcının hedefleri. Kullanıcı değişince onunkiler okunur. */
export function useGoals(user) {
  const name = user?.username ?? null
  const [state, setState] = useState(() => ({ name, goals: name ? loadGoals(name) : GOAL_DEFAULTS }))
  const goals = state.name === name ? state.goals : name ? loadGoals(name) : GOAL_DEFAULTS
  const setGoals = useCallback(
    (next) => {
      if (!name) return
      saveGoals(name, next)
      setState({ name, goals: next })
    },
    [name],
  )
  return [goals, setGoals]
}

/** Hedefin yüzdesi (100'ü geçebilir). */
export const goalPercent = (minutes, goal) => (goal > 0 ? Math.round((minutes / goal) * 100) : 0)
