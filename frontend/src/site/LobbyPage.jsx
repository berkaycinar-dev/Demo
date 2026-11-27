import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../rooms/themes'
import WorkingOnField from './WorkingOnField'
import { activeMembers, codeMatches } from './roomStore'
import useShortcut from './useShortcut'
import { ThemeShot } from './RoomShot'
import Dotted from './Dotted'
import ThemeLabel from './ThemeLabel'
import { revealEl } from './scroll'

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

function sinceText(at) {
  const min = Math.floor((Date.now() - at) / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min} dk önce`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} sa önce`
  return new Date(at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

// Davetli oda için davet kodu penceresi.
function CodeDialog({ room, onClose, onSuccess }) {
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (room && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    }
    if (!room && dialog.open) dialog.close()
  }, [room])

  const close = () => {
    setCode('')
    setError('')
    onClose()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!codeMatches(room, code)) {
      setError(CODE_COPY.wrong)
      inputRef.current?.select()
      return
    }
    const target = room
    close()
    onSuccess(target)
  }

  return (
    <dialog
      ref={ref}
      className="code-dialog"
      aria-labelledby="codeDialogTitle"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      {room && (
        <form className="code-dialog__panel" onSubmit={submit} noValidate>
          <span className="code-dialog__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <h2 id="codeDialogTitle">
            <Dotted text={room.name} />
          </h2>
          <p className="site-muted">Bu oda davetli. Girmek için oda sahibinden aldığın davet kodunu yaz.</p>
          <div className="auth-field">
            <label htmlFor="roomCode">Davet kodu</label>
            <input
              ref={inputRef}
              id="roomCode"
              className="code-dialog__input"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError('')
              }}
              placeholder="Davet kodu"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'roomCode-err' : undefined}
            />
            {error && (
              <span id="roomCode-err" className="form-error" role="alert">
                {error}
              </span>
            )}
          </div>
          <div className="code-dialog__foot">
            <button type="button" className="site-btn" onClick={close}>
              Vazgeç
            </button>
            <button type="submit" className="site-btn site-btn--primary" disabled={!code.trim()}>
              Odaya gir
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

// Davet kodu metinleri: hatalar kodun biçimini de söyler (sunucu 8 karakterlik kod üretir).
const CODE_COPY = {
  format: 'Kod 8 karakterdir (harf ve rakam). Büyük/küçük harf fark etmez.',
  wrong: 'Kod bu odaya ait değil. Kod 8 karakterdir (harf ve rakam).',
}

// Kodla doğrudan katılma: kod hangi davetli odaya aitse ona girer. Oda listede yoksa (başkasının gizli
// odası listede görünmez) kod sunucuya gider; sunucu odayı bulup üye yapar (onEnterByCode).
function CodeJoin({ rooms, onEnter, onEnterByCode }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    const known = rooms.find((r) => codeMatches(r, code))
    if (known) {
      setCode('')
      setError('')
      onEnter(known)
      return
    }
    setBusy(true)
    const problem = await onEnterByCode(code)
    setBusy(false)
    if (problem) {
      setError(problem)
      return
    }
    setCode('')
    setError('')
  }
  return (
    <form className="lobby-code" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor="lobbyCode">
        Davet kodu
      </label>
      <input
        id="lobbyCode"
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError('')
        }}
        placeholder="Davet kodu"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'lobbyCode-err' : undefined}
      />
      <button type="submit" className="site-btn site-btn--primary" disabled={!code.trim() || busy} aria-busy={busy || undefined}>
        {busy ? 'Giriliyor…' : 'Gir'}
      </button>
      {error && (
        <span id="lobbyCode-err" className="form-error lobby-code__error" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}

const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </svg>
)

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
  </svg>
)

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const trLower = (t) => t.toLocaleLowerCase('tr')
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

// Lobi araması
const SEARCH_COPY = {
  placeholder: 'Oda ya da tema ara',
  key: 'Kısayol: /',
  // arama hiçbir odayla eşleşmeyince tek not; davetli odalarda eşleşme varsa yalnızca açık odalar için
  noMatch: (q) => `“${q}” ile eşleşen oda yok.`,
  noOpenMatch: (q) => `“${q}” ile eşleşen açık oda yok.`,
  noHiddenMatch: (q) => `“${q}” ile eşleşen davetli oda yok.`,
  clear: 'Aramayı temizle',
}

// Hızlı katılım ve çıkış fişi metinleri. Sayılar ayrı değişken; çeviride sıra değişebilir.
const QUICK_COPY = {
  idle: 'Hızlı gir',
  going: 'Seni bu odaya götürüyoruz',
  now: 'Hemen gir',
  other: 'Başka oda',
  cancel: 'Vazgeç',
  announce: (name) => `Seni bu odaya götürüyoruz: ${name}. Vazgeçmek için Esc.`,
}
const RECEIPT_COPY = {
  title: 'Odadan çıktın',
  // fişin satırları: etiket ve değer ayrı; değerdeki sayı ayrı değişken
  blocksLabel: 'Blok',
  blocks: (n) => `${n}`,
  minutesLabel: 'Odak',
  minutes: (n) => `${n} dk`,
  stayLabel: 'Odada',
  stay: (n) => (n < 1 ? '1 dk’dan az' : `${n} dk`),
  // hiç blok ya da odak dakikası yoksa sıfırlar yerine tek satır
  quiet: (n) => (n < 1 ? 'Kısa bir uğrayıştı; masan seni bekliyor.' : `Odada ${n} dk kaldın; masan seni bekliyor.`),
  again: 'Tekrar gir',
  close: 'Kapat',
  // çalışılmış oturumun sonunda yarına sessiz bir davet (bildirim, seri yok)
  tomorrow: 'Yarın aynı masa seni bekliyor.',
}
// Hızlı katılımda odaya geçmeden önce oda adının görünür kaldığı süre (Hemen gir ile kısalır).
const QUICK_MS = 1600

// Hızlı katılım: rastgele seçilen oda girmeden önce söylenir; süre dolunca girilir. Başka oda seçilebilir
// ya da vazgeçilebilir (Esc de vazgeçer). Şerit kalan süreyi gösterir; "hareketi azalt"ta şerit durur,
// süre aynı kalır.
function QuickJoin({ rooms, onEnter }) {
  const [room, setRoom] = useState(null)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const schedule = (next) => {
    clearTimeout(timer.current)
    setRoom(next)
    if (next) timer.current = setTimeout(() => onEnter(next), QUICK_MS)
  }
  const pick = () => schedule(pickRandom(rooms.length > 1 && room ? rooms.filter((r) => r.id !== room.id) : rooms))
  const cancel = () => schedule(null)
  const enterNow = () => {
    clearTimeout(timer.current)
    onEnter(room)
  }
  return (
    <div className="quick-join" onKeyDown={(e) => e.key === 'Escape' && room && cancel()}>
      <button type="button" className="site-btn site-btn--primary site-btn--lg" onClick={room ? enterNow : pick} disabled={!rooms.length}>
        <BoltIcon />
        {room ? QUICK_COPY.now : QUICK_COPY.idle}
      </button>
      <span className="sr-only" role="status">
        {room ? QUICK_COPY.announce(room.name) : ''}
      </span>
      <div className="quick-join__status">
        {room && (
          <div key={room.id} className="quick-join__card">
            <span className="quick-join__lead">{QUICK_COPY.going}</span>
            <strong className="quick-join__name">{room.name}</strong>
            <span className="quick-join__meta">
              <Dotted parts={[<ThemeLabel key="t" theme={room.theme} />, `${room.capacity} kişilik`]} keep />
            </span>
            <span className="quick-join__fuse" style={{ '--fuse-ms': `${QUICK_MS}ms` }} aria-hidden="true" />
            <span className="quick-join__actions">
              {rooms.length > 1 && (
                <button type="button" className="link-btn" onClick={pick}>
                  {QUICK_COPY.other}
                </button>
              )}
              <button type="button" className="link-btn" onClick={cancel}>
                {QUICK_COPY.cancel}
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Odadan çıkış fişi: kâğıt bir fiş (tırtıklı alt kenar). Çıkılan odanın adı ve bu oturumda sayılan
// bloklar, odak dakikası, odada kalınan süre; hiçbiri yoksa sıfırlar yerine tek sıcak satır. Odak fişin
// kendisine taşınır (data-autofocus): klavyeyle gelinince halka fişin köşelerine oturur. "Tekrar gir"
// aynı odaya döner.
function LeaveReceipt({ receipt, onEnter, onClose }) {
  const { room, blocks, minutes, stay } = receipt
  const worked = blocks > 0 || minutes > 0
  const lines = [
    [RECEIPT_COPY.blocksLabel, RECEIPT_COPY.blocks(blocks)],
    [RECEIPT_COPY.minutesLabel, RECEIPT_COPY.minutes(minutes)],
    [RECEIPT_COPY.stayLabel, RECEIPT_COPY.stay(stay)],
  ]
  return (
    <section className="leave-receipt" aria-labelledby="fisBaslik" data-autofocus>
      <div className="leave-receipt__text">
        <h2 id="fisBaslik">
          {RECEIPT_COPY.title}
          <span className="leave-receipt__room">{room.name}</span>
        </h2>
        {worked ? (
          <dl className="leave-receipt__lines">
            {lines.map(([label, value]) => (
              <div key={label} className="leave-receipt__line">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {worked ? (
          <p className="leave-receipt__tomorrow">{RECEIPT_COPY.tomorrow}</p>
        ) : (
          <p className="leave-receipt__quiet">{RECEIPT_COPY.quiet(stay)}</p>
        )}
      </div>
      <div className="leave-receipt__actions">
        <button type="button" className="site-btn" onClick={() => onEnter(room)}>
          {RECEIPT_COPY.again}
        </button>
        <button type="button" className="quiet-btn" onClick={onClose}>
          {RECEIPT_COPY.close}
        </button>
      </div>
    </section>
  )
}

const LOBBY_COPY = {
  title: 'Kimin yanına oturacaksın?',
  busy: 'Şu an çalışılan odalar',
  busyHint: 'En kalabalık önce · içeridekileri üyesi olduğun odalarda görürsün',
  quiet: 'Diğer odalar',
  key: 'Anahtarın var mı?',
  recent: 'Son girdiğin odalar',
  working: 'Sen bugün ne üzerinde çalışacaksın?',
  workingHint: 'Odaya girince adının yanında görünür.',
  invite: 'Davetli',
  sitWith: 'Yanlarına otur',
  enter: (name) => `${name} odasına gir`,
  enterShort: 'Odaya gir',
  enterCode: 'Kodla gir',
  codeLabel: (name) => `${name} odasına davet koduyla gir`,
  members: (n, cap) => `${n} üye · ${cap} kişilik`,
  full: 'Dolu',
  empty: 'boş',
  inside: 'Şu an içeride',
  nobody: 'Şu an içeride kimse yok.',
  since: (min) => (min < 1 ? 'az önce geldi' : min < 60 ? `${min} dk’dır burada` : `${Math.floor(min / 60)} sa’tir burada`),
  more: (n) => `+${n} kişi`,
  noRooms: 'Şu an açık oda yok.',
  pager: 'Oda sayfaları',
  prev: 'Önceki',
  next: 'Sonraki',
  pageLabel: (n) => `${n}. sayfa`,
  range: (from, to, total) => `${total} odadan ${from}–${to} arası`,
  create: 'Yeni oda oluştur',
}

const isLocked = (room) => room.access === 'invite' && !room.myRole
const countOf = (room) => (Number.isFinite(room.memberCount) ? room.memberCount : 0)
const PEOPLE_SHOWN = 6
// bir sayfada en fazla bu kadar oda
const PAGE_SIZE = 10
const PEOPLE_REFRESH_MS = 30_000
// avatar kutusunun rengi kullanıcı adından sabit seçilir (aynı kişi her yerde aynı renk)
const AV_COLORS = ['#e8b77a', '#9fc7c0', '#e0a08a', '#c8b6e2', '#b9d08f']
const colorOf = (name) => AV_COLORS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % AV_COLORS.length]
const minutesSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))

// Üyesi olunan odalarda şu an içeride olanlar: { [roomId]: [{ userId, username, startedAt }] }. Sunucu bu
// listeyi yalnızca üyelere verir; diğer odalar için kayıt yoktur. Lobi açıkken düzenli yenilenir.
function useActivePeople(rooms, username) {
  const [people, setPeople] = useState({})
  const ids = rooms
    .filter((r) => r.myRole)
    .map((r) => r.id)
    .join(',')
  useEffect(() => {
    if (!ids) return undefined
    let alive = true
    const load = () =>
      Promise.all(
        ids.split(',').map((id) =>
          activeMembers(id)
            .then((list) => [id, Array.isArray(list) ? list.filter((p) => p.username !== username) : null])
            .catch(() => [id, null]),
        ),
      ).then((pairs) => {
        if (alive) setPeople(Object.fromEntries(pairs.filter(([, list]) => list)))
      })
    load()
    const t = setInterval(load, PEOPLE_REFRESH_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [ids, username])
  return people
}

function Seats({ room }) {
  const n = Math.min(countOf(room), room.capacity)
  return (
    <span className="lobby-room__seats" aria-hidden="true">
      {Array.from({ length: room.capacity }, (_, i) => (
        <span key={i} data-on={i < n || undefined} />
      ))}
    </span>
  )
}

// Odadaki tek kişi: baş harfli renkli kutu, @kullanıcı adı ve ne zamandır içeride olduğu.
function Person({ person }) {
  return (
    <li className="lobby-person">
      <span className="lobby-person__av" style={{ background: colorOf(person.username) }} aria-hidden="true">
        {person.username[0]?.toLocaleUpperCase('tr')}
      </span>
      <span className="lobby-person__text">
        <strong>@{person.username}</strong>
        <span>{LOBBY_COPY.since(minutesSince(person.startedAt))}</span>
      </span>
    </li>
  )
}

// Oda kartı: solda odanın görüntüsü, sağda ad, doluluk ve içeridekiler; tek eylem.
function RoomCard({ room, people, onOpen }) {
  const locked = isLocked(room)
  const full = countOf(room) >= room.capacity
  const inside = people ?? null
  return (
    <article className="lobby-room">
      <div className="lobby-room__shot">
        <ThemeShot theme={room.theme} dark className="lobby-room__img" />
        <span className="lobby-room__theme">
          {room.access === 'invite' && `${LOBBY_COPY.invite} · `}
          <ThemeLabel theme={room.theme} />
        </span>
      </div>
      <div className="lobby-room__body">
        <div className="lobby-room__top">
          <div className="lobby-room__title">
            <h3>
              <Dotted text={room.name} />
            </h3>
            <span className="lobby-room__fill">
              <Seats room={room} />
              {full ? `${LOBBY_COPY.full} · ` : ''}
              {LOBBY_COPY.members(countOf(room), room.capacity)}
            </span>
          </div>
          <button type="button" className="site-btn site-btn--primary" onClick={() => onOpen(room)} aria-label={locked ? LOBBY_COPY.codeLabel(room.name) : LOBBY_COPY.enter(room.name)}>
            {locked && <LockIcon />}
            {locked ? LOBBY_COPY.enterCode : inside?.length ? LOBBY_COPY.sitWith : LOBBY_COPY.enterShort}
          </button>
        </div>
        {/* içeridekiler yalnızca üyesi olunan odalarda gelir (sunucu kuralı); diğerlerinde odanın tanımı */}
        {inside === null ? (
          THEMES[room.theme]?.description && <p className="lobby-room__note">{THEMES[room.theme].description}</p>
        ) : inside.length === 0 ? (
          <p className="lobby-room__note">{LOBBY_COPY.nobody}</p>
        ) : (
          <div className="lobby-room__people">
            <span className="lobby-room__label">{LOBBY_COPY.inside}</span>
            <ul>
              {inside.slice(0, PEOPLE_SHOWN).map((p) => (
                <Person key={p.userId} person={p} />
              ))}
            </ul>
            {inside.length > PEOPLE_SHOWN && <span className="lobby-room__more">{LOBBY_COPY.more(inside.length - PEOPLE_SHOWN)}</span>}
          </div>
        )}
      </div>
    </article>
  )
}

// Sayfa düğmeleri: Önceki, sayfa numaraları, Sonraki; hangi odaların gösterildiği yazılır.
function Pager({ page, count, total, onGo }) {
  const from = page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)
  return (
    <nav className="lobby-pager" aria-label={LOBBY_COPY.pager}>
      <span className="lobby-pager__range">{LOBBY_COPY.range(from, to, total)}</span>
      <div className="lobby-pager__buttons">
        <button type="button" className="site-btn" onClick={() => onGo(page - 1)} disabled={page === 0}>
          {LOBBY_COPY.prev}
        </button>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className="site-btn lobby-pager__num"
            aria-current={i === page ? 'page' : undefined}
            aria-label={LOBBY_COPY.pageLabel(i + 1)}
            onClick={() => onGo(i)}
          >
            {i + 1}
          </button>
        ))}
        <button type="button" className="site-btn" onClick={() => onGo(page + 1)} disabled={page === count - 1}>
          {LOBBY_COPY.next}
        </button>
      </div>
    </nav>
  )
}

// Lobi ("Kim çalışıyor"): odalar içindeki insanlarla birlikte. Üstte tabela, arama, Hızlı gir ve Oda
// oluştur. Solda üyesi olan odalar kalabalıktan sessize kartlar hâlinde; kartta içeridekiler (yalnızca
// üyesi olunan odalarda, sunucu kuralı) ve tek eylem. Üyesi olmayan odalar ve kilitli davetli odalar altta
// küçük düğmeler. Sağda "ne üzerinde çalışıyorum", davet koduyla giriş ve son girilen odalar.
export default function LobbyPage({ rooms, joined, username, receipt, onCloseReceipt, onEnter, onEnterByCode, onForget, onCreate }) {
  const [asking, setAsking] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const listRef = useRef(null)
  // "/": aramaya atla
  const searchRef = useRef(null)
  useShortcut('/', () => searchRef.current?.focus())
  const people = useActivePeople(rooms, username)
  const open = rooms.filter((r) => r.access === 'public')
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const history = joined.map((j) => ({ ...j, room: byId.get(j.id) })).filter((j) => j.room)

  const q = trLower(query.trim())
  const matches = (r) => !q || trLower(r.name).includes(q) || trLower(THEMES[r.theme]?.label ?? '').includes(q)
  const shown = rooms.filter(matches)
  const searching = Boolean(q)
  // kartlar: kilitli olmayan ve üyesi olan odalar, kalabalıktan sessize; geri kalanlar altta düğme
  const busy = shown.filter((r) => !isLocked(r) && countOf(r) > 0).sort((a, b) => countOf(b) - countOf(a))
  const quiet = [...shown.filter((r) => !isLocked(r) && countOf(r) === 0), ...shown.filter(isLocked)]
  // sayfalama: en fazla PAGE_SIZE oda (kartlar önce, sonra küçük düğmeler); arama değişince ilk sayfa
  const ordered = [...busy, ...quiet]
  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const onPage = new Set(ordered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((r) => r.id))
  const busyHere = busy.filter((r) => onPage.has(r.id))
  const quietHere = quiet.filter((r) => onPage.has(r.id))
  const goPage = (n) => {
    setPage(n)
    requestAnimationFrame(() => revealEl(listRef.current, 'start'))
  }

  const clearSearch = () => {
    setQuery('')
    setPage(0)
    searchRef.current?.focus()
  }
  const openRoom = (room) => (isLocked(room) ? setAsking(room) : onEnter(room))

  return (
    <>
      {receipt && <LeaveReceipt receipt={receipt} onEnter={onEnter} onClose={onCloseReceipt} />}
      <header className="lobby-head">
        <div className="lobby-head__title">
          <div className="lobby-sign material-sign">
            <h1 id="lobiBaslik">{LOBBY_COPY.title}</h1>
          </div>
        </div>
        <div className="lobby-head__actions">
          <div className="lobby-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <label className="sr-only" htmlFor="lobbySearch">
              Oda ara
            </label>
            <input
              ref={searchRef}
              id="lobbySearch"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder={SEARCH_COPY.placeholder}
              aria-keyshortcuts="/"
              title={SEARCH_COPY.key}
            />
          </div>
          <QuickJoin rooms={open} onEnter={onEnter} />
          <button type="button" className="site-btn site-btn--lg" onClick={onCreate}>
            <PlusIcon />
            Oda oluştur
          </button>
        </div>
      </header>

      <div className="lobby-people">
        <section className="lobby-people__main" aria-labelledby="odalarBaslik" ref={listRef}>
          <div className="lobby-people__head">
            <h2 id="odalarBaslik">{LOBBY_COPY.busy}</h2>
            {busy.length > 0 && <span>{LOBBY_COPY.busyHint}</span>}
          </div>

          {shown.length === 0 ? (
            <div className="empty-note">
              {searching ? (
                <>
                  <p>{SEARCH_COPY.noMatch(query.trim())}</p>
                  <button type="button" className="site-btn" onClick={clearSearch}>
                    {SEARCH_COPY.clear}
                  </button>
                </>
              ) : (
                <>
                  <p>{LOBBY_COPY.noRooms}</p>
                  <button type="button" className="site-btn" onClick={onCreate}>
                    <PlusIcon />
                    {LOBBY_COPY.create}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {busyHere.map((room) => (
                <RoomCard key={room.id} room={room} people={people[room.id]} onOpen={openRoom} />
              ))}
              {quietHere.length > 0 && (
                <div className="lobby-quiet" role="group" aria-labelledby="digerBaslik">
                  <span id="digerBaslik" className="lobby-quiet__label">
                    {LOBBY_COPY.quiet}
                  </span>
                  {quietHere.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      className="site-btn lobby-quiet__room"
                      onClick={() => openRoom(room)}
                      aria-label={isLocked(room) ? LOBBY_COPY.codeLabel(room.name) : LOBBY_COPY.enter(room.name)}
                    >
                      {room.access === 'invite' && <LockIcon />}
                      <Dotted text={room.name} />
                      <span className="lobby-quiet__meta">{isLocked(room) ? LOBBY_COPY.invite : LOBBY_COPY.empty}</span>
                    </button>
                  ))}
                </div>
              )}
              {pageCount > 1 && <Pager page={current} count={pageCount} total={ordered.length} onGo={goPage} />}
            </>
          )}
        </section>

        <aside className="lobby-people__side">
          <section className="lobby-working" aria-labelledby="calisiyorumBaslik">
            <h2 id="calisiyorumBaslik">{LOBBY_COPY.working}</h2>
            <WorkingOnField username={username} className="lobby-working__field" />
            <p>{LOBBY_COPY.workingHint}</p>
          </section>

          <section className="lobby-key material-sign" aria-labelledby="kodBaslik">
            <h2 id="kodBaslik" className="lobby-key__title" title={CODE_COPY.format}>
              <KeyIcon />
              {LOBBY_COPY.key}
            </h2>
            <CodeJoin rooms={rooms} onEnter={onEnter} onEnterByCode={onEnterByCode} />
          </section>

          {history.length > 0 && (
            <section className="lobby-recent" aria-labelledby="katildigimBaslik">
              <h2 id="katildigimBaslik" className="lobby-recent__title">
                {LOBBY_COPY.recent}
              </h2>
              <ul className="lobby-recent__list">
                {history.map(({ room, at }) => (
                  <li key={room.id} className="lobby-recent__item">
                    <button type="button" className="lobby-recent__go" onClick={() => onEnter(room)} aria-label={LOBBY_COPY.enter(room.name)}>
                      {room.access === 'invite' && <LockIcon />}
                      <span className="lobby-recent__name" title={room.name}>
                        <Dotted text={room.name} />
                      </span>
                      <span className="lobby-recent__when">{sinceText(at)}</span>
                    </button>
                    <button type="button" className="lobby-recent__remove" aria-label={`${room.name} odasını listeden kaldır`} title="Listeden kaldır" onClick={() => onForget(room.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <CodeDialog room={asking} onClose={() => setAsking(null)} onSuccess={onEnter} />
    </>
  )
}
