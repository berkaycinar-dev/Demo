import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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
  randomAvatar,
  resolveConflicts,
  sanitizeAvatar,
} from '../avatars/options'
import Icon from './AvatarIcons'
import AvatarPortrait from './AvatarPortrait'
import NameHint from './NameHint'
import { nameStatus, textLength } from './nameRules'
import { loadPresets, savePresets } from './avatarStore'
import useImageState from './useImageState'

// icon: AvatarIcons adı; poz ve çalışma türü önizlemenin üstündeki HUD'da ikon + etiketle seçilir
const MODES = [
  { id: 'focus', label: 'Odakta', icon: 'focus' },
  { id: 'break', label: 'Molada', icon: 'break' },
  { id: 'away', label: 'Uzakta', icon: 'away' },
  { id: 'walk', label: 'Yürüyüş', icon: 'walk' },
]
// çalışma türü yalnızca masada oturan pozlarda (Odakta, Uzakta) anlamlı
const SEATED = ['focus', 'away']
const ACTIVITIES = [
  { id: 'read', label: 'Kitap', icon: 'read' },
  { id: 'type', label: 'Bilgisayar', icon: 'type' },
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
// görünen ad sınırı (harf sayısı); sanitizeAvatar da aynı sınırı kullanır
const NAME_MAX = 24
// Zar: önizleme bu aralıklarla (ms, giderek yavaşlar) rastgele görünümlerden geçer; sonuncusu kalır.
const ROLL_STEPS = [55, 60, 70, 85, 105, 135, 170]
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
// Kombin 1'e, 2'ye, 3'e
const SUFFIX = ["'e", "'ye", "'e"]
const sameLook = (a, b) => JSON.stringify({ ...a, name: '' }) === JSON.stringify({ ...b, name: '' })

// Seçenek görselleri: scripts/render-avatar-thumbs.mjs ile avatar modelinden bir kez üretilir
// (public/avatar-thumbs/<tür>-<id>.webp). thumbs: o alanın tür adı (hair, hat, glasses, beard, mustache).
const thumbOf = (kind, id) => `${import.meta.env.BASE_URL}avatar-thumbs/${kind}-${id}.webp`

// Tek seçimlik düğme. "Yok" seçeneği ikonla ve kesik çerçeveyle ayrılır; thumbs verilirse üstte
// seçeneğin voxel görseli durur.
// Seçenek görseli: yüklenirken iskelet, yüklenemezse çizgi ikonlu yer tutucu (kırık resim simgesi yok).
function OptionThumb({ src }) {
  const [state, imgProps] = useImageState()
  return (
    <span className="tile__thumb" data-state={state}>
      {state === 'error' ? <Icon name="image" size={20} /> : <img src={src} alt="" width="56" height="56" loading="lazy" decoding="async" {...imgProps} />}
    </span>
  )
}

function Option({ o, value, onChange, thumbs }) {
  const none = o.id === 'none'
  const cls = ['tile', none && 'tile--none', thumbs && 'tile--thumb'].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
      {thumbs && <OptionThumb src={thumbOf(thumbs, o.id)} />}
      <span className="tile__label">
        {none && <Icon name="none" size={14} />}
        {o.label}
      </span>
    </button>
  )
}

// Alan etiketi. bare: ad yalnızca ekran okuyucuya (bölüm başlığı zaten aynı şeyi söylüyor); not ve
// seçili değer görünür kalır. action: etiket satırının sonunda küçük bir düğme.
function FieldLabel({ label, current, note, bare = false, action }) {
  return (
    <legend className={bare ? 'field__label field__label--bare' : 'field__label'}>
      <span className={bare ? 'field__name visually-hidden' : 'field__name'}>{label}</span>
      {current && <span className="field__value">{current}</span>}
      {note && <span className="field__note">{note}</span>}
      {action}
    </legend>
  )
}

// Seçenekler (tek seçim). Az ve kısa seçenekler (variant="segment") bitişik bir şeritte, diğerleri
// sıkı bir ızgarada. option.group varsa ızgara alt başlıklara bölünür. disabled: o anki seçimde
// geçersiz; alan soluklaşır, düğmeler tıklanmaz ve klavyeyle de seçilmez, not (neden) okunur kalır.
function Choices({ label, options, value, onChange, note, variant = 'grid', disabled = false, bare = false, thumbs }) {
  const groups = options[0]?.group ? [...new Set(options.map((o) => o.group))] : null
  const grid = thumbs ? 'option-grid option-grid--thumbs' : 'option-grid'
  return (
    <fieldset className={disabled ? 'field field--off' : 'field'} disabled={disabled}>
      <FieldLabel label={label} note={note} bare={bare} />
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
            <div className={grid}>
              {options.filter((o) => o.group === g).map((o) => (
                <Option key={o.id} o={o} value={value} onChange={onChange} thumbs={thumbs} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={grid}>
          {options.map((o) => (
            <Option key={o.id} o={o} value={value} onChange={onChange} thumbs={thumbs} />
          ))}
        </div>
      )}
    </fieldset>
  )
}

// Renk yuvarlakları (tek seçim); seçilen rengin adı başlıkta görünür. color: null olan seçenek "yok".
// Dengeli ızgara: geniş panelde hepsi tek satırda; dar panelde 8+ renk eşit iki satıra bölünür (tek renk alta düşmez);
// telefonda 44 px yuvarlaklar en çok 6 sütunlu dengeli satırlara (--fit) dizilir.
function Swatches({ label, options, value, onChange, note, action }) {
  const current = options.find((o) => o.id === value)
  return (
    <fieldset className="field">
      <FieldLabel label={label} current={current?.label} note={note} action={action} />
      <div className="swatch-row" style={{ '--n': options.length, '--half': options.length > 7 ? Math.ceil(options.length / 2) : options.length, '--fit': Math.ceil(options.length / Math.ceil(options.length / 6)) }}>
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

// İkinci saç rengi (parlama ve uçlar): seçilmemişse "+ İkinci renk" düğmesinin arkasında katlı durur.
// "Kaldır" rengi siler ve alanı yeniden katlar.
function SecondHairColor({ value, onChange }) {
  const [open, setOpen] = useState(false)
  if (value === 'none' && !open)
    return (
      <button type="button" className="add-btn" onClick={() => setOpen(true)} aria-expanded="false">
        <span aria-hidden="true">+</span> İkinci renk <span className="add-btn__hint">parlama ve uçlar</span>
      </button>
    )
  const close = (
    <button
      type="button"
      className="link-btn field__action"
      onClick={() => {
        onChange('none')
        setOpen(false)
      }}
    >
      Kaldır
    </button>
  )
  return <Swatches label="İkinci renk" note="parlama ve uçlar" options={HAIR_COLORS} value={value} onChange={onChange} action={close} />
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

// Kombin 1'in, 2'nin, 3'ün
const OF = ["'in", "'nin", "'ün"]
// Bildirim süreleri (ms): üstüne yazınca "Geri al" 5 sn durur; fare ya da odak üstündeyken süre işlemez.
const NOTICE_MS = { saved: 2000, same: 2000, overwrote: 5000, restored: 2000, error: 6000 }
const noticeText = ({ kind, slot }) =>
  ({
    saved: `Kombin ${slot + 1}${SUFFIX[slot]} kaydedildi`,
    same: `Kombin ${slot + 1} zaten bu görünüm`,
    overwrote: `Kombin ${slot + 1}${OF[slot]} üstüne yazıldı`,
    restored: `Kombin ${slot + 1} eski hâline döndü`,
    error: 'Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı. Kombin yalnızca bu oturumda duracak.',
  })[kind]

// Kombinler şeridi: üç slot. Portreye dokununca kayıtlı kombin giyilir (geri alınabilir); slotun kaydet ikonu
// şu anki görünümü o slota yazar. Dolu slota yazınca 5 sn'lik "Geri al" çıkar; kayıt ve üstüne yazma ayrı
// mesajla duyurulur. Durum metni başlık satırında durur, yalnızca bir işlemden sonra görünür.
function Wardrobe({ avatar, onLoad }) {
  const [presets, setPresets] = useState(loadPresets)
  // son işlem: { kind, slot, prev (üstüne yazılan kombin), id }; id her işlemde artar, metin yeniden belirir
  const [notice, setNotice] = useState(null)
  const [hold, setHold] = useState(false)
  useEffect(() => {
    if (!notice || hold) return
    const t = setTimeout(() => setNotice(null), NOTICE_MS[notice.kind])
    return () => clearTimeout(t)
  }, [notice, hold])
  const write = (next, kind, slot, prev = null) => {
    setPresets(next)
    const ok = savePresets(next)
    setNotice((n) => ({ kind: ok ? kind : 'error', slot, prev, id: (n?.id ?? 0) + 1 }))
    if (kind !== 'overwrote') setHold(false)
  }
  const wear = (i) => onLoad(sanitizeAvatar({ ...presets[i], name: avatar.name }))
  const save = (i) => {
    const old = presets[i]
    if (old && sameLook(old, avatar)) {
      setNotice((n) => ({ kind: 'same', slot: i, id: (n?.id ?? 0) + 1 }))
      return
    }
    write(presets.map((p, k) => (k === i ? { ...avatar } : p)), old ? 'overwrote' : 'saved', i, old)
  }
  const restore = () => {
    const { slot, prev } = notice
    write(presets.map((p, k) => (k === slot ? prev : p)), 'restored', slot)
  }
  const justSaved = notice && (notice.kind === 'saved' || notice.kind === 'overwrote' || notice.kind === 'same') ? notice.slot : null
  const holdOn = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocus: () => setHold(true), onBlur: () => setHold(false) }
  return (
    <section className="wardrobe" aria-labelledby="wardrobe-title">
      <div className="wardrobe__head">
        <h2 id="wardrobe-title" className="wardrobe__title">Kombinler</h2>
        {/* canlı bölge sabit kalır; içindeki metin değişince yeniden kurulup belirir. Hata ayrı, ısrarlı
            (alert) bölgede duyurulur. */}
        <span className="wardrobe__status" role="status" data-kind={notice?.kind}>
          <span key={notice?.id}>{notice && notice.kind !== 'error' && noticeText(notice)}</span>
        </span>
        {notice?.kind === 'overwrote' && (
          <button type="button" className="link-btn wardrobe__undo" onClick={restore} {...holdOn}>
            Geri al
          </button>
        )}
      </div>
      <p className="form-error wardrobe__error" role="alert">
        {notice?.kind === 'error' && noticeText(notice)}
      </p>
      <ul className="wardrobe__slots">
        {presets.map((p, i) => {
          const worn = p && sameLook(p, avatar)
          return (
            <li key={i} className="wardrobe__slot" data-worn={worn || undefined} data-empty={!p || undefined}>
              <button type="button" className="wardrobe__wear" disabled={!p} aria-pressed={p ? worn : undefined} onClick={() => wear(i)} title={p ? 'Bu kombini giy' : undefined}>
                {p ? (
                  <AvatarPortrait avatar={p} />
                ) : (
                  <span className="wardrobe__ghost" aria-hidden="true">
                    <Icon name="body" size={20} />
                  </span>
                )}
                <span className="wardrobe__name">
                  Kombin {i + 1}
                  {(!p || worn) && <small>{p ? 'giyili' : 'boş'}</small>}
                </span>
              </button>
              <button
                type="button"
                className="wardrobe__save"
                data-done={justSaved === i || undefined}
                onClick={() => save(i)}
                aria-label={p ? `Kombin ${i + 1}${OF[i]} üstüne yaz` : `Kombin ${i + 1}${SUFFIX[i]} kaydet`}
                title={p ? 'Şu anki görünümü bunun üstüne yaz (5 sn geri alınabilir)' : 'Şu anki görünümü buraya kaydet'}
              >
                <Icon name={justSaved === i ? 'check' : 'save'} size={18} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Telefonda (≤900 px) poz ve kombinler alt sayfada: önizleme üstte görünür kalır, her seçim anında
// sahnede görülür. Yerel <dialog>: odak hapsi, Esc ve dışarı dokununca kapanma tarayıcıdan gelir.
function PoseSheet({ open, onClose, mode, setMode, activity, setActivity, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const seated = SEATED.includes(mode)
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="pose-sheet-title" aria-describedby="pose-sheet-note" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet__head">
        <h2 id="pose-sheet-title" className="sheet__title">Poz ve kombinler</h2>
        <button type="button" className="sheet__close" onClick={onClose} aria-label="Kapat">
          <Icon name="close" />
        </button>
      </div>
      <p id="pose-sheet-note" className="sheet__note">Önizleme pozu: odadaki durumunu değiştirmez</p>
      <div className="segmented segmented--fill" role="group" aria-label="Poz" style={{ '--count': MODES.length }}>
        {MODES.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            <Icon name={m.icon} size={16} />
            {m.label}
          </button>
        ))}
      </div>
      <div className="segmented segmented--fill sheet__sub" role="group" aria-label="Çalışma türü" style={{ '--count': ACTIVITIES.length }} data-off={!seated || undefined} inert={!seated} aria-hidden={!seated || undefined}>
        {ACTIVITIES.map((a) => (
          <button key={a.id} type="button" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
            <Icon name={a.icon} size={16} />
            {a.label}
          </button>
        ))}
      </div>
      {children}
    </dialog>
  )
}

// Ekran genişliği eşiği (CSS'teki @media ile aynı); değişince yeniden çizer.
const COMPACT = '(max-width: 900px)'
function useCompact() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(COMPACT)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(COMPACT).matches,
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
  // telefonda poz ve kombinler alt sayfada
  const compact = useCompact()
  const [sheetOpen, setSheetOpen] = useState(false)
  // zar: karışma sürerken önizlemede geçici görünüm; sonuç tek adımda kaydedilir (tek geri alma)
  const [roll, setRoll] = useState(null)
  const rollTimers = useRef([])
  useEffect(() => () => rollTimers.current.forEach(clearTimeout), [])
  const previewRef = useRef(null)
  // alt sayfa önizlemenin altındaki alanı kaplar: önce önizleme yapışkan konumuna (ekranın üstüne) gelir
  const openSheet = () => {
    const top = previewRef.current?.getBoundingClientRect().top ?? 0
    if (top > 0) window.scrollBy({ top, behavior: 'instant' })
    setSheetOpen(true)
  }
  // her artışta önizlemenin döndürmesi sıfırlanır (kontrol barındaki Sıfırla)
  const [resetKey, setResetKey] = useState(0)
  // last: son değişen alan; art arda yazılan ad tek adımda geri alınır
  const [history, setHistory] = useState({ past: [], future: [], last: null })
  // sınırı aşan görünen ad: kaydedilmez, kısaltılana dek alanda bu taslak durur
  const [nameDraft, setNameDraft] = useState(null)
  const nameState = nameStatus(nameDraft ?? avatar.name, NAME_MAX, `Boş bırakırsan adın “${DEFAULT_AVATAR.name}” olur.`)

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
  const rollDice = () => {
    if (roll) return
    const final = randomAvatar(Math.random, avatar.name)
    if (reducedMotion()) {
      commit(final)
      return
    }
    const ms = ROLL_STEPS.reduce((a, b) => a + b, 0)
    const shuffle = { start: performance.now(), ms }
    let at = 0
    rollTimers.current = ROLL_STEPS.map((step, i) => {
      at += step
      const look = i === ROLL_STEPS.length - 1 ? final : randomAvatar(Math.random, avatar.name)
      return setTimeout(() => setRoll({ shuffle, look }), at - step)
    })
    rollTimers.current.push(
      setTimeout(() => {
        commit(final)
        setRoll(null)
      }, at),
    )
  }
  const openTab = (t) => {
    setTab(t.id)
    setZone(t.zone)
    setHatShown(false)
  }
  const onTabKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const last = TABS.length - 1
    const to = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
    if (to === undefined || e.altKey || e.ctrlKey || e.metaKey) return
    e.preventDefault()
    openTab(TABS[to])
    document.getElementById(`avatar-tab-${TABS[to].id}`)?.focus()
  }
  // saçı örten başlık ya da kafa üstü kulaklık: saç sekmesinde önizlemede gizlenir
  const hasHeadwear = avatar.hat !== 'none' || OVER_HEAD.includes(avatar.headphones)
  const hideHeadwear = tab === 'hair' && hasHeadwear && !hatShown
  const seated = SEATED.includes(mode)
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
    <div className="avatar-workshop">
      <h1>Avatar atölyesi</h1>
      <p className="site-muted">Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.</p>
      <div className="create avatar-page">
        <section className="create-preview" aria-label="Önizleme" ref={previewRef}>
          <div className="room-frame avatar-page__preview">
            <AvatarPreview avatar={roll?.look ?? avatar} shuffle={roll?.shuffle ?? null} mode={mode} activity={activity} focus={zone} hideHeadwear={hideHeadwear} hint={false} resetKey={resetKey} />
            {/* yüzen kontrol barları. Sol üst: poz ve altında çalışma türü (oturmayan pozda yeri korunur,
                gizlenir). Sağ üst: geri al / ileri al ve saç sekmesinde başlık gizle. Alt: ipuçları. */}
            {!compact && (
            <div className="hud-stack hud-stack--start">
              <div className="hud" role="group" aria-label="Poz">
                {MODES.map((m) => (
                  <button key={m.id} type="button" className="hud__opt" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                    <Icon name={m.icon} size={16} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="hud hud--sub" role="group" aria-label="Çalışma türü" data-off={!seated || undefined} inert={!seated} aria-hidden={!seated || undefined}>
                {ACTIVITIES.map((a) => (
                  <button key={a.id} type="button" className="hud__opt" aria-pressed={activity === a.id} onClick={() => setActivity(a.id)}>
                    <Icon name={a.icon} size={16} />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            )}
            <div className="hud-stack hud-stack--end">
              <div className="hud" role="toolbar" aria-label="Geçmiş">
                <button type="button" className="hud__icon" onClick={undo} disabled={!history.past.length} aria-label="Geri al" title="Geri al (Ctrl+Z)">
                  <Icon name="undo" />
                </button>
                <button type="button" className="hud__icon" onClick={redo} disabled={!history.future.length} aria-label="İleri al" title="İleri al (Ctrl+Y)">
                  <Icon name="redo" />
                </button>
              </div>
              <div className="hud">
                {compact && (
                  <button type="button" className="hud__text hud__pose" onClick={openSheet} aria-haspopup="dialog" title="Poz ve kombinler">
                    <Icon name={MODES.find((m) => m.id === mode)?.icon ?? 'focus'} size={16} />
                    Poz
                  </button>
                )}
                <button type="button" className="hud__icon hud__dice" onClick={rollDice} data-rolling={roll ? '' : undefined} aria-label="Rastgele avatar" title="Rastgele avatar (geri alınabilir)">
                  <Icon name="dice" />
                </button>
              </div>
              {tab === 'hair' && hasHeadwear && (
                <div className="hud">
                  <button
                    type="button"
                    className="hud__icon"
                    aria-pressed={hideHeadwear}
                    aria-label="Başlığı ve kulaklığı gizle"
                    title={hideHeadwear ? 'Başlık ve kulaklık gizli: göster' : 'Saça bakarken başlığı ve kulaklığı gizle'}
                    onClick={() => setHatShown(!hatShown)}
                  >
                    <Icon name={hideHeadwear ? 'hatOff' : 'hat'} />
                  </button>
                </div>
              )}
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
          {compact ? (
            <PoseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} mode={mode} setMode={setMode} activity={activity} setActivity={setActivity}>
              <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
            </PoseSheet>
          ) : (
            <Wardrobe avatar={avatar} onLoad={(next) => commit(next)} />
          )}
        </section>

        <div className="site-card create-form avatar-page__editor">
          {/* ARIA sekme deseni: ←/→ komşu sekmeye (uçlarda döner), Home/End ilk/son sekmeye geçer ve seçer;
              roving tabindex ile Tab sırasında yalnızca seçili sekme durur */}
          <div className="avatar-tabs" role="tablist" aria-label="Kategori" onKeyDown={onTabKey}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`avatar-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="avatar-panel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => openTab(t)}
              >
                <Icon name={t.icon} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* sekme değişince içerik yeniden kurulur ve yumuşakça gelir (avatar-page__panel) */}
          <div key={tab} id="avatar-panel" role="tabpanel" aria-labelledby={`avatar-tab-${tab}`} className="avatar-page__panel">
          {tab === 'body' && (
            <Section>
              {/* sınırı aşan ad kesilmez ve kaydedilmez: alanda kalır, hata görünür; boş ad alandan çıkınca varsayılana döner */}
              <div className="field">
                <label className="field__label" htmlFor="avatar-name">
                  Görünen ad
                </label>
                <input
                  id="avatar-name"
                  value={nameDraft ?? avatar.name}
                  aria-invalid={nameState.tone === 'over' || undefined}
                  aria-describedby="avatar-name-hint"
                  autoComplete="nickname"
                  spellCheck={false}
                  onChange={(e) => {
                    const v = e.target.value
                    if (textLength(v) > NAME_MAX) return setNameDraft(v)
                    setNameDraft(null)
                    commit({ ...avatar, name: v }, 'name')
                  }}
                  onBlur={() => {
                    if (nameDraft === null && !avatar.name.trim()) commit({ ...avatar, name: DEFAULT_AVATAR.name }, 'name')
                  }}
                />
                <NameHint id="avatar-name-hint" status={nameState} max={NAME_MAX} />
              </div>
              <Choices label="Beden" variant="segment" options={BODIES} value={avatar.body} onChange={set('body')} />
              <Swatches label="Ten rengi" options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
              <Swatches label="Göz rengi" options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
            </Section>
          )}

          {tab === 'hair' && (
            <>
              <Section title="Saç">
                <Choices label="Saç modeli" bare thumbs="hair" options={HAIR_STYLES} value={avatar.hairStyle} onChange={set('hairStyle')} />
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
                <SecondHairColor value={avatar.hairColor2} onChange={set('hairColor2')} />
              </Section>
              <Section title="Kaş">
                <Choices label="Kaş rengi" bare variant="segment" note={browNote} options={BROW_MODES} value={avatar.brows} onChange={set('brows')} />
                {avatar.brows === 'custom' && <Swatches label="Renk" options={HAIR_COLORS} value={avatar.browColor} onChange={set('browColor')} />}
              </Section>
              {male && (
                <Section title="Sakal ve bıyık">
                  <Choices label="Sakal" thumbs="beard" options={BEARDS} value={avatar.beard} onChange={set('beard')} />
                  <Choices label="Bıyık" thumbs="mustache" options={MUSTACHES} value={avatar.mustache} onChange={set('mustache')} />
                </Section>
              )}
            </>
          )}

          {tab === 'clothes' && (
            <>
              <Zone zone="upper" onZone={setZone}>
                <Section title="Üst">
                  <Choices label="Üst" bare note={replaced} options={TOPS} value={avatar.top} onChange={set('top')} />
                  <Swatches label={topLabel} options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
                </Section>
              </Zone>
              <Zone zone="legs" onZone={setZone}>
                <Section title="Alt">
                  <Choices label="Alt" bare note={outfit === 'none' ? null : replacedNote} options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
                  <Swatches label={bottomLabel} options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
                </Section>
              </Zone>
              <Zone zone="full" onZone={setZone}>
                <Section title="Tek parça">
                  <Choices label="Tek parça" bare note="elbise ve tulum üst rengini, salopet alt rengini kullanır" options={OUTFITS} value={outfit} onChange={set('outfit')} />
                </Section>
              </Zone>
              <Zone zone="feet" onZone={setZone}>
                <Section title="Ayak">
                  <Choices label="Ayakkabı" bare options={FOOTWEAR} value={avatar.footwear} onChange={set('footwear')} />
                  <Swatches label="Renk" options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
                </Section>
              </Zone>
            </>
          )}

          {tab === 'extras' && (
            <>
              <Zone zone="hat" onZone={setZone}>
                <Section title="Başlık">
                  <Choices label="Başlık" bare thumbs="hat" options={HATS} value={avatar.hat} onChange={set('hat')} />
                  {FIXED_COLOR_HATS.includes(avatar.hat) ? null : <Swatches label="Renk" options={CLOTH_COLORS} value={avatar.hatColor} onChange={set('hatColor')} />}
                </Section>
              </Zone>
              <Section title="Yüz ve kulak">
                <Zone zone="face" onZone={setZone}>
                  <Choices label="Gözlük" thumbs="glasses" options={GLASSES} value={avatar.glasses} onChange={set('glasses')} />
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

          {/* sessiz sıfırlama: geri al ile döner; rastgele önizlemedeki zarda */}
          <div className="avatar-page__actions">
            <button type="button" className="quiet-link" onClick={() => commit({ ...DEFAULT_AVATAR, name: avatar.name })}>
              Varsayılana dön
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
