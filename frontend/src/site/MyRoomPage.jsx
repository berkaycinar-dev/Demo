import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople, { roomSeed as seedOf } from '../avatars/useRoomPeople'
import { useRoom } from '../rooms/core/roomContext'
import { THEMES } from '../rooms/themes'
import { accessLabel } from './access'
import RoomStage, { FocusModeButton, FocusModeNote } from './RoomStage'
import TimerCard from './TimerCard'
import { formatMinutes } from './usePomodoro'
import Dotted from './Dotted'
import ThemeLabel from './ThemeLabel'
import AvatarPortrait from './AvatarPortrait'
import useFirstVisit from './useFirstVisit'

const STATUS_LABELS = { focus: 'Odakta', break: 'Molada', away: 'Uzakta' }

// Durum sayaçtan gelir (odak bloku: Odakta, mola: Molada); elle yalnızca Uzakta seçilir.
const STATUS_COPY = {
  label: 'Durumun',
  // çipin ekran okuyucu adı: "Durumun: Odakta"
  chip: (status) => `Durumun: ${status}`,
  fromTimer: 'Durumun sayaçla değişir.',
  away: 'Uzaktayım',
  awayNote: 'Döndüğünde tekrar bas.',
  // molada değilken seçilen mola yeri: sıradaki molada oraya gidilir
  nextBreak: 'Mola başlayınca buraya geçersin.',
}

// Odaya varış ve odadan çıkış metinleri. Sayılar ayrı değişken; çeviride sıra değişebilir.
const ROOM_MOTION_COPY = {
  arriveLead: 'Odaya girdin',
}

// Mola yeri seçicisinin metinleri. Çeviride sıra değişebilsin diye sayı ve ad ayrı değişkendir.
const SPOT_COPY = {
  label: 'Mola yeri',
  choose: 'Bir mola yeri seç',
  nearest: 'En yakın boş yer',
  // aynı addan birden çok yer varsa: "Okuma koltuğu 2"
  numbered: (name, n) => `${name} ${n}`,
  // çipin yanında, seçilen mola yeri (ekran okuyucu: "Mola yeri: Okuma koltuğu")
  chosen: (name) => `Mola yeri: ${name}`,
}

const SCENE_HINT = 'Halkaya tıkla: mola yerini seç · Sürükle: döndür'
const LEAVE = 'Odadan çık'

// Şimdiki zaman; every ms'de bir yenilenir (listede uzaktaki dakikası).
function useClock(every) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(id)
  }, [every])
  return now
}

// Oda adı tek satır kalır ve piksel ızgarasından çıkmaz: 33 px'e sığmazsa 22 px'e iner (ara boyut yok),
// orada da sığmazsa sonu "…" ile kesilir. Tam ad title'da (fareyle) ve metnin kendisinde (ekran okuyucu).
// Ölçüm her genişlik değişiminde 33 px'ten yeniden yapılır; boyama öncesi çalıştığı için titreme olmaz.
function RoomTitle({ name }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      delete el.dataset.fit
      if (el.scrollWidth > el.clientWidth + 1) el.dataset.fit = 'small'
    }
    fit()
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    ro.observe(el)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [name])
  return (
    <h1 ref={ref} className="stage-card__title" title={name}>
      <Dotted text={name} />
    </h1>
  )
}

// Listedeki küçük avatar: kombin slotlarındaki düz voxel büst; kişi listede de odadaki haliyle tanınır.
const AvatarChip = ({ avatar }) => (
  <span className="person-chip">
    <AvatarPortrait avatar={avatar} size={28} />
  </span>
)

function StatusText({ person, now }) {
  return (
    <span className="people__status">
      <span className="roster__dot" aria-hidden="true" />
      {STATUS_LABELS[person.status]}
      {person.status === 'away' && person.since && now - person.since >= 60000 ? ` · ${Math.floor((now - person.since) / 60000)} dk` : ''}
    </span>
  )
}

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

// Odanın mola yerlerini sahnenin içinden sayfaya bildirir (her tema aynı RoomContext'i verir).
function SpotsReporter({ onSpots }) {
  const room = useRoom()
  useEffect(() => {
    onSpots(room?.spots ?? [])
  }, [room, onSpots])
  return null
}

// Aynı addaki yerler numaralanır; listede iki "Okuma koltuğu" seçilemez görünmesin.
function spotOptions(spots) {
  const total = {}
  for (const s of spots) total[s.label] = (total[s.label] ?? 0) + 1
  const seen = {}
  return spots.map((s) => {
    seen[s.label] = (seen[s.label] ?? 0) + 1
    return {
      id: s.id,
      label: total[s.label] > 1 ? SPOT_COPY.numbered(s.label, seen[s.label]) : s.label,
    }
  })
}

// Mola yerini dokunmadan seçme yolu: yerel seçim listesi (klavye, ekran okuyucu, liste). Seçmek molaya
// geçirir; zemindeki halkaya tıklamakla aynı iş. Etiketteki halka işareti odadaki halkaların lejantı.
function SpotPicker({ spots, value, onPick, note }) {
  const id = useId()
  const options = useMemo(() => spotOptions(spots), [spots])
  if (options.length === 0) return null
  return (
    <div className="spot-picker">
      <label className="spot-picker__label" htmlFor={id}>
        <span className="room-legend__ring" aria-hidden="true" />
        {SPOT_COPY.label}
      </label>
      <span className="spot-picker__field">
        <select id={id} className="spot-picker__select" value={value} onChange={(e) => onPick(e.target.value)}>
          <option value="" disabled hidden>
            {SPOT_COPY.choose}
          </option>
          <option value="nearest">{SPOT_COPY.nearest}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="spot-picker__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
      {note && <p className="spot-picker__note">{note}</p>}
    </div>
  )
}

// Durum çipi: şu anki durum (sayaçtan ya da Uzakta) ve küçük bir açılır kutu. Kutuda Uzaktayım ve
// mola yeri seçimi durur; panelde yer kaplamaz. Dışarı tıklayınca ya da Esc ile kapanır, Esc odağı
// çipe geri verir. Kutu sayfanın akışında değil, çipin altına biner.
function StatusMenu({ status, away, onAway, spotName, children }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const chipRef = useRef(null)
  const popId = useId()
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      chipRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  const label = STATUS_LABELS[status]
  return (
    <div className="status-menu" ref={wrapRef}>
      <div className="status-menu__row">
        <button
          ref={chipRef}
          type="button"
          className={`status-pill roster__item--${status}`}
          aria-expanded={open}
          aria-controls={popId}
          aria-label={STATUS_COPY.chip(label)}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="roster__dot" aria-hidden="true" />
          {label}
          <svg className="status-pill__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {/* durum değişimi (sayaçtan ya da Uzaktayım'dan) duyurulur */}
        <span className="sr-only" role="status">
          {label}
        </span>
        {spotName && (
          <span className="status-menu__spot" title={SPOT_COPY.chosen(spotName)}>
            <span className="room-legend__ring" aria-hidden="true" />
            <span className="sr-only">{SPOT_COPY.chosen(spotName)}</span>
            <span aria-hidden="true">{spotName}</span>
          </span>
        )}
      </div>
      <div id={popId} className="status-menu__pop" role="group" aria-label={STATUS_COPY.label} hidden={!open}>
        <div className="status-menu__away">
          <button type="button" className="status-chip roster__item--away" aria-pressed={away} onClick={onAway}>
            <span className="roster__dot" aria-hidden="true" />
            {STATUS_COPY.away}
          </button>
          <p className="status-menu__note">{away ? STATUS_COPY.awayNote : STATUS_COPY.fromTimer}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function RoomView({ room, avatar, timer, onLeave, focusMode, onFocusModeChange, arriving }) {
  const [spot, setSpot] = useState(null)
  const [spots, setSpots] = useState([])
  const [names, setNames] = useState(false)
  const [picked, setPicked] = useState(null)
  // Geniş ekranda (≥1024 px) liste açık başlar: odada kimlerin olduğu ilk bakışta görünür; daha dar
  // ekranda kapalı (oda odağı korur). Her açılışta "Şu an" görünümüyle gelir.
  const [peopleOpen, setPeopleOpen] = useState(() => window.matchMedia?.('(min-width: 1024px)').matches ?? false)
  // Yardım satırları (Atla, odak modu, sahne ipucu) yalnızca ilk ziyarette görünür.
  const hints = useFirstVisit('room')
  // 'here' (şu an buradakiler, varsayılan) | 'today' (bugünkü odak süresi, isteğe bağlı)
  const [peopleView, setPeopleView] = useState('here')
  // null | 'ok' | 'failed'
  const [copy, setCopy] = useState(null)
  const codeRef = useRef(null)
  const copyTimer = useRef(0)
  const now = useClock(30000)
  // Odaya girişteki sayaç özeti: çıkarken bu oturumun fişi (blok, odak dakikası, odada kalınan süre)
  // bununla farkı alınarak çıkarılır.
  const [entry] = useState(() => ({ blocks: timer.stats.pomodoros, minutes: timer.stats.minutes, at: Date.now() }))
  const leave = () => {
    const e = entry
    onLeave({
      blocks: Math.max(0, timer.stats.pomodoros - e.blocks),
      minutes: Math.max(0, timer.stats.minutes - e.minutes),
      stay: Math.max(0, Math.round((Date.now() - e.at) / 60000)),
    })
  }
  const { Room } = THEMES[room.theme]
  const [away, setAway] = useState(false)
  const { occupants, setMyStatus, myStatus } = useRoomPeople({
    capacity: room.capacity,
    seed: seedOf(room.id),
    me: avatar,
    cheer: timer.completed,
  })

  // Durum sayacın aşamasından türer: molada mola yerine (seçildiyse oraya) yürür, aksi hâlde masada.
  // Uzakta elle seçilir ve sayaçtan önce gelir.
  const derived = away ? 'away' : timer.phase === 'break' ? 'break' : 'focus'
  useEffect(() => {
    setMyStatus(derived, derived === 'break' ? (spot?.id ?? null) : null)
  }, [derived, spot, setMyStatus])

  // Varsayılan liste: şu an buradakiler, odadaki sırayla (sen en üstte). Kimse puanlanmaz; ürün
  // gözetim değil, varlık. Bugünkü odak süresi isteğe bağlı ikinci görünüm: oda arkadaşlarınınki
  // simülasyon (oda ve kişiye göre sabit), seninki sayaçtan gelir.
  const people = useMemo(
    () =>
      occupants.map((o) => ({
        id: o.id,
        name: o.me ? 'Sen' : o.name,
        me: !!o.me,
        avatar: o.avatar,
        status: o.status,
        since: o.since,
        minutes: o.me ? timer.stats.minutes : 15 + (seedOf(room.id + o.id) % 210),
      })),
    [occupants, timer.stats.minutes, room.id],
  )
  const today = useMemo(() => [...people].sort((a, b) => b.minutes - a.minutes), [people])

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

  // Mola yeri seçmek molayı başlatmaz: molada o yere yürünür, değilse sıradaki molada.
  const goToSpot = (s) => setSpot(s)
  const pickSpot = (value) => setSpot(value === 'nearest' ? null : (spots.find((x) => x.id === value) ?? null))
  // Seçili yer; seçilmediyse "en yakın boş yer".
  const spotValue = spot?.id ?? 'nearest'
  const spotName = useMemo(() => (spot ? spotOptions(spots).find((o) => o.id === spot.id)?.label : null), [spot, spots])
  const togglePeople = () => {
    if (!peopleOpen) setPeopleView('here')
    setPeopleOpen((v) => !v)
  }

  const timerCard = <TimerCard timer={timer} title="Odak sayacı" compact={focusMode} hints={hints} />

  // Panel tek sütunda, 1440×900'de kaydırmadan sığar. Üstte tek bir masa: oda adı ince ceviz levhada,
  // altında oda bilgisi, durum çipi (Uzaktayım ve mola yeri çipin kutusunda), sayaç ve tam genişlik
  // Başlat, en altta odak modu ve Odadan çık. Masanın altında şu an buradakiler (geniş ekranda açık,
  // panelde kalan yükseklikte kendi içinde kayar).
  const panel = (
    <>
      <div className="stage-card desk">
        <div className="desk__sign material-sign">
          <RoomTitle name={room.name} />
        </div>
        <div className="desk__info">
          <p className="site-muted">
            <Dotted parts={[<ThemeLabel key="t" theme={room.theme} />, `${room.capacity} kişilik`, accessLabel(room.access)]} keep />
          </p>
          {room.code && (
            <p className="invite-code">
              Davet kodu{' '}
              <code ref={codeRef} key={copy === 'ok' ? 'copied' : 'code'} data-copied={copy === 'ok' ? '' : undefined}>
                {room.code}
              </code>
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
        <StatusMenu status={myStatus} away={away} onAway={() => setAway((v) => !v)} spotName={spotName}>
          <SpotPicker spots={spots} value={spotValue} onPick={pickSpot} note={myStatus !== 'break' && spot ? STATUS_COPY.nextBreak : null} />
        </StatusMenu>
        {timerCard}
        <div className="desk__foot">
          <div className="stage-card__actions">
            <FocusModeButton onClick={() => onFocusModeChange(true)} hints={hints} />
            <button type="button" className="site-btn" onClick={leave}>
              {LEAVE}
            </button>
          </div>
          <FocusModeNote hints={hints} />
        </div>
      </div>

      <div className="stage-card fold people">
        <button type="button" className="fold__toggle" aria-expanded={peopleOpen} aria-controls="peopleList" onClick={togglePeople}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Şu an buradakiler
            <span className="fold__count">{occupants.length}</span>
          </span>
          <svg className="fold__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div id="peopleList" className="fold__body" hidden={!peopleOpen}>
          <div className="people__views segmented" role="group" aria-label="Liste">
            <button type="button" aria-pressed={peopleView === 'here'} onClick={() => setPeopleView('here')}>
              Şu an
            </button>
            <button type="button" aria-pressed={peopleView === 'today'} onClick={() => setPeopleView('today')}>
              Bugünkü odak
            </button>
          </div>
          {peopleView === 'here' ? (
            <ul className="people__list" aria-label="Şu an buradakiler">
              {people.map((p) => (
                <li
                  key={p.id}
                  className={`people__row roster__item--${p.status}${p.me ? ' people__row--me' : ''}`}
                  onPointerEnter={() => setPicked(p.id)}
                  onPointerLeave={() => setPicked(null)}
                >
                  <AvatarChip avatar={p.avatar} />
                  <span className="people__name">{p.name}</span>
                  <StatusText person={p} now={now} />
                </li>
              ))}
            </ul>
          ) : (
            <ol className="people__list" aria-label="Bugünkü odak süresi">
              {today.map((p, i) => (
                <li
                  key={p.id}
                  className={`people__row roster__item--${p.status}${p.me ? ' people__row--me' : ''}`}
                  onPointerEnter={() => setPicked(p.id)}
                  onPointerLeave={() => setPicked(null)}
                >
                  <span className="people__no">{i + 1}</span>
                  <AvatarChip avatar={p.avatar} />
                  <span className="people__name">{p.name}</span>
                  <span className="people__min">{formatMinutes(p.minutes)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  )

  return (
    <RoomStage
      focusMode={focusMode}
      onFocusModeChange={onFocusModeChange}
      timer={timer}
      arrival={arriving ? { lead: ROOM_MOTION_COPY.arriveLead, name: room.name } : null}
      renderRoom={(canvasStyle) => (
        <Room
          capacity={room.capacity}
          canvasStyle={canvasStyle}
          arrive={arriving}
          lampBoost={timer.running && timer.phase === 'focus'}
          hint={hints ? SCENE_HINT : false}
          controls={
            <button type="button" aria-pressed={names} onClick={() => setNames((v) => !v)}>
              İsimler
            </button>
          }
          onSpotClick={goToSpot}
        >
          <SpotsReporter onSpots={setSpots} />
          <AvatarCrowd occupants={occupants} theme={room.theme} showNames={names} highlight={picked} />
        </Room>
      )}
      panel={panel}
      focusPanel={<div className="stage-card">{timerCard}</div>}
    />
  )
}
