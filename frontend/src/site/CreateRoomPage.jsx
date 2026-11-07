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

// Oda oluşturma: solda ad (kapı tabelası), tema kartları, kapasite ve erişim; sağda yapışkan canlı 3D
// önizleme, özet ve oluştur düğmesi. Telefonda önizleme üstte, düğme ekranın altına yapışık.
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
    <>
      <div className="page-head">
        <button type="button" className="link-btn back-link" onClick={onBack}>
          ← Lobiye dön
        </button>
        <h1>Oda oluştur</h1>
      </div>
      <div className="create create--room">
        <form id={FORM_ID} className="site-card create-form create-room__form" onSubmit={submit}>
          <label className="field door-sign">
            <span className="field__label">Oda adı</span>
            <span className="door-sign__plate">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${label} odası`} maxLength={60} />
            </span>
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
                  <span className="theme-option__shot">
                    <img src={thumbOf(key)} alt="" width="480" height="360" loading="lazy" decoding="async" />
                  </span>
                  <span className="theme-option__name">{t.label}</span>
                  <span className="theme-option__desc">{t.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

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
        </form>

        {/* masaüstünde yapışkan sütun; telefonda display: contents ile sahne üste, eylem alta yapışır */}
        <aside className="create-room__aside" aria-label="Oda önizlemesi">
          <div className="room-frame create-preview__room create-room__stage">
            {/* tema ya da kapasite değişince yeni sahne yumuşakça belirir */}
            <div key={`${theme}-${capacity}`} className="create-preview__scene">
              <Room capacity={capacity} onSpotClick={setSpot} />
            </div>
          </div>
          <div className="create-room__cta">
            <p className="create-room__summary">
              <strong>{roomName}</strong>
              <span>
                {label} · {capacity} kişilik · {ACCESS_LABELS[access]}
                {spot && <> · Seçilen nokta: {spot.label}</>}
              </span>
            </p>
            <button type="submit" form={FORM_ID} className="site-btn site-btn--primary site-btn--wide">
              Odayı oluştur ve gir
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
