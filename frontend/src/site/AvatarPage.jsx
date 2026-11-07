import { useEffect, useRef, useState } from 'react'
import AvatarPreview from '../avatars/AvatarPreview'
import {
  BEARDS,
  BODIES,
  BOTTOMS,
  BROW_MODES,
  CLOTH_COLORS,
  DEFAULT_AVATAR,
  EAR_COVERING,
  EARRINGS,
  EYE_COLORS,
  FOOTWEAR,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HEADPHONES,
  HEADPHONE_HATS,
  METALS,
  MUSTACHES,
  NECKWEAR,
  NO_BANGS,
  OUTFITS,
  OVER_HEAD,
  SHOE_COLORS,
  SKIN_TONES,
  TOPS,
  WRISTWEAR,
  colorOf,
  randomAvatar,
  resolveConflicts,
  sanitizeAvatar,
} from '../avatars/options'
import Icon from './AvatarIcons'
import { PRESET_SLOTS, loadPresets, savePresets } from './avatarStore'

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
// zone: sekme açılınca kameranın odağı. Sekmenin içinde bir seçeneğe dokunulunca o seçeneğin bölgesine
// geçilir (Zone); açı ve yakınlık seçili poza göre (AvatarPreview VIEWS).
const TABS = [
  { id: 'body', label: 'Beden', zone: 'full', icon: 'body' },
  { id: 'hair', label: 'Saç ve yüz', zone: 'face', icon: 'hair' },
  { id: 'clothes', label: 'Kıyafet', zone: 'full', icon: 'clothes' },
  { id: 'extras', label: 'Aksesuar', zone: 'upper', icon: 'extras' },
]
const ON_OFF = [
  { id: 'on', label: 'Var' },
  { id: 'off', label: 'Yok' },
]
// Rengi seçilemeyen başlıklar (kendi malzemesi var ya da metal rengini kullanır).
const FIXED_COLOR_HATS = ['none', 'crown', 'viking', 'flowers']
const HISTORY_LIMIT = 50
const NO_COLOR = { id: 'none', label: 'Yok', color: null }
// Kombin 1'e, 2'ye, 3'e
const SUFFIX = ["'e", "'ye", "'e"]
const sameLook = (a, b) => JSON.stringify({ ...a, name: '' }) === JSON.stringify({ ...b, name: '' })

// Tek seçimlik düğme. "Yok" seçeneği ikonla ve kesik çerçeveyle ayrılır.
function Option({ o, value, onChange }) {
  const none = o.id === 'none'
  return (
    <button type="button" className={none ? 'tile tile--none' : 'tile'} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
      {none && <Icon name="none" size={14} />}
      {o.label}
    </button>
  )
}

function FieldLabel({ label, current, note }) {
  return (
    <legend className="field__label">
      <span className="field__name">{label}</span>
      {current && <span className="field__value">{current}</span>}
      {note && <span className="field__note">{note}</span>}
    </legend>
  )
}

// Seçenekler (tek seçim). Az ve kısa seçenekler (variant="segment") bitişik bir şeritte, diğerleri
// sıkı bir ızgarada. option.group varsa ızgara alt başlıklara bölünür. disabled: o anki seçimde
// geçersiz; alan soluklaşır, düğmeler tıklanmaz ve klavyeyle de seçilmez, not (neden) okunur kalır.
function Choices({ label, options, value, onChange, note, variant = 'grid', disabled = false }) {
  const groups = options[0]?.group ? [...new Set(options.map((o) => o.group))] : null
  return (
    <fieldset className={disabled ? 'field field--off' : 'field'} disabled={disabled}>
      <FieldLabel label={label} note={note} />
      {variant === 'segment' ? (
        <div className="segmented">
          {options.map((o) => (
            <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : groups ? (
        groups.map((g) => (
          <div key={g} className="option-group">
            <span className="option-group__name">{g}</span>
            <div className="option-grid">
              {options.filter((o) => o.group === g).map((o) => (
                <Option key={o.id} o={o} value={value} onChange={onChange} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="option-grid">
          {options.map((o) => (
            <Option key={o.id} o={o} value={value} onChange={onChange} />
          ))}
        </div>
      )}
    </fieldset>
  )
}

// Renk yuvarlakları (tek seçim); seçilen rengin adı başlıkta görünür. color: null olan seçenek "yok".
// Dengeli ızgara: geniş panelde hepsi tek satırda; dar panelde 8+ renk eşit iki satıra bölünür (tek renk alta düşmez).
function Swatches({ label, options, value, onChange, note }) {
  const current = options.find((o) => o.id === value)
  return (
    <fieldset className="field">
      <FieldLabel label={label} current={current?.label} note={note} />
      <div className="swatch-row" style={{ '--n': options.length, '--half': options.length > 7 ? Math.ceil(options.length / 2) : options.length }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={o.color ? 'swatch' : 'swatch swatch--none'}
            style={o.color ? { background: o.color } : undefined}
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

// Sekme içindeki bölüm: başlık + ilgili alanlar; bölümler ince çizgiyle ayrılır.
function Section({ title, children }) {
  return (
    <section className="opt-section">
      {title && <h2 className="opt-section__title">{title}</h2>}
      {children}
    </section>
  )
}

// Kamera odağı bölgesi: içindeki bir seçeneğe dokunulunca önizleme o bölgeye döner.
function Zone({ zone, onZone, children }) {
  return (
    <div onFocusCapture={() => onZone(zone)} onPointerDownCapture={() => onZone(zone)}>
      {children}
    </div>
  )
}

// Kombin slotları: tıklayınca kayıtlı kombin giyilir; "Kaydet" mevcut görünümü seçili slota yazar.
function Wardrobe({ avatar, onLoad }) {
  const [presets, setPresets] = useState(loadPresets)
  const [slot, setSlot] = useState(0)
  const [saved, setSaved] = useState(null)
  // her kayıtta artar: aynı slota yeniden kaydedince onay metni yine belirir
  const [saves, setSaves] = useState(0)
  const pick = (i) => {
    setSlot(i)
    setSaved(null)
    if (presets[i]) onLoad(sanitizeAvatar({ ...presets[i], name: avatar.name }))
  }
  const save = () => {
    const next = presets.map((p, i) => (i === slot ? { ...avatar } : p))
    setPresets(next)
    savePresets(next)
    setSaved(slot)
    setSaves((n) => n + 1)
  }
  return (
    <section className="wardrobe" aria-label="Kombinler">
      <div className="wardrobe__slots" role="group" aria-label="Kombin slotu">
        {Array.from({ length: PRESET_SLOTS }, (_, i) => {
          const p = presets[i]
          const worn = p && sameLook(p, avatar)
          return (
            <button key={i} type="button" className="wardrobe__slot" aria-pressed={slot === i} onClick={() => pick(i)} title={p ? 'Bu kombini giy' : 'Boş slot'}>
              <span>Kombin {i + 1}</span>
              {p ? (
                <span className="wardrobe__chips" aria-hidden="true">
                  {[colorOf(HAIR_COLORS, p.hairColor), colorOf(CLOTH_COLORS, p.topColor), colorOf(CLOTH_COLORS, p.bottomColor), colorOf(SHOE_COLORS, p.shoes)].map((c, k) => (
                    <i key={k} style={{ background: c }} />
                  ))}
                </span>
              ) : (
                <span className="site-muted">boş</span>
              )}
              {worn && <span className="wardrobe__worn">giyili</span>}
            </button>
          )
        })}
      </div>
      <button type="button" className="site-btn" onClick={save}>
        Kombin {slot + 1}{SUFFIX[slot]} kaydet
      </button>
      {/* canlı bölge sabit kalır; içindeki metin değişince yeniden kurulup belirir */}
      <span className="site-muted wardrobe__status" role="status">
        <span key={`${slot}-${saved}-${saves}`}>{saved === slot ? `Kombin ${slot + 1} kaydedildi.` : presets[slot] ? 'Kaydetmek eskisinin üstüne yazar.' : ''}</span>
      </span>
    </section>
  )
}

// Avatarım: avatar atölyesi. Solda canlı 3D önizleme (poz ve çalışma türü seçilir; kamera seçilen
// bölgeye yaklaşır), geri al / ileri al ve kombin slotları; sağda sekmelere ayrılmış özelleştirme. Her
// değişiklik hemen kaydedilir; odalarda "Sen" olarak bu avatar oturur.
export default function AvatarPage({ avatar, onChange }) {
  const [mode, setMode] = useState('focus')
  const [activity, setActivity] = useState('read')
  const [tab, setTab] = useState('body')
  const [zone, setZone] = useState('full')
  // saç sekmesinde başlık önizlemede gizlenir (saç görünsün); kullanıcı düğmeyle geri açabilir
  const [hatShown, setHatShown] = useState(false)
  // her artışta önizlemenin döndürmesi sıfırlanır (kontrol barındaki Sıfırla)
  const [resetKey, setResetKey] = useState(0)
  // last: son değişen alan; art arda yazılan ad tek adımda geri alınır
  const [history, setHistory] = useState({ past: [], future: [], last: null })

  const commit = (next, key = null) => {
    if (JSON.stringify(next) === JSON.stringify(avatar)) return
    setHistory((h) => ({ past: key === 'name' && h.last === 'name' ? h.past : [...h.past, avatar].slice(-HISTORY_LIMIT), future: [], last: key }))
    onChange(next)
  }
  const undo = () => {
    const prev = history.past.at(-1)
    if (!prev) return
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [avatar, ...h.future], last: null }))
    onChange(prev)
  }
  const redo = () => {
    const next = history.future[0]
    if (!next) return
    setHistory((h) => ({ past: [...h.past, avatar], future: h.future.slice(1), last: null }))
    onChange(next)
  }
  // Ctrl+Z / Ctrl+Y (ve Ctrl+Shift+Z); yazı alanındayken tarayıcının kendi geri alması çalışır
  const keys = useRef(null)
  useEffect(() => {
    keys.current = { undo, redo }
  })
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) keys.current.undo()
      else if (k === 'y' || (k === 'z' && e.shiftKey)) keys.current.redo()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const set = (key) => (value) => commit(resolveConflicts({ ...avatar, [key]: value }, key))
  const openTab = (t) => {
    setTab(t.id)
    setZone(t.zone)
    setHatShown(false)
  }
  const hasHat = avatar.hat !== 'none'
  const hideHat = tab === 'hair' && hasHat && !hatShown
  const male = avatar.body !== 'female'
  const earsCovered = EAR_COVERING.includes(avatar.hairStyle)
  const overHead = OVER_HEAD.includes(avatar.headphones)
  const earNote = avatar.earrings === 'none' ? null : earsCovered ? 'saç kulakları örtüyor' : overHead ? 'kulaklık örtüyor' : null
  const phoneNote = avatar.headphones === 'earbuds' && earsCovered ? 'saç kulakları örtüyor' : HEADPHONE_HATS.includes(avatar.hat) ? null : 'kafa üstü modeller seçilirse başlık çıkar'
  const hair = HAIR_COLORS.find((h) => h.id === avatar.hairColor)
  const browNote = avatar.brows === 'auto' ? (hair?.natural ? 'şu an saça uyumlu' : 'şu an doğal koyu') : null
  const outfit = avatar.outfit
  const topLabel = outfit === 'dress' ? 'Elbise rengi' : outfit === 'onesie' ? 'Tulum rengi' : 'Renk'
  const bottomLabel = outfit === 'overalls' ? 'Salopet rengi' : 'Renk'
  const replacedNote = 'tek parça seçili; seçilirse tek parça çıkar'
  const replaced = outfit === 'dress' || outfit === 'onesie' ? replacedNote : null

  return (
    <>
      <h1>Avatar atölyesi</h1>
      <p className="site-muted">Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.</p>
      <div className="create avatar-page">
        <section className="create-preview" aria-label="Önizleme">
          <div className="room-frame avatar-page__preview">
            <AvatarPreview avatar={avatar} mode={mode} activity={activity} focus={zone} hideHat={hideHat} hint={false} resetKey={resetKey} />
            {/* yüzen kontrol barları: sağ üstte başlık gizle (saç sekmesi) + geri al / ileri al, altta ipuçları */}
            <div className="hud hud--top" role="toolbar" aria-label="Önizleme araçları">
              {tab === 'hair' && hasHat && (
                <>
                  <button
                    type="button"
                    className="hud__icon"
                    aria-pressed={hideHat}
                    aria-label="Başlığı gizle"
                    title={hideHat ? 'Başlık gizli: göster' : 'Saça bakarken başlığı gizle'}
                    onClick={() => setHatShown(!hatShown)}
                  >
                    <Icon name={hideHat ? 'hatOff' : 'hat'} />
                  </button>
                  <span className="hud__divider" aria-hidden="true" />
                </>
              )}
              <button type="button" className="hud__icon" onClick={undo} disabled={!history.past.length} aria-label="Geri al" title="Geri al (Ctrl+Z)">
                <Icon name="undo" />
              </button>
              <button type="button" className="hud__icon" onClick={redo} disabled={!history.future.length} aria-label="İleri al" title="İleri al (Ctrl+Y)">
                <Icon name="redo" />
              </button>
            </div>
            <div className="hud hud--bottom">
              <span className="hud__tip">
                <Icon name="drag" size={16} />
                Sürükle: döndür
              </span>
              <span className="hud__tip">
                <Icon name="tap" size={16} />
                Tıkla: selam
              </span>
              <span className="hud__divider" aria-hidden="true" />
              <button type="button" className="hud__text" onClick={() => setResetKey((k) => k + 1)} title="Görünümü sıfırla (çift tık)">
                <Icon name="reset" size={16} />
                Sıfırla
              </button>
            </div>
          </div>
          <div className="avatar-page__poses">
            <div className="segmented" role="group" aria-label="Poz">
              {MODES.map((m) => (
                <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
            {(mode === 'focus' || mode === 'away') && (
              <div className="segmented avatar-page__sub" role="group" aria-label="Çalışma">
                {ACTIVITIES.map((a) => (
                  <button key={a.id} type="button" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
        </section>

        <div className="site-card create-form avatar-page__editor">
          <div className="avatar-tabs" role="tablist" aria-label="Kategori">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`avatar-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="avatar-panel" onClick={() => openTab(t)}>
                <Icon name={t.icon} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* sekme değişince içerik yeniden kurulur ve yumuşakça gelir (avatar-page__panel) */}
          <div key={tab} id="avatar-panel" role="tabpanel" aria-labelledby={`avatar-tab-${tab}`} className="avatar-page__panel">
          {tab === 'body' && (
            <Section>
              <label className="field">
                <span className="field__label">Görünen ad</span>
                <input value={avatar.name} maxLength={24} onChange={(e) => commit({ ...avatar, name: e.target.value }, 'name')} />
              </label>
              <Choices label="Beden" variant="segment" options={BODIES} value={avatar.body} onChange={set('body')} />
              <Swatches label="Ten rengi" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
              <Swatches label="Göz rengi" options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
            </Section>
          )}

          {tab === 'hair' && (
            <>
              <Section title="Saç">
                <Choices label="Model" options={HAIR_STYLES} value={avatar.hairStyle} onChange={set('hairStyle')} />
                <Choices
                  label="Kahkül"
                  variant="segment"
                  disabled={NO_BANGS.includes(avatar.hairStyle)}
                  note={NO_BANGS.includes(avatar.hairStyle) ? 'bu saç modelinde yok' : null}
                  options={ON_OFF}
                  value={avatar.bangs ? 'on' : 'off'}
                  onChange={(v) => set('bangs')(v === 'on')}
                />
                <Swatches label={male ? 'Saç ve sakal rengi' : 'Renk'} options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
                <Swatches label="İkinci renk" note="parlama ve uçlar" options={[NO_COLOR, ...HAIR_COLORS]} value={avatar.hairColor2} onChange={set('hairColor2')} />
              </Section>
              <Section title="Kaş">
                <Choices label="Renk" variant="segment" note={browNote} options={BROW_MODES} value={avatar.brows} onChange={set('brows')} />
                {avatar.brows === 'custom' && <Swatches label="Kaş rengi" options={HAIR_COLORS} value={avatar.browColor} onChange={set('browColor')} />}
              </Section>
              {male && (
                <Section title="Sakal ve bıyık">
                  <Choices label="Sakal" options={BEARDS} value={avatar.beard} onChange={set('beard')} />
                  <Choices label="Bıyık" options={MUSTACHES} value={avatar.mustache} onChange={set('mustache')} />
                </Section>
              )}
            </>
          )}

          {tab === 'clothes' && (
            <>
              <Zone zone="upper" onZone={setZone}>
                <Section title="Üst">
                  <Choices label="Model" note={replaced} options={TOPS} value={avatar.top} onChange={set('top')} />
                  <Swatches label={topLabel} options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
                </Section>
              </Zone>
              <Zone zone="legs" onZone={setZone}>
                <Section title="Alt">
                  <Choices label="Model" note={outfit === 'none' ? null : replacedNote} options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
                  <Swatches label={bottomLabel} options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
                </Section>
              </Zone>
              <Zone zone="full" onZone={setZone}>
                <Section title="Tek parça">
                  <Choices label="Model" note="elbise ve tulum üst rengini, salopet alt rengini kullanır" options={OUTFITS} value={outfit} onChange={set('outfit')} />
                </Section>
              </Zone>
              <Zone zone="feet" onZone={setZone}>
                <Section title="Ayak">
                  <Choices label="Model" options={FOOTWEAR} value={avatar.footwear} onChange={set('footwear')} />
                  <Swatches label="Renk" options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
                </Section>
              </Zone>
            </>
          )}

          {tab === 'extras' && (
            <>
              <Zone zone="hat" onZone={setZone}>
                <Section title="Baş">
                  <Choices label="Başlık" options={HATS} value={avatar.hat} onChange={set('hat')} />
                  {FIXED_COLOR_HATS.includes(avatar.hat) ? null : <Swatches label="Başlık rengi" options={CLOTH_COLORS} value={avatar.hatColor} onChange={set('hatColor')} />}
                </Section>
              </Zone>
              <Section title="Yüz ve kulak">
                <Zone zone="face" onZone={setZone}>
                  <Choices label="Gözlük" options={GLASSES} value={avatar.glasses} onChange={set('glasses')} />
                </Zone>
                <Zone zone={avatar.headphones === 'neck' ? 'chest' : 'face'} onZone={setZone}>
                  <Choices label="Kulaklık" note={phoneNote} options={HEADPHONES} value={avatar.headphones} onChange={set('headphones')} />
                </Zone>
                <Zone zone="face" onZone={setZone}>
                  <Choices label="Küpe" note={earNote} options={EARRINGS} value={avatar.earrings} onChange={set('earrings')} />
                </Zone>
              </Section>
              <Section title="Boyun ve bilek">
                <Zone zone="chest" onZone={setZone}>
                  <Choices label="Boyun" options={NECKWEAR} value={avatar.neck} onChange={set('neck')} />
                </Zone>
                <Zone zone="wrist" onZone={setZone}>
                  <Choices label="Bilek" options={WRISTWEAR} value={avatar.wrist} onChange={set('wrist')} />
                </Zone>
              </Section>
              <Zone zone="upper" onZone={setZone}>
                <Section title="Renkler">
                  <Swatches
                    label="Diğer aksesuar rengi"
                    note="kulaklık, atkı, papyon, kravat, saat kayışı"
                    options={CLOTH_COLORS}
                    value={avatar.accessoryColor}
                    onChange={set('accessoryColor')}
                  />
                  <Swatches label="Metal" note="taç, küpe, kolye, saat" options={METALS} value={avatar.metal} onChange={set('metal')} />
                </Section>
              </Zone>
            </>
          )}
          </div>

          <div className="site-actions avatar-page__actions">
            <button type="button" className="site-btn" onClick={() => commit(randomAvatar(Math.random, avatar.name))}>
              Rastgele
            </button>
            <button type="button" className="site-btn" onClick={() => commit({ ...DEFAULT_AVATAR, name: avatar.name })}>
              Varsayılana dön
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
