import { useState } from 'react'
import AvatarPreview from '../avatars/AvatarPreview'
import {
  BEARDS,
  BODIES,
  BOTTOMS,
  CLOTH_COLORS,
  DEFAULT_AVATAR,
  EAR_COVERING,
  EARRINGS,
  EYE_COLORS,
  GLASSES,
  HAIR_COLORS,
  HATS,
  HEADPHONE_HATS,
  METALS,
  MUSTACHES,
  NECKWEAR,
  SHOE_COLORS,
  SKIN_TONES,
  TOPS,
  WRISTWEAR,
  hairStylesFor,
  randomAvatar,
  resolveConflicts,
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
const TABS = [
  { id: 'body', label: 'Beden' },
  { id: 'hair', label: 'Saç ve yüz' },
  { id: 'clothes', label: 'Kıyafet' },
  { id: 'extras', label: 'Aksesuar' },
]
const ON_OFF = [
  { id: 'on', label: 'Var' },
  { id: 'off', label: 'Yok' },
]
// Rengi seçilemeyen başlıklar (kendi malzemesi var ya da metal rengini kullanır).
const FIXED_COLOR_HATS = ['none', 'crown', 'viking', 'flowers']
// Beden değişince o bedene uymayan saç modelinin yerine geçen.
const DEFAULT_HAIR = { male: 'short', female: 'ponytail' }

// Seçenek düğmeleri (tek seçim).
function Choices({ label, options, value, onChange, note }) {
  return (
    <fieldset className="field">
      <legend className="field__label">
        {label} {note && <span className="site-muted">{note}</span>}
      </legend>
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

// Başlıklar alt gruplarıyla (Şapka, Fantastik).
function HatChoices({ value, onChange }) {
  const groups = [...new Set(HATS.map((h) => h.group))]
  return (
    <fieldset className="field">
      <legend className="field__label">Başlık</legend>
      {groups.map((g) => (
        <div key={g} className="avatar-page__group">
          <span className="site-muted">{g}</span>
          <div className="choice-row">
            {HATS.filter((h) => h.group === g).map((h) => (
              <button key={h.id} type="button" aria-pressed={value === h.id} onClick={() => onChange(h.id)}>
                {h.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  )
}

// Avatarım: avatar atölyesi. Solda canlı 3D önizleme (poz ve çalışma türü seçilir), sağda
// sekmelere ayrılmış özelleştirme. Her değişiklik hemen kaydedilir; odalarda "Sen" olarak bu avatar
// oturur.
export default function AvatarPage({ avatar, onChange }) {
  const [mode, setMode] = useState('focus')
  const [activity, setActivity] = useState('read')
  const [tab, setTab] = useState('body')
  const set = (key) => (value) => onChange(resolveConflicts({ ...avatar, [key]: value }, key))
  const setBody = (body) => {
    const fits = hairStylesFor(body).some((h) => h.id === avatar.hairStyle)
    onChange(resolveConflicts({ ...avatar, body, hairStyle: fits ? avatar.hairStyle : DEFAULT_HAIR[body] }, 'body'))
  }
  const male = avatar.body !== 'female'
  const earNote = avatar.earrings === 'none' ? null : EAR_COVERING.includes(avatar.hairStyle) ? '(saç kulakları örtüyor)' : avatar.headphones ? '(kulaklık örtüyor)' : null

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
          {(mode === 'focus' || mode === 'away') && (
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
          <div className="choice-row avatar-page__tabs" role="tablist" aria-label="Kategori">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'body' && (
            <>
              <label className="field">
                <span className="field__label">Görünen ad</span>
                <input value={avatar.name} maxLength={24} onChange={(e) => onChange({ ...avatar, name: e.target.value })} />
              </label>
              <Choices label="Beden" options={BODIES} value={avatar.body} onChange={setBody} />
              <Swatches label="Ten rengi" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
              <Swatches label="Göz rengi" options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
            </>
          )}

          {tab === 'hair' && (
            <>
              <Choices label="Saç" options={hairStylesFor(avatar.body)} value={avatar.hairStyle} onChange={set('hairStyle')} />
              <Swatches label={male ? 'Saç ve sakal rengi' : 'Saç rengi'} options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
              {male && (
                <>
                  <Choices label="Sakal" options={BEARDS} value={avatar.beard} onChange={set('beard')} />
                  <Choices label="Bıyık" options={MUSTACHES} value={avatar.mustache} onChange={set('mustache')} />
                </>
              )}
            </>
          )}

          {tab === 'clothes' && (
            <>
              <Choices label="Üst" options={TOPS} value={avatar.top} onChange={set('top')} />
              <Swatches label="Üst rengi" options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
              <Choices label="Alt" options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
              <Swatches label="Alt rengi" options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
              <Swatches label="Ayakkabı" options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
            </>
          )}

          {tab === 'extras' && (
            <>
              <HatChoices value={avatar.hat} onChange={set('hat')} />
              {!FIXED_COLOR_HATS.includes(avatar.hat) && (
                <Swatches label="Başlık rengi" options={CLOTH_COLORS} value={avatar.hatColor} onChange={set('hatColor')} />
              )}
              <Choices
                label="Kulaklık"
                note={HEADPHONE_HATS.includes(avatar.hat) ? null : '(seçilirse başlık çıkar)'}
                options={ON_OFF}
                value={avatar.headphones ? 'on' : 'off'}
                onChange={(v) => set('headphones')(v === 'on')}
              />
              <Choices label="Gözlük" options={GLASSES} value={avatar.glasses} onChange={set('glasses')} />
              <Choices label="Boyun" options={NECKWEAR} value={avatar.neck} onChange={set('neck')} />
              <Choices label="Bilek" options={WRISTWEAR} value={avatar.wrist} onChange={set('wrist')} />
              <Choices label="Küpe" note={earNote} options={EARRINGS} value={avatar.earrings} onChange={set('earrings')} />
              <Swatches label="Aksesuar rengi" options={CLOTH_COLORS} value={avatar.accessoryColor} onChange={set('accessoryColor')} />
              <Swatches label="Metal (taç, küpe, kolye, saat)" options={METALS} value={avatar.metal} onChange={set('metal')} />
            </>
          )}

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
