import { useState } from 'react'
import AvatarPreview from '../avatars/AvatarPreview'
import {
  ACCESSORIES,
  BEARDS,
  BOTTOMS,
  CLOTH_COLORS,
  DEFAULT_AVATAR,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SHOE_COLORS,
  SKIN_TONES,
  TOPS,
  randomAvatar,
  withoutConflicts,
} from '../avatars/options'

const MODES = [
  { id: 'focus', label: 'Odakta' },
  { id: 'break', label: 'Molada' },
  { id: 'away', label: 'Uzakta' },
  { id: 'walk', label: 'Yürüyüş' },
]
const ACTIVITIES = [
  { id: 'read', label: 'Kitap' },
  { id: 'type', label: 'Bilgisayar' },
]

// Seçenek düğmeleri (tek seçim).
function Choices({ label, options, value, onChange }) {
  return (
    <fieldset className="field">
      <legend className="field__label">{label}</legend>
      <div className="choice-row">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

// Renk kutucukları (tek seçim); seçilen rengin adı başlıkta görünür.
function Swatches({ label, options, value, onChange }) {
  const current = options.find((o) => o.id === value)
  return (
    <fieldset className="field">
      <legend className="field__label">
        {label} <span className="site-muted">{current?.label}</span>
      </legend>
      <div className="swatch-row">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="swatch"
            style={{ background: o.color }}
            aria-pressed={value === o.id}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

// Avatarım: avatar atölyesi. Solda canlı 3D önizleme (poz ve çalışma türü seçilir), sağda
// özelleştirme. Her değişiklik hemen kaydedilir; odalarda "Sen" olarak bu avatar oturur.
export default function AvatarPage({ avatar, onChange }) {
  const [mode, setMode] = useState('focus')
  const [activity, setActivity] = useState('read')
  const set = (key) => (value) => onChange({ ...avatar, [key]: value })
  const toggle = (id) => {
    const list = avatar.accessories.includes(id) ? avatar.accessories.filter((a) => a !== id) : [...avatar.accessories, id]
    onChange({ ...avatar, accessories: withoutConflicts(list) })
  }

  return (
    <>
      <h1>Avatar atölyesi</h1>
      <p className="site-muted">Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.</p>
      <div className="create">
        <section className="create-preview" aria-label="Önizleme">
          <div className="room-frame avatar-page__preview">
            <AvatarPreview avatar={avatar} mode={mode} activity={activity} />
          </div>
          <div className="choice-row" role="group" aria-label="Poz">
            {MODES.map((m) => (
              <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'focus' && (
            <div className="choice-row avatar-page__sub" role="group" aria-label="Çalışma">
              {ACTIVITIES.map((a) => (
                <button key={a.id} type="button" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="site-card create-form">
          <label className="field">
            <span className="field__label">Görünen ad</span>
            <input value={avatar.name} maxLength={24} onChange={(e) => onChange({ ...avatar, name: e.target.value })} />
          </label>
          <Swatches label="Ten rengi" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
          <Swatches label="Göz rengi" options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
          <Choices label="Saç" options={HAIR_STYLES} value={avatar.hairStyle} onChange={set('hairStyle')} />
          <Swatches label="Saç ve sakal rengi" options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
          <Choices label="Sakal" options={BEARDS} value={avatar.beard} onChange={set('beard')} />
          <Choices label="Üst" options={TOPS} value={avatar.top} onChange={set('top')} />
          <Swatches label="Üst rengi" options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
          <Choices label="Alt" options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
          <Swatches label="Alt rengi" options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
          <Swatches label="Ayakkabı" options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
          <fieldset className="field">
            <legend className="field__label">Aksesuarlar</legend>
            <div className="choice-row">
              {ACCESSORIES.map((a) => (
                <button key={a.id} type="button" aria-pressed={avatar.accessories.includes(a.id)} onClick={() => toggle(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Swatches label="Aksesuar rengi" options={CLOTH_COLORS} value={avatar.accessoryColor} onChange={set('accessoryColor')} />
          <div className="site-actions">
            <button type="button" className="site-btn" onClick={() => onChange(randomAvatar(Math.random, avatar.name))}>
              Rastgele
            </button>
            <button type="button" className="site-btn" onClick={() => onChange({ ...DEFAULT_AVATAR, name: avatar.name })}>
              Varsayılana dön
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
