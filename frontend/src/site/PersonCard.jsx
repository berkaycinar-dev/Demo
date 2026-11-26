import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cachedPortrait, drawPortrait } from '../avatars/portraitShot'
import AvatarPortrait from './AvatarPortrait'
import './PersonCard.css'

// Kart metinleri: sayılar ayrı değişken, çeviride sıra değişebilir.
const CARD_COPY = {
  status: { idle: 'Masada', focus: 'Odakta', break: 'Molada', away: 'Uzakta' },
  // süre: 60 dakikadan sonra saat ve dakika ("1 sa 5 dk")
  duration: (h, m) => (h ? `${h} sa${m ? ` ${m} dk` : ''}` : `${m} dk`),
  workingOn: 'Üzerinde çalıştığı:',
  inRoom: (time) => `Odada ${time}`,
  justArrived: 'Odaya az önce geldi',
}

// ekran kenarından en az bu kadar içeride; tetikleyiciden bu kadar uzakta
const MARGIN = 8
const GAP = 10
const ORDER = { left: ['left', 'right', 'top', 'bottom'], top: ['top', 'bottom', 'right', 'left'] }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const timeOf = (mins) => CARD_COPY.duration(Math.floor(mins / 60), mins % 60)

// Tetikleyicinin (r) yanına yerleşim: önce tercih edilen yön, sığmazsa sıradaki; hiçbiri sığmazsa
// sonuncusu ekrana kırpılır.
function placeCard(r, w, h, vw, vh, prefer) {
  let pick = null
  for (const side of ORDER[prefer] ?? ORDER.left) {
    let x
    let y
    if (side === 'left' || side === 'right') {
      x = side === 'left' ? r.left - GAP - w : r.right + GAP
      y = clamp(r.top + r.height / 2 - h / 2, MARGIN, vh - h - MARGIN)
    } else {
      x = clamp(r.left + r.width / 2 - w / 2, MARGIN, vw - w - MARGIN)
      y = side === 'top' ? r.top - GAP - h : r.bottom + GAP
    }
    pick = { side, x, y }
    if (x >= MARGIN && x + w <= vw - MARGIN && y >= MARGIN && y + h <= vh - MARGIN) return pick
  }
  return { ...pick, x: clamp(pick.x, MARGIN, vw - w - MARGIN), y: clamp(pick.y, MARGIN, vh - h - MARGIN) }
}

// Yakın plan portre: önbellekteyse hemen, değilse bir sonraki karede tek paylaşılan çizicide çizilir.
// Çizilene kadar (ya da WebGL yoksa) düz voxel büst durur; kutu hiç boş kalmaz.
function useShot(avatar) {
  const key = avatar ? JSON.stringify({ ...avatar, name: '' }) : ''
  const cached = cachedPortrait(avatar)
  const [drawn, setDrawn] = useState({ key: '', url: null })
  useEffect(() => {
    if (!avatar || cached) return undefined
    const id = requestAnimationFrame(() => setDrawn({ key, url: drawPortrait(avatar) }))
    return () => cancelAnimationFrame(id)
  }, [avatar, cached, key])
  return cached ?? (drawn.key === key ? drawn.url : null)
}

/**
 * Odadaki kişinin kartı: yakın plan avatar, ad, durum (odaktaysa kaç dakikadır), yazdıysa ne üzerinde
 * çalıştığı ve odada ne kadardır bulunduğu. Ekranın üstüne biner (portal), kendi denetimi yoktur
 * (role=tooltip); tetikleyici aria-describedby ile bağlanır. anchor: kartın yanına yerleştiği öğe
 * (listede satır, sahnede avatarın etiketi); taşınırsa kart da izler. prefer: 'left' | 'top'.
 * person: { name, avatar, status, focusMin?, inRoomMin?, workingOn? } (null değerli satır çizilmez).
 */
export default function PersonCard({ id, person, anchor, prefer = 'left' }) {
  const ref = useRef(null)
  const shot = useShot(person.avatar)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !anchor) return undefined
    let raf = 0
    const place = () => {
      if (!anchor.isConnected) {
        el.style.visibility = 'hidden'
        return
      }
      const r = anchor.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      const { side, x, y } = placeCard(r, el.offsetWidth, el.offsetHeight, vw, vh, prefer)
      el.style.visibility = ''
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
      el.dataset.side = side
    }
    // tetikleyici yürüyen bir avatar olabilir; kart açıkken her karede yeniden yerleşir
    const loop = () => {
      place()
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [anchor, prefer])

  const label = CARD_COPY.status[person.status] ?? CARD_COPY.status.focus
  const host = document.fullscreenElement ?? document.body
  return createPortal(
    <div ref={ref} id={id} className="person-card" role="tooltip">
      <span className="person-card__shot" aria-hidden="true">
        {shot ? <img src={shot} alt="" width="72" height="72" /> : <AvatarPortrait avatar={person.avatar} size={56} />}
      </span>
      <span className="person-card__body">
        <span className="person-card__name">{person.name}</span>
        <span className={`person-card__status roster__item--${person.status}`}>
          <span className="roster__dot" aria-hidden="true" />
          {label}
          {person.focusMin != null && person.focusMin >= 1 && <span className="person-card__time">{` · ${timeOf(person.focusMin)}`}</span>}
        </span>
        {person.workingOn && (
          <span className="person-card__work">
            <span className="sr-only">{CARD_COPY.workingOn} </span>
            {person.workingOn}
          </span>
        )}
        {person.inRoomMin != null && <span className="person-card__meta">{person.inRoomMin >= 1 ? CARD_COPY.inRoom(timeOf(person.inRoomMin)) : CARD_COPY.justArrived}</span>}
      </span>
    </div>,
    host,
  )
}
