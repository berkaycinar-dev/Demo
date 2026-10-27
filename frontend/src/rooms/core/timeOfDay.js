// Gün zamanı ön ayarları. Işık sayısı her ayarda aynıdır, yalnızca renk ve şiddet değişir;
// böylece geçişte shader yeniden derlenmez, takılma olmaz.
// sun.azimuth: +z ekseninden saat yönünün tersine derece, -90 = sol duvar (pencereler) tarafı.

export const TIME_MODES = ['auto', 'day', 'evening', 'night']

export const TIME_LABELS = {
  auto: 'Otomatik',
  day: 'Gündüz',
  evening: 'Akşam',
  night: 'Gece',
}

export const TIME_PRESETS = {
  day: {
    background: '#e9e2d6',
    sky: '#fff6e8',
    ground: '#a07a52',
    hemi: 2.1,
    sun: { color: '#fff1d8', intensity: 2.4, azimuth: -62, elevation: 52 },
    lampColor: '#ffd590',
    lamp: 0.5,
    glow: 0.1,
    glass: '#dce9f0',
    bulb: '#f4e6bf',
    ring: '#fffaf0',
  },
  evening: {
    background: '#e3cdb3',
    sky: '#ffd6ad',
    ground: '#7a5038',
    hemi: 1.5,
    sun: { color: '#ffa760', intensity: 2.1, azimuth: -74, elevation: 24 },
    lampColor: '#ffc978',
    lamp: 2.4,
    glow: 0.45,
    glass: '#f3b67d',
    bulb: '#ffe0a0',
    ring: '#fff3e0',
  },
  night: {
    background: '#1f2433',
    sky: '#5d6d9e',
    ground: '#2a2027',
    hemi: 1.3,
    sun: { color: '#9db2ff', intensity: 0.55, azimuth: -55, elevation: 40 },
    lampColor: '#ffc56e',
    lamp: 5,
    glow: 0.7,
    glass: '#24304d',
    bulb: '#ffe6a8',
    ring: '#f5ead6',
  },
}

export function timeOfDayForHour(hour) {
  if (hour >= 7 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}
