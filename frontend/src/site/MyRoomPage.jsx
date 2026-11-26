import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import AvatarCrowd from '../avatars/AvatarCrowd'
import useRoomPeople, { roomSeed as seedOf } from '../avatars/useRoomPeople'
import { useRoom } from '../rooms/core/roomContext'
import { THEMES } from '../rooms/themes'
import { accessLabel } from './access'
import RoomStage, { FocusModeButton, FocusModeNote, ShortcutHelp } from './RoomStage'
import TimerCard from './TimerCard'
import Dotted from './Dotted'
import ThemeLabel from './ThemeLabel'
import AvatarPortrait from './AvatarPortrait'
import useFirstVisit from './useFirstVisit'
import { activeMembers } from './roomStore'
import PersonCard from './PersonCard'
import WorkingOnField from './WorkingOnField'
import useWorkingOn from './workingOn'
import { PLACEHOLDER } from './placeholders'

// Odadaki gerçek kişiler bu aralıkla sunucudan tazelenir.
const MEMBERS_POLL_MS = 10_000

/** Sunucuda şu an bu odada olanlar (kendin hariç): [{ id, name, joinedAt }] ya da yüklenene kadar [].
 * joinedAt: odaya giriş zamanı (ms; sunucunun startedAt değeri), okunamazsa null. */
function useLiveMates(roomId, meId) {
  const [members, setMembers] = useState([])
  useEffect(() => {
    let stopped = false
    const load = () =>
      activeMembers(roomId)
        .then((list) => {
          if (!stopped) setMembers(list)
        })
        .catch(() => {})
    load()
    const id = setInterval(load, MEMBERS_POLL_MS)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [roomId])
  return useMemo(() => members.filter((m) => m.userId !== meId).map((m) => ({ id: m.userId, name: m.username, joinedAt: Date.parse(m.startedAt) || null })), [members, meId])
}

// idle: odadasın ama sayaç çalışmıyor (başlamadı ya da duraklatıldı); avatar masada oturur.
const STATUS_LABELS = { idle: 'Masada', focus: 'Odakta', break: 'Molada', away: 'Uzakta' }

// Durum sayaçtan gelir (sayaç durmuşken: Masada, odak bloku: Odakta, mola: Molada); elle yalnızca
// Uzakta seçilir.
const STATUS_COPY = {
  label: 'Durumun',
  // çipin ekran okuyucu adı: "Durumun: Odakta"
  chip: (status) => `Durumun: ${status}`,
  fromTimer: 'Durumun sayaçla değişir.',
  // sayaç durmuşken (Masada) popover notu
  idleNote: 'Sayaç çalışınca Odakta olursun.',
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
// Kişi listesi yalnızca şu an odada olanları gösterir. Başkalarının bugünkü odak süresi sunucuda yok;
// uydurulmaz (seninki sayaçtaki "Bugün" satırında).
const PEOPLE_COPY = { title: 'Odadakiler', list: 'Şu an buradakiler' }

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
          <p className="site-muted">Herkese açık odalardan birine katıl ya da kodla davetli bir odaya gir.</p>
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
// aside: satırın sağ ucunda duran ek eylem (telefonda Odadan çık)
function StatusMenu({ status, away, onAway, spotName, aside, children }) {
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
        {aside}
      </div>
      <div id={popId} className="status-menu__pop" role="group" aria-label={STATUS_COPY.label} hidden={!open}>
        <div className="status-menu__away">
          <button type="button" className="status-chip roster__item--away" aria-pressed={away} onClick={onAway}>
            <span className="roster__dot" aria-hidden="true" />
            {STATUS_COPY.away}
          </button>
          <p className="status-menu__note">{away ? STATUS_COPY.awayNote : status === 'idle' ? STATUS_COPY.idleNote : STATUS_COPY.fromTimer}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function RoomView({ room, meId, username, avatar, timer, onLeave, focusMode, onFocusModeChange, arriving }) {
  const [spot, setSpot] = useState(null)
  const [spots, setSpots] = useState([])
  const [names, setNames] = useState(false)
  const [picked, setPicked] = useState(null)
  // Geniş ekranda (≥1024 px) liste açık başlar: odada kimlerin olduğu ilk bakışta görünür; daha dar
  // ekranda kapalı (oda odağı korur).
  const [peopleOpen, setPeopleOpen] = useState(() => window.matchMedia?.('(min-width: 1024px)').matches ?? false)
  // Yardım satırları (Atla, odak modu, sahne ipucu) yalnızca ilk ziyarette görünür.
  const hints = useFirstVisit('room')
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
  const mates = useLiveMates(room.id, meId)
  const { occupants, setMyStatus, myStatus } = useRoomPeople({
    capacity: room.capacity,
    seed: seedOf(room.id),
    me: avatar,
    cheer: timer.completed,
    people: mates,
  })

  // Durum sayacın aşamasından türer: molada mola yerine (seçildiyse oraya) yürür, aksi hâlde masada.
  // Uzakta elle seçilir ve sayaçtan önce gelir.
  const derived = away ? 'away' : timer.phase === 'break' ? 'break' : 'focus'
  useEffect(() => {
    setMyStatus(derived, derived === 'break' ? (spot?.id ?? null) : null)
  }, [derived, spot, setMyStatus])
  // Gösterilen durum: sayaç durmuşken odak aşamasında "Masada" (avatarın pozu aynı kalır, masada
  // oturur). Çip, kişi listesi ve odadaki ad etiketi bunu okur.
  const idle = derived === 'focus' && !timer.running
  const shownStatus = idle ? 'idle' : myStatus
  const crowd = useMemo(() => occupants.map((o) => (o.me && idle ? { ...o, shown: 'idle' } : o)), [occupants, idle])

  // Liste: şu an buradakiler, odadaki sırayla (sen en üstte). Kimse puanlanmaz; ürün gözetim değil,
  // varlık.
  const people = useMemo(
    () =>
      occupants.map((o) => ({
        id: o.id,
        name: o.me ? 'Sen' : o.name,
        me: !!o.me,
        avatar: o.avatar,
        // başkalarının durumu sunucuda yok: geçici değer (placeholders.js)
        status: o.me ? (idle ? 'idle' : o.status) : o.real ? PLACEHOLDER.status : o.status,
        since: o.since,
        joinedAt: o.joinedAt ?? null,
      })),
    [occupants, idle],
  )

  // Kişi kartı: listede satırın üstüne gelince / odaklanınca / dokununca, sahnede avatarın üstüne
  // gelince / dokununca açılır. via: 'hover' (fare çıkınca kapanır), 'focus' (odak gidince kapanır),
  // 'tap' (dışarı dokununca ya da Esc ile kapanır). from: 'list' | 'scene'.
  const [card, setCard] = useState(null)
  const cardId = useId()
  // Esc odağı satıra geri verirken kart yeniden açılmasın
  const quietFocus = useRef(false)
  const [myWork] = useWorkingOn(username)
  // kart yalnızca panel görünürken (odak modu değil) ve kişi hâlâ odadayken çizilir; Esc yalnızca o zaman
  // yakalanır
  const cardShown = !!card && !focusMode && people.some((x) => x.id === card.id)
  useEffect(() => {
    if (!cardShown) return undefined
    const onDown = (e) => {
      if (!e.target.closest?.('[data-person-row]')) setCard(null)
    }
    // yakalama evresinde: Esc önce kartı kapatır, odak modundan çıkmaz
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setCard(null)
      if (card.from === 'list' && card.anchor?.isConnected) {
        quietFocus.current = true
        card.anchor.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [card, cardShown])
  const rowCard = (p, via, anchor) => ({ id: p.id, anchor, via, from: 'list', prefer: 'left' })
  const onScenePoint = useCallback((id, anchor, via) => {
    setCard((c) => {
      if (via === 'hover') {
        if (!id) return c?.via === 'hover' && c.from === 'scene' ? null : c
        if (c && c.via !== 'hover') return c
      }
      if (!id || !anchor) return c
      return { id, anchor, via, from: 'scene', prefer: 'top' }
    })
  }, [])
  // Kartın satırları: seninki sayaçtan ve kendi yazdığından; başkalarınınki sunucudan (odada süre) ve
  // sunucuda olmayan alanlar için geçici değerlerden (placeholders.js).
  const cardPerson = (() => {
    const p = cardShown && people.find((x) => x.id === card.id)
    if (!p) return null
    const mins = (from) => (from ? Math.max(0, Math.floor((now - from) / 60000)) : null)
    if (p.me) {
      const focusing = p.status === 'focus' && timer.phase === 'focus' && timer.running
      return { name: p.name, avatar: p.avatar, status: p.status, focusMin: focusing ? Math.floor((timer.total - timer.remaining) / 60) : null, workingOn: myWork || null, inRoomMin: null }
    }
    return {
      name: p.name,
      avatar: p.avatar,
      status: p.status,
      focusMin: p.status === 'focus' ? mins(PLACEHOLDER.focusSince(p)) : null,
      workingOn: PLACEHOLDER.workingOn(p),
      inRoomMin: mins(p.joinedAt),
    }
  })()

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
  const togglePeople = () => setPeopleOpen((v) => !v)

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
        <StatusMenu
          status={shownStatus}
          away={away}
          onAway={() => setAway((v) => !v)}
          spotName={spotName}
          aside={
            <span className="desk__quick">
              <ShortcutHelp />
              <FocusModeButton compact onClick={() => onFocusModeChange(true)} hints={hints} />
              <button type="button" className="site-btn site-btn--small desk__leave" onClick={leave}>
                {LEAVE}
              </button>
            </span>
          }
        >
          <SpotPicker spots={spots} value={spotValue} onPick={pickSpot} note={myStatus !== 'break' && spot ? STATUS_COPY.nextBreak : null} />
        </StatusMenu>
        {/* odak modunun açıklaması: ilk ziyarette görünür, sonra yalnızca ekran okuyucuya */}
        <WorkingOnField username={username} className="desk__working" />
        <FocusModeNote hints={hints} />
        {timerCard}
      </div>

      <div className="stage-card fold people">
        <div className="people__head">
          <button type="button" className="fold__toggle" aria-expanded={peopleOpen} aria-controls="peopleList" onClick={togglePeople}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {PEOPLE_COPY.title}
              <span className="fold__count">{occupants.length}</span>
            </span>
            <svg className="fold__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div id="peopleList" className="fold__body" hidden={!peopleOpen}>
          <ul className="people__list" aria-label={PEOPLE_COPY.list}>
            {people.map((p) => (
              <li key={p.id} className="people__item">
                <button
                  type="button"
                  data-person-row=""
                  className={`people__row roster__item--${p.status}${p.me ? ' people__row--me' : ''}`}
                  aria-describedby={cardPerson && card.id === p.id ? cardId : undefined}
                  onPointerEnter={(e) => {
                    setPicked(p.id)
                    if (e.pointerType === 'mouse') setCard(rowCard(p, 'hover', e.currentTarget))
                  }}
                  onPointerLeave={(e) => {
                    setPicked(null)
                    if (e.pointerType === 'mouse') setCard((c) => (c?.via === 'hover' && c.id === p.id ? null : c))
                  }}
                  onFocus={(e) => {
                    const quiet = quietFocus.current
                    quietFocus.current = false
                    if (!quiet && e.currentTarget.matches(':focus-visible')) setCard(rowCard(p, 'focus', e.currentTarget))
                  }}
                  onBlur={() => setCard((c) => (c?.via === 'focus' && c.id === p.id ? null : c))}
                  onClick={(e) => {
                    const el = e.currentTarget
                    setCard((c) => (c?.id === p.id && c.via === 'tap' ? null : rowCard(p, 'tap', el)))
                  }}
                >
                  <AvatarChip avatar={p.avatar} />
                  <span className="people__name">{p.name}</span>
                  <StatusText person={p} now={now} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {cardPerson && <PersonCard id={cardId} person={cardPerson} anchor={card.anchor} prefer={card.prefer} />}
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
          <AvatarCrowd occupants={crowd} theme={room.theme} showNames={names} highlight={picked} onPersonPoint={onScenePoint} />
        </Room>
      )}
      panel={panel}
      focusPanel={<div className="stage-card">{timerCard}</div>}
    />
  )
}
