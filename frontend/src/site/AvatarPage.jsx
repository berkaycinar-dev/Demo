import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
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
import CharacterMenu from './CharacterMenu'
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
// Ortak renkleri kullanan takılı öğeler (avatars/model.js ile aynı kural). Boşsa o renk alanı gizlenir.
const ACC_PHONES = ['gaming', 'cat', 'retro', 'neck']
const ACC_NECK = { scarf: 'atkı', bowtie: 'papyon', tie: 'kravat' }
const accessoryColorUsers = (a) =>
  [ACC_PHONES.includes(a.headphones) && 'kulaklık', ACC_NECK[a.neck], a.wrist === 'watch' && 'saat kayışı'].filter(Boolean)
const metalUsersOf = (a) =>
  [
    a.hat === 'crown' && 'taç',
    a.glasses === 'monocle' && 'monokl',
    a.earrings !== 'none' && !EAR_COVERING.includes(a.hairStyle) && !OVER_HEAD.includes(a.headphones) && 'küpe',
    a.neck === 'necklace' && 'kolye',
    a.wrist === 'watch' && 'saat kasası',
    a.wrist === 'bracelet' && 'bileklik',
  ].filter(Boolean)
// "kulaklık, atkı ve saat kayışı"
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ve ${items.at(-1)}`)
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
// her beden için ayrı (public/avatar-thumbs/<tür>-<id>-<beden>.webp; sakal ve bıyık yalnızca male).
// thumbs: o alanın tür adı (hair, hat, glasses, beard, mustache); body: avatarın bedeni.
const thumbOf = (kind, id, body) => `${import.meta.env.BASE_URL}avatar-thumbs/${kind}-${id}-${body === 'female' ? 'female' : 'male'}.webp`

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

function Option({ o, value, onChange, thumbs, body }) {
  const none = o.id === 'none'
  const cls = ['tile', none && 'tile--none', thumbs && 'tile--thumb'].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
      {thumbs && <OptionThumb key={body} src={thumbOf(thumbs, o.id, body)} />}
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
// detail: seçili seçeneğin ayrıntısı (ör. başlık rengi). Izgarada seçili düğmeden hemen sonra tam satır
// olarak durur; ızgara "dense" akışla seçili seçeneğin satırını doldurur, ayrıntı o satırın altına iner.
function Choices({ label, options, value, onChange, note, variant = 'grid', disabled = false, bare = false, thumbs, body, detail = null }) {
  const groups = options[0]?.group ? [...new Set(options.map((o) => o.group))] : null
  const grid = ['option-grid', thumbs && 'option-grid--thumbs', detail && 'option-grid--detail'].filter(Boolean).join(' ')
  const tiles = (list) =>
    list.map((o) => (
      <Fragment key={o.id}>
        <Option o={o} value={value} onChange={onChange} thumbs={thumbs} body={body} />
        {detail && o.id === value && <div className="option-detail">{detail}</div>}
      </Fragment>
    ))
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
            <div className={grid}>{tiles(options.filter((o) => o.group === g))}</div>
          </div>
        ))
      ) : (
        <div className={grid}>{tiles(options)}</div>
      )}
    </fieldset>
  )
}

// Renk yuvarlakları (tek seçim); seçilen rengin adı başlıkta görünür. color: null olan seçenek "yok".
// Dengeli ızgara: geniş panelde hepsi tek satırda; dar panelde 8+ renk eşit iki satıra bölünür (tek renk alta düşmez);
// telefonda 44 px yuvarlaklar en çok 6 sütunlu dengeli satırlara (--fit) dizilir.
// collapsible: renkler "+ İkinci renk" gibi katlı durur; satırda seçili renk ve "Değiştir" görünür,
// düğme yuvarlakları açar ve kapatır (seçim yapınca açık kalır, renkler karşılaştırılabilsin).
function Swatches({ label, options, value, onChange, note, action, collapsible = false }) {
  const current = options.find((o) => o.id === value)
  const [open, setOpen] = useState(!collapsible)
  const rowId = useId()
  const toggle = collapsible && (
    <button type="button" className="color-toggle field__action" aria-expanded={open} aria-controls={rowId} onClick={() => setOpen(!open)}>
      <span className={current?.color ? 'color-toggle__chip' : 'color-toggle__chip swatch--none'} style={current?.color ? { background: current.color } : undefined} aria-hidden="true" />
      {open ? 'Kapat' : 'Değiştir'}
      <span className="visually-hidden">: {label}</span>
    </button>
  )
  return (
    <fieldset className={collapsible && !open ? 'field field--folded' : 'field'}>
      <FieldLabel label={label} current={current?.label} note={note} action={action ?? toggle} />
      {open && <div id={rowId} className="swatch-row" style={{ '--n': options.length, '--half': options.length > 7 ? Math.ceil(options.length / 2) : options.length, '--fit': Math.ceil(options.length / Math.ceil(options.length / 6)) }}>
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
      </div>}
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
      <p className="wardrobe__hint">Kaydet simgesiyle şu anki görünümü sakla, sonra kombine dokunup tek seferde giy.</p>
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

// Düzenleyici düzeni: karakter menüsü (varsayılan, CharacterMenu) ya da sekmeler. Sekmeli düzen başlıkta
// küçük bir ikincil anahtarla açılır; seçim bu tarayıcıda hatırlanır.
const LAYOUT_KEY = 'odakhane:avatar-layout'
const loadLayout = () => {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'tabs' ? 'tabs' : 'menu'
  } catch {
    return 'menu'
  }
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
export default function AvatarPage({ avatar, onChange, onEnterRoom }) {
  const [mode, setMode] = useState('focus')
  const [activity, setActivity] = useState('read')
  const [tab, setTab] = useState('body')
  const [zone, setZone] = useState('full')
  const [layout, setLayoutState] = useState(loadLayout)
  const setLayout = (id) => {
    setLayoutState(id)
    setZone(id === 'tabs' ? TABS.find((t) => t.id === tab).zone : 'full')
    setMenuHair(false)
    setHatShown(false)
    try {
      localStorage.setItem(LAYOUT_KEY, id)
    } catch {
      /* depolama kapalı: seçim bu oturumda kalır */
    }
  }
  // menü düzeninde etkin satır saç satırıysa (sekmedeki "Saç ve yüz" gibi) başlık önizlemede gizlenir
  const [menuHair, setMenuHair] = useState(false)
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
  const nameState = nameStatus(nameDraft ?? avatar.name, NAME_MAX, `Boş bırakırsan odadakiler seni “${DEFAULT_AVATAR.name}” adıyla görür.`)

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
  const hairFocus = layout === 'menu' ? menuHair : tab === 'hair'
  const hideHeadwear = hairFocus && hasHeadwear && !hatShown
  const seated = SEATED.includes(mode)
  const male = avatar.body !== 'female'
  const earsCovered = EAR_COVERING.includes(avatar.hairStyle)
  const overHead = OVER_HEAD.includes(avatar.headphones)
  const earNote = avatar.earrings === 'none' ? null : earsCovered ? 'saç kulakları örtüyor' : overHead ? 'kulaklık örtüyor' : null
  const phoneNote = avatar.headphones === 'earbuds' && earsCovered ? 'saç kulakları örtüyor' : HEADPHONE_HATS.includes(avatar.hat) ? null : 'kafa üstü modeller seçilirse başlık çıkar'
  const hair = HAIR_COLORS.find((h) => h.id === avatar.hairColor)
  // Otomatik kaş: doğal saç renginde saçla aynı, diğerlerinde doğal koyu. Not kuralı ve şu anki sonucu söyler.
  const browNote = avatar.brows === 'auto' ? (hair?.natural ? 'Otomatik: doğal saç renginde kaş saçla aynı olur' : 'Otomatik: bu saç renginde kaş doğal koyu olur') : null
  const outfit = avatar.outfit
  const topLabel = outfit === 'dress' ? 'Elbise rengi' : outfit === 'onesie' ? 'Tulum rengi' : 'Renk'
  const bottomLabel = outfit === 'overalls' ? 'Salopet rengi' : 'Renk'
  const replacedNote = 'tek parça seçili; seçilirse tek parça çıkar'
  const replaced = outfit === 'dress' || outfit === 'onesie' ? replacedNote : null
  const hatLabel = HATS.find((h) => h.id === avatar.hat)?.label ?? 'Başlık'
  // ortak renkler: yalnızca o rengi kullanan bir öğe takılıysa görünür; not hangilerinin boyandığını söyler
  const accUsers = accessoryColorUsers(avatar)
  const metalUsers = metalUsersOf(avatar)

  const nameField = (
    <>
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
    </>
  )

  return (
    <div className="avatar-workshop">
      <div className="avatar-workshop__head">
        <div>
          <h1>Avatar atölyesi</h1>
          <p className="site-muted">Burada yaptığın avatar odalarda “Sen” olarak oturur. Değişiklikler hemen kaydedilir.</p>
        </div>
        <div className="avatar-workshop__tools">
          {/* Menü varsayılan; sekmeli düzen küçük bir ikincil anahtar (ilk gelen kişiye seçim sorulmaz) */}
          <button
            type="button"
            className="link-btn avatar-workshop__layout"
            aria-pressed={layout === 'tabs'}
            onClick={() => setLayout(layout === 'tabs' ? 'menu' : 'tabs')}
          >
            {layout === 'tabs' ? 'Menü düzenine dön' : 'Sekmeli düzen'}
          </button>
          {onEnterRoom && (
            <button type="button" className="site-btn avatar-workshop__enter" onClick={onEnterRoom}>
              Bu hâliyle odama gir
            </button>
          )}
        </div>
      </div>
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
                {/* simge düğmeleri: fareyle üstüne gelince ya da klavye odağında ipucu balonu, dokunmatikte
                    (hover: none) etiket simgenin altında hep görünür. Kısayol yalnızca balonda. */}
                <button type="button" className="hud__icon" onClick={undo} disabled={!history.past.length} aria-label="Geri al" aria-keyshortcuts="Control+Z">
                  <Icon name="undo" />
                  <span className="hud__label" aria-hidden="true">
                    Geri al<kbd className="hud__key">Ctrl+Z</kbd>
                  </span>
                </button>
                <button type="button" className="hud__icon" onClick={redo} disabled={!history.future.length} aria-label="İleri al" aria-keyshortcuts="Control+Y">
                  <Icon name="redo" />
                  <span className="hud__label" aria-hidden="true">
                    İleri al<kbd className="hud__key">Ctrl+Y</kbd>
                  </span>
                </button>
              </div>
              <div className="hud">
                {compact && (
                  <button type="button" className="hud__text hud__pose" onClick={openSheet} aria-haspopup="dialog" title="Poz ve kombinler">
                    <Icon name={MODES.find((m) => m.id === mode)?.icon ?? 'focus'} size={16} />
                    Poz
                  </button>
                )}
                <button type="button" className="hud__icon hud__dice" onClick={rollDice} data-rolling={roll ? '' : undefined} aria-label="Rastgele avatar">
                  <Icon name="dice" />
                  <span className="hud__label" aria-hidden="true">
                    Rastgele
                  </span>
                </button>
              </div>
              {hairFocus && hasHeadwear && (
                <div className="hud">
                  <button
                    type="button"
                    className="hud__icon"
                    aria-pressed={hideHeadwear}
                    aria-label="Başlığı ve kulaklığı gizle"
                    onClick={() => setHatShown(!hatShown)}
                  >
                    <Icon name={hideHeadwear ? 'hatOff' : 'hat'} />
                    <span className="hud__label" aria-hidden="true">
                      {hideHeadwear ? 'Başlık gizli' : 'Başlığı gizle'}
                    </span>
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

        <div className={layout === 'menu' ? 'site-card create-form avatar-page__editor avatar-page__editor--menu' : 'site-card create-form avatar-page__editor'}>
          {layout === 'menu' ? (
            <CharacterMenu
              avatar={avatar}
              set={set}
              notes={{
                brow: browNote,
                topReplaced: replaced,
                bottomReplaced: outfit === 'none' ? null : replacedNote,
                phone: phoneNote,
                ear: earNote,
                acc: accUsers.length ? listOf(accUsers) : null,
                metal: metalUsers.length ? listOf(metalUsers) : null,
              }}
              kit={{ Choices, Swatches, OptionThumb, thumbOf }}
              onRow={({ zone: z, hair: h }) => {
                setZone(z)
                if (h !== menuHair) setHatShown(false)
                setMenuHair(h)
              }}
              lead={<div className="cmenu__lead">{nameField}</div>}
            />
          ) : (
          <>
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
              {nameField}
              <Choices label="Beden" variant="segment" options={BODIES} value={avatar.body} onChange={set('body')} />
              <Swatches label="Ten rengi" collapsible options={SKIN_TONES} value={avatar.skin} onChange={set('skin')} />
              <Swatches label="Göz rengi" collapsible options={EYE_COLORS} value={avatar.eyes} onChange={set('eyes')} />
            </Section>
          )}

          {tab === 'hair' && (
            <>
              <Section title="Saç">
                <Choices label="Saç modeli" bare thumbs="hair" body={avatar.body} options={HAIR_STYLES} value={avatar.hairStyle} onChange={set('hairStyle')} />
                <Choices
                  label="Kahkül"
                  variant="segment"
                  disabled={NO_BANGS.includes(avatar.hairStyle)}
                  note={NO_BANGS.includes(avatar.hairStyle) ? 'bu saç modelinde yok' : null}
                  options={ON_OFF}
                  value={avatar.bangs ? 'on' : 'off'}
                  onChange={(v) => set('bangs')(v === 'on')}
                />
                <Swatches label={male ? 'Saç ve sakal rengi' : 'Renk'} collapsible options={HAIR_COLORS} value={avatar.hairColor} onChange={set('hairColor')} />
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
                  <Swatches label={topLabel} collapsible options={CLOTH_COLORS} value={avatar.topColor} onChange={set('topColor')} />
                </Section>
              </Zone>
              <Zone zone="legs" onZone={setZone}>
                <Section title="Alt">
                  <Choices label="Alt" bare note={outfit === 'none' ? null : replacedNote} options={BOTTOMS} value={avatar.bottom} onChange={set('bottom')} />
                  <Swatches label={bottomLabel} collapsible options={CLOTH_COLORS} value={avatar.bottomColor} onChange={set('bottomColor')} />
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
                  <Swatches label="Renk" collapsible options={SHOE_COLORS} value={avatar.shoes} onChange={set('shoes')} />
                </Section>
              </Zone>
            </>
          )}

          {tab === 'extras' && (
            <>
              <Zone zone="hat" onZone={setZone}>
                <Section title="Başlık">
                  <Choices
                    label="Başlık"
                    bare
                    thumbs="hat"
                    body={avatar.body}
                    options={HATS}
                    value={avatar.hat}
                    onChange={set('hat')}
                    detail={FIXED_COLOR_HATS.includes(avatar.hat) ? null : <Swatches label={`${hatLabel} rengi`} options={CLOTH_COLORS} value={avatar.hatColor} onChange={set('hatColor')} />}
                  />
                </Section>
              </Zone>
              <Section title="Yüz ve kulak">
                <Zone zone="face" onZone={setZone}>
                  <Choices label="Gözlük" thumbs="glasses" body={avatar.body} options={GLASSES} value={avatar.glasses} onChange={set('glasses')} />
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
              {(accUsers.length > 0 || metalUsers.length > 0) && (
                <Zone zone="upper" onZone={setZone}>
                  <Section title="Renkler">
                    {accUsers.length > 0 && (
                      <Swatches label="Diğer aksesuar rengi" collapsible note={listOf(accUsers)} options={CLOTH_COLORS} value={avatar.accessoryColor} onChange={set('accessoryColor')} />
                    )}
                    {metalUsers.length > 0 && <Swatches label="Metal" collapsible note={listOf(metalUsers)} options={METALS} value={avatar.metal} onChange={set('metal')} />}
                  </Section>
                </Zone>
              )}
            </>
          )}
          </div>
          </>
          )}

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
