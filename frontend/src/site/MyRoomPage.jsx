import { useEffect, useMemo, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import RoomStage, { FocusModeButton } from './RoomStage'
import TimerCard from './TimerCard'
import { formatMinutes } from './usePomodoro'

const MY_STATUSES = [
  { id: 'focus', label: 'Odakta' },
  { id: 'break', label: 'Molada' },
  { id: 'away', label: 'Uzakta' },
]

const STATUS_LABELS = Object.fromEntries(MY_STATUSES.map((s) => [s.id, s.label]))

// Şimdiki zaman; every ms'de bir yenilenir (listede uzaktaki dakikası).
function useClock(every) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

const seedOf = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 17)

// Çok kişili oda: oda tam alanda, sağ panelde durum, sayaç, sıralama ve odadakiler. Oda seçilmemişse
// odalar sayfasına yönlendirir.
export default function MyRoomPage({ room, onBrowse, ...rest }) {
  if (!room) {
    return (
      <div className="site-main">
        <section className="site-card empty-state">
          <h1>Henüz bir odaya girmedin</h1>
          <p className="site-muted">Herkese açık odalardan birine katıl ya da davet koduyla gizli bir odaya gir.</p>
          <button type="button" className="site-btn site-btn--primary" onClick={onBrowse}>
            Odalara göz at
          </button>
        </section>
      </div>
    )
  }
  return <RoomView key={room.id} room={room} {...rest} />
}

// Durum düğmeleri: Molada'ya basınca en yakın boş mola yerine yürürsün; zemindeki bir halkaya
// tıklayınca o mola yerine gidersin (doluysa sıradakine). Avatarların üstünde yalnızca durum
// noktası durur (kalabalıkta isimler üst üste binmesin); isimler paneldeki listede. Listede
// bir kişinin üstüne gelince odadaki avatarının adı açılır; "İsimler" herkesinkini açar.
function RoomView({ room, avatar, timer, onLeave, focusMode, onFocusModeChange }) {
  const [spot, setSpot] = useState(null)
  const [names, setNames] = useState(false)
  const [picked, setPicked] = useState(null)
  const [rankOpen, setRankOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const now = useClock(30000)
  const { label, Room } = THEMES[room.theme]
  const { occupants, setMyStatus, myStatus } = useRoomPeople({ capacity: room.capacity, seed: seedOf(room.id), me: avatar, cheer: timer.completed })

  // Sayaç aşama değiştirince avatar da değişir (elle seçilen durum bir sonraki aşamaya kadar kalır).
  useEffect(() => {
    if (timer.running) setMyStatus(timer.phase === 'break' ? 'break' : 'focus')
  }, [timer.phase, timer.running, setMyStatus])

  // Sıralama: bugünkü odak süresi. Oda arkadaşlarınınki simülasyon (oda ve kişiye göre sabit),
  // seninki sayaçtan gelir.
  const ranking = useMemo(() => {
    const list = occupants.map((o) => ({
      id: o.id,
      name: o.me ? 'Sen' : o.name,
      me: !!o.me,
      minutes: o.me ? timer.stats.minutes : 15 + (seedOf(room.id + o.id) % 210),
    }))
    return list.sort((a, b) => b.minutes - a.minutes)
  }, [occupants, timer.stats.minutes, room.id])

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      },
      () => {},
    )
  }

  const timerCard = <TimerCard timer={timer} title="Odak sayacı" compact={focusMode} />

  const panel = (
    <>
      <div className="stage-card stage-card--head">
        <div>
          <span className="eyebrow">
            {label} · {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
          </span>
          <h1 className="stage-card__title">{room.name}</h1>
          {spot && <p className="site-muted">Mola yeri: {spot.label}</p>}
          {room.code && (
            <p className="invite-code">
              Davet kodu <code>{room.code}</code>
              <button type="button" className="link-btn" onClick={copyCode}>
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </p>
          )}
        </div>
        <FocusModeButton onClick={() => onFocusModeChange(true)} />
      </div>

      <div className="stage-card">{timerCard}</div>

      <div className="stage-card">
        <span className="field__label">Durumun</span>
        <div className="choice-row" role="group" aria-label="Durumun">
          {MY_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={myStatus === s.id}
              onClick={() => {
                setMyStatus(s.id)
                if (s.id !== 'break') setSpot(null)
              }}
            >
              {s.label}
            </button>
          ))}
          <button type="button" aria-pressed={names} onClick={() => setNames((v) => !v)}>
            İsimler
          </button>
        </div>
      </div>

      <div className="stage-card rank">
        <button type="button" className="rank__toggle" aria-expanded={rankOpen} aria-controls="rankList" onClick={() => setRankOpen((v) => !v)}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
            </svg>
            Sıralama
          </span>
          <svg className="rank__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div id="rankList" className="rank__body" hidden={!rankOpen}>
          <p className="site-muted rank__note">Bugünkü odak süresi</p>
          <ol className="rank__list">
            {ranking.map((r, i) => (
              <li key={r.id} className={`rank__row${r.me ? ' rank__row--me' : ''}`}>
                <span className={`rank__no rank__no--${i + 1}`}>{i + 1}</span>
                <span className="rank__name">{r.name}</span>
                <span className="rank__min">{formatMinutes(r.minutes)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="stage-card">
        <span className="field__label">Odadakiler</span>
        <ul className="roster" aria-label="Odadakiler">
          {occupants.map((o) => (
            <li
              key={o.id}
              className={`roster__item roster__item--${o.status}`}
              onPointerEnter={() => setPicked(o.id)}
              onPointerLeave={() => setPicked(null)}
            >
              <span className="roster__dot" aria-hidden="true" />
              {o.me ? 'Sen' : o.name}
              <span className="site-muted">
                {STATUS_LABELS[o.status]}
                {o.status === 'away' && o.since && now - o.since >= 60000 ? ` · ${Math.floor((now - o.since) / 60000)} dk` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="site-btn site-btn--wide" onClick={onLeave}>
        Odadan çık
      </button>
    </>
  )

  return (
    <RoomStage
      focusMode={focusMode}
      onFocusModeChange={onFocusModeChange}
      renderRoom={(canvasStyle) => (
        <Room
          capacity={room.capacity}
          canvasStyle={canvasStyle}
          onSpotClick={(s) => {
            setSpot(s)
            setMyStatus('break', s.id)
          }}
        >
          <AvatarCrowd occupants={occupants} theme={room.theme} showNames={names} highlight={picked} />
        </Room>
      )}
      panel={panel}
      focusPanel={<div className="stage-card">{timerCard}</div>}
    />
  )
}
