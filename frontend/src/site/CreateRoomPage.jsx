import { useState } from 'react'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import { ACCESS_LABELS } from './access'
import Icon from './AvatarIcons'
import { normalizeCode } from './roomStore'

const DEFAULT_THEME = 'library'
const DEFAULT_CAPACITY = 4
const FORM_ID = 'create-room-form'
// Oda kartı görselleri: scripts/render-room-thumbs.mjs ile 3D sahneden bir kez üretilir.
const thumbOf = (theme) => `${import.meta.env.BASE_URL}room-thumbs/${theme}.webp`

// Gizli odaların davet kodu: tema adından kısa önek + 4 rakam (ORMAN-4821 gibi).
function inviteCode(name) {
  const prefix =
    normalizeCode(name)
      .replace(/[^A-Z]/g, '')
      .slice(0, 5) || 'ODA'
  return `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

// Kapasite adım seçici: − / + ve kişi ikonları (dolu: oda kapasitesi, soluk: temanın üst sınırına kadar).
function CapacityStepper({ value, max, onChange }) {
  return (
    <div className="stepper" role="group" aria-labelledby="capacity-label">
      <button type="button" className="stepper__btn" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Bir kişi azalt">
        <span aria-hidden="true">−</span>
      </button>
      <div className="stepper__value">
        <output className="stepper__count" aria-live="polite">
          {value} <span>kişilik</span>
        </output>
        <span className="stepper__people" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={i < value ? 'stepper__person stepper__person--on' : 'stepper__person'}>
              <Icon name="body" size={15} />
            </span>
          ))}
        </span>
      </div>
      <button type="button" className="stepper__btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Bir kişi artır">
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}

// Oda oluşturma: seçilen odanın canlı 3D sahnesi sayfanın kahramanı; oda adı sahnenin üstüne asılı kapı
// tabelasına yazılır. Tema kartları sahnenin altında, kapasite / erişim / oluştur düğmesi sağdaki yapışkan
// rafta. Telefonda sırayla sahne, temalar, ayarlar; düğme ekranın altına yapışık.
// Lobi'nin alt sayfası; var olan odalara katılmak Lobi'de.
export default function CreateRoomPage({ onCreate, onBack }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [access, setAccess] = useState('public')
  const [spot, setSpot] = useState(null)
  const { label, Room, max } = THEMES[theme]
  const roomName = name.trim() || `${label} odası`

  const submit = (e) => {
    e.preventDefault()
    onCreate({ id: `room-${Date.now()}`, name: roomName, theme, capacity, access, code: access === 'invite' ? inviteCode(roomName) : undefined })
  }
  const changeCapacity = (n) => {
    setCapacity(Math.max(1, Math.min(max, n)))
    setSpot(null)
  }

  return (
    <div className="create-room-page">
      <div className="page-head">
        <button type="button" className="link-btn back-link" onClick={onBack}>
          ← Lobiye dön
        </button>
        <h1>Oda oluştur</h1>
      </div>
      <form id={FORM_ID} className="create-room" onSubmit={submit}>
        <section className="create-room__hero" aria-label="Oda önizlemesi">
          {/* oda adı: sahnenin üstüne asılı kapı tabelası */}
          <label className="field door-sign create-room__sign">
            <span className="door-sign__tag">Oda adı</span>
            <span className="door-sign__plate">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} odası`} maxLength={60} />
            </span>
          </label>
          <div className="room-frame create-room__stage">
            {/* tema ya da kapasite değişince yeni sahne yumuşakça belirir */}
            <div key={`${theme}-${capacity}`} className="create-preview__scene">
              <Room capacity={capacity} onSpotClick={setSpot} toolbar="compact" />
            </div>
          </div>
        </section>

        <fieldset className="field create-room__themes">
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
                <span className="theme-option__shot">
                  <img src={thumbOf(key)} alt="" width="480" height="360" loading="lazy" decoding="async" />
                  <span className="theme-option__check" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                </span>
                <span className="theme-option__name">{t.label}</span>
                <span className="theme-option__desc">{t.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* masaüstünde yapışkan raf; telefonda display: contents ile ayarlar akışta, eylem alta yapışır */}
        <div className="create-room__rail">
          <div className="create-room__fields">
            <fieldset className="field">
              <legend className="field__label" id="capacity-label">
                Kapasite
              </legend>
              <CapacityStepper value={capacity} max={max} onChange={changeCapacity} />
            </fieldset>

            <fieldset className="field create-room__last">
              <legend className="field__label">Kimler girebilir</legend>
              <div className="choice-row">
                {Object.entries(ACCESS_LABELS).map(([key, text]) => (
                  <button key={key} type="button" aria-pressed={access === key} onClick={() => setAccess(key)}>
                    {text}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="create-room__cta">
            <p className="create-room__summary">
              {label} · {capacity} kişilik · {ACCESS_LABELS[access]}
              {spot && <> · Seçilen nokta: {spot.label}</>}
            </p>
            <button type="submit" className="site-btn site-btn--primary site-btn--wide">
              Odayı oluştur ve gir
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
