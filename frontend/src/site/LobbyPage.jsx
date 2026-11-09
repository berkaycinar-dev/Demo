import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import { codeMatches } from './roomStore'
import RoomShot from './RoomShot'

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
  const { label } = THEMES[room.theme]
  return (
    <li className="room-card">
      <span className="room-card__shot">
        <RoomShot theme={room.theme} />
      </span>
      <div className="room-card__body">
        <div className="room-card__top">
          <span className="room-card__theme">{label}</span>
          {locked ? (
            <span className="tag tag--lock">
              <LockIcon />
              Gizli
            </span>
          ) : (
            <span className="tag tag--live">
              <i className="live-dot" aria-hidden="true" />
              Aktif
            </span>
          )}
        </div>
        <h3>{room.name}</h3>
        <p className="site-muted">
          {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
        </p>
        <div className="room-card__actions">
          {locked ? (
            <button type="button" className="site-btn" onClick={onAction}>
              <LockIcon />
              Kodla gir
            </button>
          ) : (
            <button type="button" className="site-btn site-btn--primary" onClick={onAction}>
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
      setError('Kod hatalı. Odanın sahibinden aldığın davet kodunu kontrol et.')
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
          <h2 id="codeDialogTitle">{room.name}</h2>
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

// Davet koduyla doğrudan katılma: kod hangi gizli odaya aitse ona girer.
function CodeJoin({ rooms, onEnter }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const room = rooms.find((r) => codeMatches(r, code))
    if (!room) {
      setError('Bu kodla bir oda bulunamadı.')
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
        Katıl
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

// Lobi: odalarla ilgili her şey tek sayfada. Üstte hızlı katılma ve oda oluşturma; ortada
// aranabilir aktif odalar ve altında gizli odalar; yanda davet koduyla katılma ve son katıldıkların.
// Gizli odaya listeden girerken kod sorulur; daha önce katıldığın odaya geçmişten kodsuz girilir.
export default function LobbyPage({ rooms, joined, onEnter, onForget, onCreate }) {
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

  const quickJoin = () => {
    if (open.length) onEnter(pickRandom(open))
  }

  return (
    <>
      <section className="site-card lobby-hero" aria-labelledby="lobiBaslik">
        <div className="lobby-hero__text">
          <h1 id="lobiBaslik">Birlikte çalışacak bir oda seç</h1>
          <p className="site-muted">Açık bir odaya hemen katıl, davet koduyla gizli bir odaya gir ya da kendi odanı kur.</p>
          <div className="lobby-hero__stats">
            <span>
              <i className="live-dot" aria-hidden="true" />
              {open.length} aktif oda
            </span>
            <span>{hidden.length} gizli oda</span>
            {history.length > 0 && <span>{history.length} odaya katıldın</span>}
          </div>
        </div>
        <div className="lobby-hero__actions">
          <button type="button" className="site-btn site-btn--primary site-btn--lg" onClick={quickJoin} disabled={!open.length}>
            <BoltIcon />
            Hızlı odaya katıl
          </button>
          <button type="button" className="site-btn site-btn--lg" onClick={onCreate}>
            <PlusIcon />
            Oda oluştur
          </button>
        </div>
      </section>

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
            <div className="lobby-empty">
              <p className="site-muted">{open.length ? `“${query.trim()}” ile eşleşen açık oda yok.` : 'Şu an açık oda yok.'}</p>
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
            <h2 id="kodBaslik">Davet koduyla katıl</h2>
            <p className="site-muted">Gizli bir odanın kodunu aldıysan buraya yaz.</p>
            <CodeJoin rooms={rooms} onEnter={onEnter} />
          </section>

          <section className="site-card lobby-panel" aria-labelledby="katildigimBaslik">
            <h2 id="katildigimBaslik">Son katıldıkların</h2>
            {history.length === 0 ? (
              <p className="site-muted">Katıldığın odalar burada listelenir; tekrar girmek tek tık.</p>
            ) : (
              <ul className="lobby-list">
                {history.map(({ room, at }) => (
                  <li key={room.id}>
                    <RoomShot theme={room.theme} className="lobby-list__shot" />
                    <span className="lobby-list__text">
                      <strong>
                        {room.name}
                        {room.access === 'invite' && (
                          <span className="lobby-list__lock" title="Gizli oda">
                            <LockIcon />
                          </span>
                        )}
                      </strong>
                      <span className="site-muted">{sinceText(at)}</span>
                    </span>
                    <button type="button" className="site-btn site-btn--small site-btn--primary" onClick={() => onEnter(room)}>
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
