import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../rooms/themes'
import { membersLabel } from './access'
import WorkingOnField from './WorkingOnField'
import { codeMatches } from './roomStore'
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
              placeholder="ör. ORMAN-2741"
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

// Davet kodu metinleri: hatalar kodun biçimini de söyler (kelime, tire, dört rakam).
const CODE_COPY = {
  format: 'Kod bir kelime, tire ve dört rakamdır; ör. ORMAN-2741. Büyük/küçük harf fark etmez.',
  wrong: 'Kod bu odaya ait değil. Biçim: kelime, tire, dört rakam (ör. ORMAN-2741).',
  notFound: 'Bu kodla bir oda bulunamadı. Biçim: kelime, tire, dört rakam (ör. ORMAN-2741).',
}

// Kodla doğrudan katılma: kod hangi davetli odaya aitse ona girer.
function CodeJoin({ rooms, onEnter }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const room = rooms.find((r) => codeMatches(r, code))
    if (!room) {
      setError(CODE_COPY.notFound)
      return
    }
    setCode('')
    setError('')
    onEnter(room)
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
        placeholder="Davet kodu (ör. ORMAN-2741)"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'lobbyCode-err' : undefined}
      />
      <button type="submit" className="site-btn site-btn--primary" disabled={!code.trim()}>
        Gir
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

// Katlar: odalar temasının havasına göre katlara ayrılır; davetli odalar en üstte, çatı katında. Listede
// olmayan (yeni ya da gizli) tema zemin kata düşer. Sıra yukarıdan aşağıya, binada olduğu gibi.
const FLOORS = [
  { id: 'kat-cati', no: 'Ç', title: 'Çatı katı', sub: 'Kilitli kapılar', invite: true },
  { id: 'kat-2', no: '2', title: '2. kat', sub: 'Doğa, deniz ve uzay', themes: ['camp', 'teagarden', 'underwater', 'space'] },
  { id: 'kat-1', no: '1', title: '1. kat', sub: 'Şehir ve ekran', themes: ['office', 'cyber', 'bar'] },
  { id: 'kat-z', no: 'Z', title: 'Zemin kat', sub: 'Sessiz ve kitaplı', fallback: true },
]

function floorOf(room) {
  if (room.access === 'invite') return FLOORS[0]
  return FLOORS.find((f) => f.themes?.includes(room.theme)) ?? FLOORS[FLOORS.length - 1]
}

const FLOOR_COPY = {
  eyebrow: (n) => `Lobi · ${n} kat`,
  lift: 'Asansör',
  liftLabel: 'Kata git',
  liftTo: (title) => `${title}: kata git`,
  key: 'Anahtarın var mı?',
  recent: 'Son açtığın kapılar',
  lampHint: 'Lamba yanıyorsa odada üye var',
  invite: 'Davetli',
  enter: 'Gir',
  enterCode: 'Kodla gir',
  enterLabel: (name) => `${name} odasına gir`,
  codeLabel: (name) => `${name} odasına davet koduyla gir`,
}

// Bir kapı: lamba (odada üye varsa yanar), kemerli kapı (ardında oda, akşam ışığında; kilitli odada kilit),
// pirinç isim levhası, tema · kapasite · üye ve Gir. Davetli odaya üye olan kodsuz girer, kapısı açıktır.
function Door({ room, onEnter, onAsk }) {
  const locked = room.access === 'invite' && !room.myRole
  const lit = Number.isFinite(room.memberCount) && room.memberCount > 0
  return (
    <li className="lp-doors__item lobby-door">
      <span className="lp-doors__lamp" data-off={lit ? undefined : ''} aria-hidden="true" />
      <span className={`lp-doors__door${locked ? ' lp-doors__door--locked' : ''}`}>
        {locked ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        ) : (
          <ThemeShot theme={room.theme} dark className="lp-doors__img" />
        )}
      </span>
      <span className="lp-doors__plate" title={room.name}>
        <Dotted text={room.name} />
      </span>
      <span className="lp-doors__desc">
        <Dotted parts={[room.access === 'invite' && FLOOR_COPY.invite, THEMES[room.theme]?.label, `${room.capacity} kişilik`, membersLabel(room)].filter(Boolean)} keep />
      </span>
      <button
        type="button"
        className="site-btn site-btn--small lobby-door__go"
        onClick={() => (locked ? onAsk(room) : onEnter(room))}
        aria-label={locked ? FLOOR_COPY.codeLabel(room.name) : FLOOR_COPY.enterLabel(room.name)}
      >
        {locked && <LockIcon />}
        {locked ? FLOOR_COPY.enterCode : FLOOR_COPY.enter}
      </button>
    </li>
  )
}

// Lobi: bir bina. Üstte tabela, hızlı katılma ve oda oluşturma; altında arama, katlara atlayan asansör ve
// davet koduyla giriş (anahtar); son açılan kapılar. Odalar katlarda: her katın solunda numaralı tabela,
// sağında kapılar. Bina her modda gece (koyu token'lar, material-sign); kapıların ardında akşam ışığı.
// Davetli odaya listeden girerken kod sorulur; daha önce katıldığın odaya geçmişten kodsuz girilir.
export default function LobbyPage({ rooms, joined, username, receipt, onCloseReceipt, onEnter, onForget, onCreate }) {
  const [asking, setAsking] = useState(null)
  const [query, setQuery] = useState('')
  // "/": aramaya atla
  const searchRef = useRef(null)
  useShortcut('/', () => searchRef.current?.focus())
  const open = rooms.filter((r) => r.access === 'public')
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const history = joined.map((j) => ({ ...j, room: byId.get(j.id) })).filter((j) => j.room)

  const q = trLower(query.trim())
  const matches = (r) => !q || trLower(r.name).includes(q) || trLower(THEMES[r.theme]?.label ?? '').includes(q)
  const shown = rooms.filter(matches)
  const searching = Boolean(q)
  const floors = FLOORS.map((f) => ({ ...f, rooms: shown.filter((r) => floorOf(r) === f) }))
  const visibleFloors = floors.filter((f) => f.rooms.length > 0)
  // temizleyince odak aramaya döner: yeni bir şey yazmak bir tuş uzakta
  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }
  const goFloor = (id) => {
    const el = document.getElementById(id)
    revealEl(el, 'start')
    el?.querySelector('h2')?.focus({ preventScroll: true })
  }

  return (
    <>
      {receipt && <LeaveReceipt receipt={receipt} onEnter={onEnter} onClose={onCloseReceipt} />}
      <header className="lobby-head">
        <div className="lobby-head__title">
          <div className="lobby-sign material-sign">
            <span className="lobby-sign__eyebrow">{FLOOR_COPY.eyebrow(FLOORS.length)}</span>
            <h1 id="lobiBaslik">Birlikte çalışacak bir oda seç</h1>
          </div>
          <WorkingOnField username={username} className="lobby-head__working" />
        </div>
        <div className="lobby-head__actions">
          <QuickJoin rooms={open} onEnter={onEnter} />
          <button type="button" className="site-btn site-btn--lg site-btn--primary" onClick={onCreate}>
            <PlusIcon />
            Oda oluştur
          </button>
        </div>
      </header>

      <div className="lobby-tools">
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_COPY.placeholder}
            aria-keyshortcuts="/"
            title={SEARCH_COPY.key}
          />
        </div>
        <nav className="lobby-lift material-sign" aria-label={FLOOR_COPY.liftLabel}>
          <span className="lobby-lift__label" aria-hidden="true">
            {FLOOR_COPY.lift}
          </span>
          {floors.map((f) => (
            <button key={f.id} type="button" className="lobby-lift__btn" disabled={f.rooms.length === 0} onClick={() => goFloor(f.id)} aria-label={FLOOR_COPY.liftTo(f.title)} title={f.title}>
              {f.no}
            </button>
          ))}
        </nav>
        <section className="lobby-key material-sign" aria-labelledby="kodBaslik">
          <h2 id="kodBaslik" className="lobby-key__title" title={CODE_COPY.format}>
            <KeyIcon />
            {FLOOR_COPY.key}
          </h2>
          <CodeJoin rooms={rooms} onEnter={onEnter} />
        </section>
      </div>

      {history.length > 0 && (
        <section className="lobby-recent" aria-labelledby="katildigimBaslik">
          <h2 id="katildigimBaslik" className="lobby-recent__title">
            {FLOOR_COPY.recent}
          </h2>
          <ul className="lobby-recent__list">
            {history.map(({ room, at }) => (
              <li key={room.id} className="lobby-recent__item">
                <button type="button" className="lobby-recent__go" onClick={() => onEnter(room)} aria-label={FLOOR_COPY.enterLabel(room.name)}>
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

      <div className="lobby-building material-sign">
        <p className="lobby-building__hint">{FLOOR_COPY.lampHint}</p>
        {visibleFloors.length === 0 ? (
          <div className="empty-note lobby-building__empty">
            {searching ? (
              <>
                <p>{SEARCH_COPY.noMatch(query.trim())}</p>
                <button type="button" className="site-btn" onClick={clearSearch}>
                  {SEARCH_COPY.clear}
                </button>
              </>
            ) : (
              <>
                <p>Şu an açık oda yok.</p>
                <button type="button" className="site-btn" onClick={onCreate}>
                  <PlusIcon />
                  Yeni oda oluştur
                </button>
              </>
            )}
          </div>
        ) : (
          visibleFloors.map((f) => (
            <section key={f.id} id={f.id} className="lobby-floor" aria-labelledby={`${f.id}-baslik`}>
              <div className="lobby-floor__sign">
                <span className="lobby-floor__no" aria-hidden="true">
                  {f.no}
                </span>
                <h2 id={`${f.id}-baslik`} className="lobby-floor__title" tabIndex={-1}>
                  {f.title}
                </h2>
                <span className="lobby-floor__sub">{f.sub}</span>
              </div>
              <ul className="lp-doors lobby-floor__doors">
                {f.rooms.map((room) => (
                  <Door key={room.id} room={room} onEnter={onEnter} onAsk={setAsking} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <CodeDialog room={asking} onClose={() => setAsking(null)} onSuccess={onEnter} />
    </>
  )
}
