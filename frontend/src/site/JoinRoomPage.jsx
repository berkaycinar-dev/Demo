import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import { codeMatches } from './roomStore'
import { swatchOf } from './themeLook'

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

// Oda kartı. locked: gizli oda, tıklayınca kod sorulur. note: alt satırda ek bilgi (son katılım).
function RoomCard({ room, locked, note, actionLabel, onAction, onRemove }) {
  const { label } = THEMES[room.theme]
  return (
    <li className="room-card">
      <span className="room-card__swatch" style={{ background: swatchOf(room.theme) }} aria-hidden="true" />
      <div className="room-card__body">
        <div className="room-card__top">
          <span className="eyebrow">{label}</span>
          {room.access === 'invite' && (
            <span className="tag tag--lock">
              <LockIcon />
              Gizli
            </span>
          )}
        </div>
        <h3>{room.name}</h3>
        <p className="site-muted">
          {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
          {note && <> · {note}</>}
        </p>
        <div className="room-card__actions">
          <button type="button" className={`site-btn${locked ? '' : ' site-btn--primary'}`} onClick={onAction}>
            {locked && <LockIcon />}
            {actionLabel}
          </button>
          {onRemove && (
            <button type="button" className="link-btn room-card__remove" onClick={onRemove}>
              Listeden kaldır
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

// Odaya katıl: herkese açık aktif odalar, gizli odalar (kodla) ve daha önce katıldığın odalar.
// Katıldığın bir gizli odaya geçmişten tekrar girerken kod sorulmaz.
export default function JoinRoomPage({ rooms, joined, onEnter, onForget, onCreate }) {
  const [asking, setAsking] = useState(null)
  const open = rooms.filter((r) => r.access === 'public')
  const hidden = rooms.filter((r) => r.access === 'invite')
  const byId = new Map(rooms.map((r) => [r.id, r]))
  const history = joined.map((j) => ({ ...j, room: byId.get(j.id) })).filter((j) => j.room)

  return (
    <>
      <div className="page-head page-head--row">
        <div>
          <h1>Odaya katıl</h1>
          <p className="site-muted">Herkese açık bir odaya hemen gir, gizli odalara davet koduyla katıl.</p>
        </div>
        <button type="button" className="site-btn" onClick={onCreate}>
          Yeni oda oluştur
        </button>
      </div>

      <section className="room-section room-section--first" aria-labelledby="aktifBaslik">
        <div className="section-head">
          <span className="eyebrow">Herkese açık</span>
          <h2 id="aktifBaslik">Aktif odalar</h2>
        </div>
        {open.length === 0 ? (
          <p className="site-muted">Şu an açık oda yok.</p>
        ) : (
          <ul className="site-rooms">
            {open.map((room) => (
              <RoomCard key={room.id} room={room} actionLabel="Gir" onAction={() => onEnter(room)} />
            ))}
          </ul>
        )}
      </section>

      <section className="room-section" aria-labelledby="gizliBaslik">
        <div className="section-head">
          <span className="eyebrow">Yalnızca davetle</span>
          <h2 id="gizliBaslik">Gizli odalar</h2>
        </div>
        {hidden.length === 0 ? (
          <p className="site-muted">Şu an gizli oda yok.</p>
        ) : (
          <ul className="site-rooms">
            {hidden.map((room) => (
              <RoomCard key={room.id} room={room} locked actionLabel="Kodla gir" onAction={() => setAsking(room)} />
            ))}
          </ul>
        )}
      </section>

      <section className="room-section" aria-labelledby="katildigimBaslik">
        <div className="section-head">
          <span className="eyebrow">Geçmiş</span>
          <h2 id="katildigimBaslik">Katıldığım odalar</h2>
        </div>
        {history.length === 0 ? (
          <p className="site-muted">Henüz bir odaya katılmadın. Katıldığın odalar burada listelenir; tekrar girmek tek tık.</p>
        ) : (
          <ul className="site-rooms">
            {history.map(({ room, at }) => (
              <RoomCard
                key={room.id}
                room={room}
                note={`son katılım ${sinceText(at)}`}
                actionLabel="Tekrar gir"
                onAction={() => onEnter(room)}
                onRemove={() => onForget(room.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <CodeDialog room={asking} onClose={() => setAsking(null)} onSuccess={onEnter} />
    </>
  )
}
