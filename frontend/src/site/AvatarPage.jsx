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
  { id: 'body', label: 'Beden', zone: 'full' },
  { id: 'hair', label: 'Saç ve yüz', zone: 'face' },
  { id: 'clothes', label: 'Kıyafet', zone: 'full' },
  { id: 'extras', label: 'Aksesuar', zone: 'upper' },
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

// Seçenek düğmeleri (tek seçim). disabled: o anki seçimde geçersiz; alan soluklaşır, düğmeler
// tıklanmaz ve klavyeyle de seçilmez, not (neden) okunur kalır.
function Choices({ label, options, value, onChange, note, disabled = false }) {
  return (
    <fieldset className={disabled ? 'field field--off' : 'field'} disabled={disabled}>
      <legend className="field__label">
        <span className="field__name">{label}</span> {note && <span className="site-muted">{note}</span>}
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

// Renk kutucukları (tek seçim); seçilen rengin adı başlıkta görünür. color: null olan seçenek "yok".
function Swatches({ label, options, value, onChange, note }) {
  const current = options.find((o) => o.id === value)
  return (
    <fieldset className="field">
      <legend className="field__label">
        {label} <span className="site-muted">{current?.label}</span> {note && <span className="site-muted">{note}</span>}
      </legend>
      <div className="swatch-row">
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
  const earNote = avatar.earrings === 'none' ? null : earsCovered ? '(saç kulakları örtüyor)' : overHead ? '(kulaklık örtüyor)' : null
  const phoneNote = avatar.headphones === 'earbuds' && earsCovered ? '(saç kulakları örtüyor)' : HEADPHONE_HATS.includes(avatar.hat) ? null : '(kafa üstü modeller seçilirse başlık çıkar)'
  const hair = HAIR_COLORS.find((h) => h.id === avatar.hairColor)
  const browNote = avatar.brows === 'auto' ? (hair?.natural ? '(şu an saça uyumlu)' : '(şu an doğal koyu)') : null
  const outfit = avatar.outfit
  const topLabel = outfit === 'dress' ? 'Elbise rengi' : outfit === 'onesie' ? 'Tulum rengi' : 'Üst rengi'
  const bottomLabel = outfit === 'overalls' ? 'Salopet rengi' : 'Alt rengi'
  const replaced = outfit === 'dress' || outfit === 'onesie' ? '(tek parça seçili; seçilirse tek parça çıkar)' : null

  return (
    <>
      <h1>Avatar atölyesi</h1>
      <p className="site-muted">Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.</p>
      <div className="create avatar-page">
        <section className="create-preview" aria-label="Önizleme">
          <div className="room-frame avatar-page__preview">
            <AvatarPreview avatar={avatar} mode={mode} activity={activity} focus={zone} hideHat={hideHat} />
            {tab === 'hair' && hasHat && (
              <button type="button" className="avatar-page__hat" aria-pressed={hideHat} onClick={() => setHatShown(!hatShown)}>
                {hideHat ? 'Başlık gizli · göster' : 'Başlığı gizle'}
              </button>
            )}
            <div className="avatar-page__history" role="group" aria-label="Geçmiş">
              <button type="button" onClick={undo} disabled={!history.past.length} title="Geri al (Ctrl+Z)">
                ↶ Geri al
              </button>
              <button type="button" onClick={redo} disabled={!history.future.length} title="İleri al (Ctrl+Y)">
                İleri al ↷
              </button>
            </div>
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
          <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
        </section>

        <div className="site-card create-form">
          <div className="choice-row avatar-page__tabs" role="tablist" aria-label="Kategori">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} aria-pressed={tab === t.id} onClick={() => openTab(t)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* sekme değişince içerik yeniden kurulur ve yumuşakça gelir (avatar-page__panel) */}
          <div key={tab} className="avatar-page__panel">
          {tab === 'body' && (
            <>
              <label className="field">
                <span className="field__label">Görünen ad</span>
                <input value={avatar.name} maxLength={24} onChange={(e) => commit({ ...avatar, name: e.target.value }, 'name')} />
              </label>
              <Choices label="Beden" options={BODIES} value={avatar.body} onChange={set('body')} />
              <Swatches label="Ten rengi" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
              <Swatches label="Göz rengi" options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
            </>
          )}

          {tab === 'hair' && (
            <>
              <Choices label="Saç" options={HAIR_STYLES} value={avatar.hairStyle} onChange={set('hairStyle')} />
              <Choices
                label="Kahkül"
                disabled={NO_BANGS.includes(avatar.hairStyle)}
                note={NO_BANGS.includes(avatar.hairStyle) ? '(bu saç modelinde yok)' : null}
                options={ON_OFF}
                value={avatar.bangs ? 'on' : 'off'}
                onChange={(v) => set('bangs')(v === 'on')}
              />
              <Swatches label={male ? 'Saç ve sakal rengi' : 'Saç rengi'} options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
              <Swatches label="İkinci renk (parlama ve uçlar)" options={[NO_COLOR, ...HAIR_COLORS]} value={avatar.hairColor2} onChange={set('hairColor2')} />
              <Choices label="Kaş rengi" note={browNote} options={BROW_MODES} value={avatar.brows} onChange={set('brows')} />
              {avatar.brows === 'custom' && <Swatches label="Kaş" options={HAIR_COLORS} value={avatar.browColor} onChange={set('browColor')} />}
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
              <Zone zone="upper" onZone={setZone}>
                <Choices label="Üst" note={replaced} options={TOPS} value={avatar.top} onChange={set('top')} />
                <Swatches label={topLabel} options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
              </Zone>
              <Zone zone="legs" onZone={setZone}>
                <Choices label="Alt" note={outfit === 'none' ? null : '(tek parça seçili; seçilirse tek parça çıkar)'} options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
                <Swatches label={bottomLabel} options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
              </Zone>
              <Zone zone="full" onZone={setZone}>
                <Choices label="Tek parça" note="(elbise ve tulum üst rengini, salopet alt rengini kullanır)" options={OUTFITS} value={outfit} onChange={set('outfit')} />
              </Zone>
              <Zone zone="feet" onZone={setZone}>
                <Choices label="Ayakkabı" options={FOOTWEAR} value={avatar.footwear} onChange={set('footwear')} />
                <Swatches label="Ayakkabı rengi" options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
              </Zone>
            </>
          )}

          {tab === 'extras' && (
            <>
              <Zone zone="hat" onZone={setZone}>
                <HatChoices value={avatar.hat} onChange={set('hat')} />
                {FIXED_COLOR_HATS.includes(avatar.hat) ? null : <Swatches label="Başlık / şapka rengi" options={CLOTH_COLORS} value={avatar.hatColor} onChange={set('hatColor')} />}
              </Zone>
              <Zone zone={avatar.headphones === 'neck' ? 'chest' : 'face'} onZone={setZone}>
                <Choices label="Kulaklık" note={phoneNote} options={HEADPHONES} value={avatar.headphones} onChange={set('headphones')} />
              </Zone>
              <Zone zone="face" onZone={setZone}>
                <Choices label="Gözlük" options={GLASSES} value={avatar.glasses} onChange={set('glasses')} />
              </Zone>
              <Zone zone="chest" onZone={setZone}>
                <Choices label="Boyun" options={NECKWEAR} value={avatar.neck} onChange={set('neck')} />
              </Zone>
              <Zone zone="wrist" onZone={setZone}>
                <Choices label="Bilek" options={WRISTWEAR} value={avatar.wrist} onChange={set('wrist')} />
              </Zone>
              <Zone zone="face" onZone={setZone}>
                <Choices label="Küpe" note={earNote} options={EARRINGS} value={avatar.earrings} onChange={set('earrings')} />
              </Zone>
              <Zone zone="upper" onZone={setZone}>
                <Swatches
                  label="Diğer aksesuar rengi"
                  note="(kulaklık, atkı, papyon, kravat, saat kayışı)"
                  options={CLOTH_COLORS}
                  value={avatar.accessoryColor}
                  onChange={set('accessoryColor')}
                />
                <Swatches label="Metal (taç, küpe, kolye, saat)" options={METALS} value={avatar.metal} onChange={set('metal')} />
              </Zone>
            </>
          )}
          </div>

          <div className="site-actions">
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
