// Avatar atölyesi ikonları: 24 px ızgara, 2 px çizgi, yuvarlak uçlar (sitenin diğer SVG'leriyle aynı dil).
const PATHS = {
  body: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  hair: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </>
  ),
  clothes: <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />,
  extras: (
    <>
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="M14 15a2 2 0 0 0-4 0M2.5 13 5 7c.7-1.3 1.4-2 3-2M21.5 13 19 7c-.7-1.3-1.5-2-3-2" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />,
  reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  drag: <path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20" />,
  tap: <path d="M10 9.5V4a2 2 0 0 1 4 0v6M14 9a2 2 0 0 1 4 0v2M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.83L7 15V8a2 2 0 0 1 3 0" />,
  hat: <path d="M5 17c0-5.5 2.2-10 7-10s7 4.5 7 10M2 17.5h20M5.4 13.5h13.2" />,
  hatOff: <path d="M5 17c0-5.5 2.2-10 7-10s7 4.5 7 10M2 17.5h20M5.4 13.5h13.2M3 3l18 18" />,
  // görsel yüklenemezse yer tutucu
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  none: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8" />,
  // poz ve çalışma türü (önizleme HUD'u)
  focus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12h.01" />
    </>
  ),
  break: <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9.5h1.5a2.75 2.75 0 0 1 0 5.5H16M8 2.5v2.5M12 2.5v2.5" />,
  away: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  walk: <path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0zM20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0zM16 17h4M4 13h4" />,
  read: <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />,
  type: <path d="M6 5h12a2 2 0 0 1 2 2v8.5l1.8 3.6a1 1 0 0 1-.9 1.4H3.1a1 1 0 0 1-.9-1.4L4 15.5V7a2 2 0 0 1 2-2zM4 15.5h16" />,
  // kombin slotu: kaydet ve kaydedildi onayı
  save: <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7" />,
  check: <path d="M20 6 9 17l-5-5" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M5 12h14M12 5v14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  // rastgele avatar: beş noktalı zar
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" strokeWidth="2.6" />
    </>
  ),
  // telefonda poz ve kombinler alt sayfasını açar: askı
  outfits: <path d="M12 7a2 2 0 1 1 2-2c0 1.1-.9 1.6-2 2.4v1.1M12 8.5l9.2 7.4a1.4 1.4 0 0 1-.9 2.6H3.7a1.4 1.4 0 0 1-.9-2.6z" />,
}

export default function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}
