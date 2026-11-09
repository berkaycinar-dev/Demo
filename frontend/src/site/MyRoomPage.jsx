import { useEffect, useMemo, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople from '../avatars/useRoomPeople'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import RoomStage, { FocusModeButton } from './RoomStage'
import TimerCard from './TimerCard'
import { formatMinutes } from './usePomodoro'
import Dotted from './Dotted'

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
// bir kişinin üstüne gelince odadaki avatarının adı açılır; sahne araç çubuğundaki "İsimler"
// herkesinkini açar. Durum işaretleri şekille de ayrılır (daire, elmas, içi boş halka) ve her durum
// düğmesi kendi işaretini taşır: düğmeler işaretlerin lejantıdır, anlam yalnızca renkle verilmez.
// Zemindeki mola halkaları düğmelerin altındaki tek satırda açıklanır.
function RoomLegend() {
  return (
    <p className="room-legend">
      <span className="room-legend__ring" aria-hidden="true" />
      Zemindeki halkalar: mola yerleri
    </p>
  )
}

function RoomView({ room, avatar, timer, onLeave, focusMode, onFocusModeChange }) {
  const [spot, setSpot] = useState(null)
  const [names, setNames] = useState(false)
  const [picked, setPicked] = useState(null)
  const [peopleOpen, setPeopleOpen] = useState(false)
  // null | 'ok' | 'failed'
  const [copy, setCopy] = useState(null)
  const codeRef = useRef(null)
  const copyTimer = useRef(0)
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
      status: o.status,
      since: o.since,
      minutes: o.me ? timer.stats.minutes : 15 + (seedOf(room.id + o.id) % 210),
    }))
    return list.sort((a, b) => b.minutes - a.minutes)
  }, [occupants, timer.stats.minutes, room.id])

  useEffect(() => () => clearTimeout(copyTimer.current), [])
  const flash = (state, ms) => {
    clearTimeout(copyTimer.current)
    setCopy(state)
    copyTimer.current = setTimeout(() => setCopy(null), ms)
  }
  // Pano yoksa (güvensiz bağlam) ya da izin verilmezse kod seçilir; kullanıcı elle kopyalar.
  const copyFailed = () => {
    const el = codeRef.current
    const sel = window.getSelection?.()
    if (el && sel) {
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    flash('failed', 8000)
  }
  const copyCode = () => {
    if (!navigator.clipboard?.writeText) return copyFailed()
    navigator.clipboard.writeText(room.code).then(() => flash('ok', 1600), copyFailed)
  }

  const timerCard = <TimerCard timer={timer} title="Odak sayacı" compact={focusMode} />

  // Panel tek sütunda, 1440×900'de kaydırmadan sığar: başlık kartında durumun ve iki eylem, sonra
  // sayaç, en altta odadakiler (sıralamayla birleşik, açılır). Liste kapasiteyle uzadığı için kapalı başlar.
  const panel = (
    <>
      <div className="stage-card stage-card--head">
        <div>
          <h1 className="stage-card__title">
            <Dotted text={room.name} />
          </h1>
          <p className="site-muted">
            <Dotted parts={[label, `${room.capacity} kişilik`, ACCESS_LABELS[room.access]]} keep />
          </p>
          {spot && <p className="site-muted">Mola yeri: {spot.label}</p>}
          {room.code && (
            <p className="invite-code">
              Davet kodu <code ref={codeRef}>{room.code}</code>
              <button type="button" className="link-btn" onClick={copyCode}>
                {copy === 'ok' ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <span className={copy === 'failed' ? 'invite-code__msg' : 'sr-only'} role="status">
                {copy === 'ok' && 'Davet kodu kopyalandı.'}
                {copy === 'failed' && 'Kopyalanamadı. Kod seçili; elle kopyalayabilirsin.'}
              </span>
            </p>
          )}
        </div>
        <div className="stage-card__status">
          <span className="field__label">Durumun</span>
          <div className="choice-row" role="group" aria-label="Durumun">
            {MY_STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`status-chip roster__item--${s.id}`}
                aria-pressed={myStatus === s.id}
                onClick={() => {
                  setMyStatus(s.id)
                  if (s.id !== 'break') setSpot(null)
                }}
              >
                <span className="roster__dot" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
          <RoomLegend />
        </div>
        <div className="stage-card__actions">
          <FocusModeButton onClick={() => onFocusModeChange(true)} />
          <button type="button" className="site-btn" onClick={onLeave}>
            Odadan çık
          </button>
        </div>
      </div>

      <div className="stage-card">{timerCard}</div>

      <div className="stage-card fold">
        <button type="button" className="fold__toggle" aria-expanded={peopleOpen} aria-controls="peopleList" onClick={() => setPeopleOpen((v) => !v)}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Odadakiler
            <span className="fold__count">{occupants.length}</span>
          </span>
          <svg className="fold__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div id="peopleList" className="fold__body" hidden={!peopleOpen}>
          <p className="site-muted rank__note">Bugünkü odak süresine göre</p>
          <ol className="rank__list" aria-label="Odadakiler">
            {ranking.map((r, i) => (
              <li
                key={r.id}
                className={`rank__row roster__item--${r.status}${r.me ? ' rank__row--me' : ''}`}
                onPointerEnter={() => setPicked(r.id)}
                onPointerLeave={() => setPicked(null)}
              >
                <span className={`rank__no rank__no--${i + 1}`}>{i + 1}</span>
                <span className="roster__dot" aria-hidden="true" />
                <span className="rank__name">{r.name}</span>
                <span className="rank__status site-muted">
                  {STATUS_LABELS[r.status]}
                  {r.status === 'away' && r.since && now - r.since >= 60000 ? ` · ${Math.floor((now - r.since) / 60000)} dk` : ''}
                </span>
                <span className="rank__min">{formatMinutes(r.minutes)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  )

  return (
    <RoomStage
      focusMode={focusMode}
      onFocusModeChange={onFocusModeChange}
      timer={timer}
      renderRoom={(canvasStyle) => (
        <Room
          capacity={room.capacity}
          canvasStyle={canvasStyle}
          hint="Halkaya tıkla: mola yerine git · Sürükle: döndür"
          controls={
            <button type="button" aria-pressed={names} onClick={() => setNames((v) => !v)}>
              İsimler
            </button>
          }
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
