import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../rooms/themes'
import { accessLabel } from './access'
import { codeMatches } from './roomStore'
import RoomShot from './RoomShot'
import RoomMates from './RoomMates'
import Dotted from './Dotted'
import ThemeLabel from './ThemeLabel'

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

// Oda kartı: temanın oda görseli, ad, kapasite ve giriş düğmesi. Gizli odada "Gizli" etiketi ve kilitli
// "Kodla gir" düğmesi; tıklayınca kod sorulur.
function RoomCard({ room, onAction }) {
  const locked = room.access === 'invite'
  return (
    <li className="room-card">
      <span className="room-card__shot">
        <RoomShot theme={room.theme} />
      </span>
      <div className="room-card__body">
        <div className="room-card__top">
          <ThemeLabel theme={room.theme} className="room-card__theme" />
          {/* açık oda rozet taşımaz (bölüm başlığı zaten "Aktif odalar"); yalnızca gizli oda işaretlenir */}
          {locked && (
            <span className="tag tag--lock">
              <LockIcon />
              Gizli
            </span>
          )}
        </div>
        <h3>
          <Dotted text={room.name} />
        </h3>
        <p className="site-muted">
          <Dotted parts={[`${room.capacity} kişilik`, accessLabel(room.access)]} keep />
        </p>
        <RoomMates room={room} />
        <div className="room-card__actions">
          {locked ? (
            <button type="button" className="site-btn" onClick={onAction}>
              <LockIcon />
              Kodla gir
            </button>
          ) : (
            <button type="button" className="site-btn" onClick={onAction}>
              Gir
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

// Gizli oda için davet kodu penceresi.
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
          <p className="site-muted">Bu oda gizli. Girmek için oda sahibinden aldığın davet kodunu yaz.</p>
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
              placeholder="ör. ABCDE-1234"
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

// Davet koduyla doğrudan katılma: kod hangi gizli odaya aitse ona girer.
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
        placeholder="Davet kodu (ör. ABCDE-1234)"
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

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const trLower = (t) => t.toLocaleLowerCase('tr')
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

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
  session: 'Bu oturum',
  blocks: (n) => `${n} blok`,
  minutes: (n) => `${n} dk odak`,
  stay: (n) => (n < 1 ? 'Odada 1 dakikadan az kaldın.' : `Odada ${n} dk kaldın.`),
  again: 'Tekrar gir',
  close: 'Kapat',
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

// Odadan çıkış fişi: çıkılan odanın adı ve bu oturumda sayılan bloklar, odak dakikası, odada kalınan
// süre. Odak buraya taşınır (data-autofocus); "Tekrar gir" aynı odaya döner.
function LeaveReceipt({ receipt, onEnter, onClose }) {
  const { room, blocks, minutes, stay } = receipt
  return (
    <section className="leave-receipt" aria-labelledby="fisBaslik">
      <div className="leave-receipt__text">
        <h2 id="fisBaslik" data-autofocus>
          {RECEIPT_COPY.title}
          <span className="leave-receipt__room">{room.name}</span>
        </h2>
        <p>
          <span className="leave-receipt__label">{RECEIPT_COPY.session}:</span>{' '}
          <Dotted parts={[RECEIPT_COPY.blocks(blocks), RECEIPT_COPY.minutes(minutes)]} keep />
        </p>
        <p className="site-muted">{RECEIPT_COPY.stay(stay)}</p>
      </div>
      <div className="leave-receipt__actions">
        <button type="button" className="site-btn" onClick={() => onEnter(room)}>
          {RECEIPT_COPY.again}
        </button>
        <button type="button" className="link-btn" onClick={onClose}>
          {RECEIPT_COPY.close}
        </button>
      </div>
    </section>
  )
}

// Lobi: odalarla ilgili her şey tek sayfada. Üstte hızlı katılma ve oda oluşturma; ortada
// aranabilir aktif odalar ve altında gizli odalar; yanda davet koduyla katılma ve son katıldıkların.
// Gizli odaya listeden girerken kod sorulur; daha önce katıldığın odaya geçmişten kodsuz girilir.
export default function LobbyPage({ rooms, joined, receipt, onCloseReceipt, onEnter, onForget, onCreate }) {
  const [asking, setAsking] = useState(null)
  const [query, setQuery] = useState('')
  const open = rooms.filter((r) => r.access === 'public')
  const hidden = rooms.filter((r) => r.access === 'invite')
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const history = joined.map((j) => ({ ...j, room: byId.get(j.id) })).filter((j) => j.room)

  const q = trLower(query.trim())
  const matches = (r) => !q || trLower(r.name).includes(q) || trLower(THEMES[r.theme].label).includes(q)
  const shown = open.filter(matches)
  const shownHidden = hidden.filter(matches)

  return (
    <>
      {receipt && <LeaveReceipt receipt={receipt} onEnter={onEnter} onClose={onCloseReceipt} />}
      {/* sayfanın başı yalnızca başlık ve iki eylem: kart, zemin süsü ve sayı hapları yok; odalar sayfanın kendisi */}
      <header className="lobby-head">
        <h1 id="lobiBaslik">Birlikte çalışacak bir oda seç</h1>
        <div className="lobby-head__actions">
          <QuickJoin rooms={open} onEnter={onEnter} />
          <button type="button" className="site-btn site-btn--lg" onClick={onCreate}>
            <PlusIcon />
            Oda oluştur
          </button>
        </div>
      </header>

      <div className="lobby">
        <section className="lobby__main" aria-labelledby="aktifBaslik">
          <div className="section-head section-head--row">
            <div>
              <h2 id="aktifBaslik">Aktif odalar</h2>
            </div>
            <div className="lobby-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <label className="sr-only" htmlFor="lobbySearch">
                Oda ara
              </label>
              <input id="lobbySearch" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Oda ya da tema ara" />
            </div>
          </div>
          {shown.length === 0 ? (
            <div className="empty-note">
              <p>{open.length ? `“${query.trim()}” ile eşleşen açık oda yok.` : 'Şu an açık oda yok.'}</p>
              <button type="button" className="site-btn" onClick={onCreate}>
                <PlusIcon />
                Yeni oda oluştur
              </button>
            </div>
          ) : (
            <ul className="site-rooms">
              {shown.map((room) => (
                <RoomCard key={room.id} room={room} onAction={() => onEnter(room)} />
              ))}
            </ul>
          )}

          <div className="section-head lobby__hidden-head">
            <h2 id="gizliBaslik">Gizli odalar</h2>
          </div>
          {shownHidden.length === 0 ? (
            <p className="site-muted">{hidden.length ? `“${query.trim()}” ile eşleşen gizli oda yok.` : 'Şu an gizli oda yok.'}</p>
          ) : (
            <ul className="site-rooms" aria-labelledby="gizliBaslik">
              {shownHidden.map((room) => (
                <RoomCard key={room.id} room={room} onAction={() => setAsking(room)} />
              ))}
            </ul>
          )}
        </section>

        <aside className="lobby__side" aria-label="Davet kodu ve geçmiş">
          <section className="site-card lobby-panel" aria-labelledby="kodBaslik">
            <h2 id="kodBaslik">Davet koduyla gir</h2>
            <p className="site-muted">Gizli bir odanın kodunu aldıysan buraya yaz. {CODE_COPY.format}</p>
            <CodeJoin rooms={rooms} onEnter={onEnter} />
          </section>

          <section className="site-card lobby-panel" aria-labelledby="katildigimBaslik">
            <h2 id="katildigimBaslik">Son girdiğin odalar</h2>
            {history.length === 0 ? (
              <div className="empty-note">
                <p>Girdiğin odalar burada listelenir; tekrar girmek tek tık.</p>
              </div>
            ) : (
              <ul className="lobby-list">
                {history.map(({ room, at }) => (
                  <li key={room.id}>
                    <RoomShot theme={room.theme} className="lobby-list__shot" />
                    <span className="lobby-list__text">
                      <strong>
                        <span className="lobby-list__name" title={room.name}>
                          <Dotted text={room.name} />
                        </span>
                        {room.access === 'invite' && (
                          <span className="lobby-list__lock" title="Gizli oda">
                            <LockIcon />
                          </span>
                        )}
                      </strong>
                      <span className="site-muted">{sinceText(at)}</span>
                    </span>
                    <button type="button" className="site-btn site-btn--small" onClick={() => onEnter(room)}>
                      Gir
                    </button>
                    <button
                      type="button"
                      className="lobby-list__remove"
                      aria-label={`${room.name} odasını listeden kaldır`}
                      title="Listeden kaldır"
                      onClick={() => onForget(room.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <CodeDialog room={asking} onClose={() => setAsking(null)} onSuccess={onEnter} />
    </>
  )
}
