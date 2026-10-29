import { useState } from 'react'
import { THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'

const DEFAULT_THEME = 'library'
const DEFAULT_CAPACITY = 4

// Oda oluşturma: ad, tema, kapasite ve erişim seçilir; sağda seçilen odanın canlı 3D önizlemesi.
export default function CreateRoomPage({ onCreate }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [access, setAccess] = useState('public')
  const [spot, setSpot] = useState(null)
  const { label, Room, max } = THEMES[theme]
  const capacities = Array.from({ length: max }, (_, i) => i + 1)

  const submit = (e) => {
    e.preventDefault()
    onCreate({ id: `room-${Date.now()}`, name: name.trim() || `${label} odası`, theme, capacity, access })
  }

  return (
    <>
      <h1>Oda oluştur</h1>
      <div className="create">
        <form className="site-card create-form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Oda adı</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} odası`} maxLength={60} />
          </label>

          <fieldset className="field">
            <legend className="field__label">Tema</legend>
            <div className="theme-grid">
              {Object.entries(THEMES).map(([key, t]) => (
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
    </>
  )
}
