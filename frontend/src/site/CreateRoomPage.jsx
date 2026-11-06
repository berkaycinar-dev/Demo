import { useState } from 'react'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import { swatchOf } from './themeLook'
import { normalizeCode } from './roomStore'

const DEFAULT_THEME = 'library'
const DEFAULT_CAPACITY = 4

// Gizli odaların davet kodu: tema adından kısa önek + 4 rakam (ORMAN-4821 gibi).
function inviteCode(name) {
  const prefix =
    normalizeCode(name)
      .replace(/[^A-Z]/g, '')
      .slice(0, 5) || 'ODA'
  return `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

// Oda oluşturma: ad, tema, kapasite ve erişim seçilir; sağda seçilen odanın canlı 3D önizlemesi.
// Lobi'nin alt sayfası; var olan odalara katılmak Lobi'de.
export default function CreateRoomPage({ onCreate, onBack }) {
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
        <button type="button" className="link-btn back-link" onClick={onBack}>
          ← Lobiye dön
        </button>
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
                  {/* temanın renk şeridi (lobi kartlarıyla aynı) */}
                  <i className="theme-option__swatch" aria-hidden="true" style={{ background: swatchOf(key) }} />
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
            {/* tema ya da kapasite değişince yeni sahne yumuşakça belirir */}
            <div key={`${theme}-${capacity}`} className="create-preview__scene">
              <Room capacity={capacity} onSpotClick={setSpot} />
            </div>
          </div>
          <p className="site-muted">
            {name.trim() || `${label} odası`} · {label} · {capacity} kişilik · {ACCESS_LABELS[access]}
            {spot && <> · Seçilen nokta: {spot.label}</>}
          </p>
        </section>
      </div>
    </>
  )
}
