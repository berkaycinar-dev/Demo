import { useState } from 'react'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import { swatchOf } from './themeLook'

const DEFAULT_THEME = 'library'
const DEFAULT_CAPACITY = 4

// Gizli odaların davet kodu: tema adından kısa önek + 4 rakam (ORMAN-4821 gibi).
function inviteCode(name) {
  const prefix =
    name
      .toLocaleUpperCase('tr')
      .replace(/[^A-ZÇĞİÖŞÜ]/g, '')
      .slice(0, 5) || 'ODA'
  return `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

// Oda oluşturma: ad, tema, kapasite ve erişim seçilir; sağda seçilen odanın canlı 3D önizlemesi.
// Altında herkese açık aktif odalar ve davetle girilen gizli odalar.
export default function CreateRoomPage({ rooms, onCreate, onEnter }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [access, setAccess] = useState('public')
  const [spot, setSpot] = useState(null)
  const { label, Room, max } = THEMES[theme]
  const capacities = Array.from({ length: max }, (_, i) => i + 1)

  const submit = (e) => {
    e.preventDefault()
    const roomName = name.trim() || `${label} odası`
    onCreate({ id: `room-${Date.now()}`, name: roomName, theme, capacity, access, code: access === 'invite' ? inviteCode(roomName) : undefined })
  }

  return (
    <>
      <div className="page-head">
        <h1>Oda oluştur</h1>
        <p className="site-muted">Odayı kur, temasını seç; ister herkese aç, ister yalnızca davet koduyla girilsin.</p>
      </div>
      <div className="create">
        <form className="site-card create-form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Oda adı</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} odası`} maxLength={60} />
          </label>

          <fieldset className="field">
            <legend className="field__label">Tema</legend>
            <div className="theme-grid">
              {LISTED_THEMES.map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  className="theme-option"
                  aria-pressed={theme === key}
                  onClick={() => {
                    setTheme(key)
                    setCapacity((c) => Math.min(c, t.max))
                    setSpot(null)
                  }}
                >
                  {t.label}
                  <span>{t.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend className="field__label">Kapasite</legend>
            <div className="choice-row">
              {capacities.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={capacity === n}
                  onClick={() => {
                    setCapacity(n)
                    setSpot(null)
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend className="field__label">Kimler girebilir</legend>
            <div className="choice-row">
              {Object.entries(ACCESS_LABELS).map(([key, text]) => (
                <button key={key} type="button" aria-pressed={access === key} onClick={() => setAccess(key)}>
                  {text}
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="site-btn site-btn--primary site-btn--wide">
            Odayı oluştur ve gir
          </button>
        </form>

        <section className="create-preview" aria-label="Önizleme">
          <h2>Önizleme</h2>
          <div className="room-frame create-preview__room">
            <Room capacity={capacity} onSpotClick={setSpot} />
          </div>
          <p className="site-muted">
            {name.trim() || `${label} odası`} · {label} · {capacity} kişilik · {ACCESS_LABELS[access]}
            {spot && <> · Seçilen nokta: {spot.label}</>}
          </p>
        </section>
      </div>

      <RoomLists rooms={rooms} onEnter={onEnter} />
    </>
  )
}

function RoomCard({ room, onEnter }) {
  const { label } = THEMES[room.theme]
  return (
    <li className="room-card">
      <span className="room-card__swatch" style={{ background: swatchOf(room.theme) }} aria-hidden="true" />
      <div className="room-card__body">
        <div className="room-card__top">
          <span className="eyebrow">{label}</span>
          {room.access === 'invite' && (
            <span className="tag tag--lock">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Davetli
            </span>
          )}
        </div>
        <h3>{room.name}</h3>
        <p className="site-muted">
          {room.capacity} kişilik · {ACCESS_LABELS[room.access]}
        </p>
        <button type="button" className="site-btn" onClick={() => onEnter(room)}>
          Gir
        </button>
      </div>
    </li>
  )
}

// Aktif odalar (herkese açık) ve gizli odalar (davetli). Gizli odaya davet koduyla da girilir.
function RoomLists({ rooms, onEnter }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const open = rooms.filter((r) => r.access === 'public')
  const hidden = rooms.filter((r) => r.access === 'invite')

  const join = (e) => {
    e.preventDefault()
    const wanted = code.trim().toLocaleUpperCase('tr')
    const room = rooms.find((r) => r.code && r.code.toLocaleUpperCase('tr') === wanted)
    if (!room) {
      setError('Bu kodla bir oda bulunamadı.')
      return
    }
    setError('')
    onEnter(room)
  }

  return (
    <>
      <section className="room-section" aria-labelledby="aktifBaslik">
        <div className="section-head">
          <span className="eyebrow">Herkese açık</span>
          <h2 id="aktifBaslik">Aktif odalar</h2>
        </div>
        {open.length === 0 ? (
          <p className="site-muted">Şu an açık oda yok. İlkini sen oluştur.</p>
        ) : (
          <ul className="site-rooms">
            {open.map((room) => (
              <RoomCard key={room.id} room={room} onEnter={onEnter} />
            ))}
          </ul>
        )}
      </section>

      <section className="room-section" aria-labelledby="gizliBaslik">
        <div className="section-head section-head--row">
          <div>
            <span className="eyebrow">Yalnızca davetle</span>
            <h2 id="gizliBaslik">Gizli odalar</h2>
          </div>
          <form className="code-form" onSubmit={join}>
            <label className="sr-only" htmlFor="inviteCode">
              Davet kodu
            </label>
            <input
              id="inviteCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Davet kodu (ör. ABCDE-1234)"
              aria-invalid={!!error}
              aria-describedby={error ? 'inviteError' : undefined}
              autoComplete="off"
            />
            <button type="submit" className="site-btn site-btn--primary" disabled={!code.trim()}>
              Katıl
            </button>
            {error && (
              <span id="inviteError" className="form-error code-form__error" role="alert">
                {error}
              </span>
            )}
          </form>
        </div>
        {hidden.length === 0 ? (
          <p className="site-muted">Davetli olduğun gizli oda yok.</p>
        ) : (
          <ul className="site-rooms">
            {hidden.map((room) => (
              <RoomCard key={room.id} room={room} onEnter={onEnter} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
