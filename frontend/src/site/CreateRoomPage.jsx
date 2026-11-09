import { useLayoutEffect, useRef, useState } from 'react'
import { LISTED_THEMES, THEMES } from '../rooms/themes'
import Icon from './AvatarIcons'
import NameHint from './NameHint'
import { nameStatus, textLength } from './nameRules'
import { normalizeCode } from './roomStore'
import { thumbOf } from './RoomShot'
import useImageState from './useImageState'

const DEFAULT_THEME = 'library'
const DEFAULT_CAPACITY = 4
const FORM_ID = 'create-room-form'
const NAME_MAX = 60
// Kimler girebilir: düğme etiketi ve seçilince altında çıkan açıklama
const ACCESS_OPTIONS = [
  { id: 'public', label: 'Herkese açık', hint: 'Oda lobide listelenir, herkes girebilir.' },
  { id: 'invite', label: 'Davetle', hint: 'Bir davet kodu üretilir; yalnızca kodu bilenler girebilir.' },
]
// Tabela piksel yazıyla çizilir; emoji renkli sistem emojisi olarak çıkıp levhayı bozar. Yazılan emoji
// (birleştiriciler, ten tonu ve bayrak harfleriyle) alınmaz, altta not çıkar.
const EMOJI_PARTS = /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣/gu
const EMOJI_NOTE = 'Tabelaya emoji yazılamaz; harf, rakam ve noktalama kullan.'

// Oda oluşturulamadığında: ne oldu ve ne yapılabilir
const FAILURE_TEXT = {
  full: 'Oda kaydedilemedi: tarayıcının bu siteye ayırdığı depolama alanı dolu. Tarayıcı ayarlarından site verilerini temizleyip tekrar dene ya da odaya kaydetmeden gir; sayfayı yenileyince ya da kapatınca oda silinir.',
  blocked: 'Oda kaydedilemedi: tarayıcı bu sitenin veri saklamasına izin vermiyor (gizli pencere ya da kapalı site verileri olabilir). İzin verip tekrar dene ya da odaya kaydetmeden gir; sayfayı yenileyince ya da kapatınca oda silinir.',
  failed: 'Oda oluşturulamadı, beklenmeyen bir hata oldu. Seçimlerin duruyor; tekrar dene.',
}

// Gizli odaların davet kodu: tema adından kısa önek + 4 rakam (ORMAN-4821 gibi).
function inviteCode(name) {
  const prefix =
    normalizeCode(name)
      .replace(/[^A-Z]/g, '')
      .slice(0, 5) || 'ODA'
  return `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

// Tema kartı görseli: yüklenirken iskelet, yüklenemezse çizgi ikonlu yer tutucu (kırık resim simgesi yok).
function ThemeShot({ src, className = '' }) {
  const [state, imgProps] = useImageState()
  return (
    <span className={`theme-option__img ${className}`} data-state={state}>
      {state === 'error' ? <Icon name="image" size={28} /> : <img src={src} alt="" width="480" height="360" loading="lazy" decoding="async" {...imgProps} />}
    </span>
  )
}

// Kapasite adım seçici: − / + ve kişi ikonları (dolu: oda kapasitesi, soluk: temanın üst sınırına kadar).
function CapacityStepper({ value, max, onChange }) {
  return (
    <div className="stepper" role="group" aria-labelledby="capacity-label">
      <button type="button" className="stepper__btn" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Bir kişi azalt">
        <Icon name="minus" size={20} />
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
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}

// Oda oluşturma: seçilen odanın canlı 3D sahnesi sayfanın kahramanı; oda adı sahnenin üstüne asılı kapı
// tabelasına yazılır. Kapasite / erişim / oluştur düğmesi sahnenin yanındaki rafta; tema kartları ikisinin
// altında tam genişlik tek satır, sahne yüksekliği ekrana göre: 10 tema ilk ekranda görünür.
// Telefonda sırayla sahne, temalar, ayarlar; düğme ekranın altına yapışık.
// Lobi'nin alt sayfası; var olan odalara katılmak Lobi'de.
export default function CreateRoomPage({ onCreate, onBack, isDark = false }) {
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [access, setAccess] = useState('public')
  const [spot, setSpot] = useState(null)
  // oluşturma başarısızsa { reason: 'full' | 'blocked' | 'failed', room }
  const [failure, setFailure] = useState(null)
  // son yazışta emoji ayıklandıysa tabela altındaki not bunu söyler; emojisiz ilk yazışta kalkar
  const [emojiDropped, setEmojiDropped] = useState(false)
  const { label, Room, max } = THEMES[theme]
  const fallbackName = `${label} odası`
  const roomName = name.trim() || fallbackName
  const baseStatus = nameStatus(name, NAME_MAX, `Boş bırakırsan adı “${fallbackName}” olur.`)
  const status = emojiDropped && baseStatus.tone !== 'over' ? { ...baseStatus, tone: 'warn', message: EMOJI_NOTE } : baseStatus
  const nameRef = useRef(null)
  const heroRef = useRef(null)
  // telefonda mini önizlemeye dokununca canlı sahneye çıkar (azaltılmış harekette anında)
  const showStage = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    heroRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
  // tabela yazısı satıra sığmazsa alt satıra geçer; levha yazıyla birlikte uzar (baş hiç kaybolmaz)
  useLayoutEffect(() => {
    const el = nameRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [name])

  const submit = (e) => {
    e.preventDefault()
    if (status.tone === 'over') {
      nameRef.current?.focus()
      return
    }
    const room = { id: `room-${Date.now()}`, name: roomName, theme, capacity, access, code: access === 'invite' ? inviteCode(roomName) : undefined }
    const reason = onCreate(room)
    setFailure(reason ? { reason, room } : null)
  }
  // depolama yazılamadıysa: oda yalnızca bu oturumda tutulup girilir
  const enterForSession = () => {
    const reason = onCreate(failure.room, { keepForSession: true })
    setFailure(reason ? { reason: 'failed', room: failure.room } : null)
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
        <section className="create-room__hero" aria-label="Oda önizlemesi" ref={heroRef}>
          {/* oda adı: sahnenin üstüne asılı kapı tabelası. Çok satırlı alan: uzun ad levhada alt satıra geçer;
              Enter satır açmaz, formu gönderir. Sınır sessizce kesmez; altındaki not ve sayaç uyarır. */}
          <div className="field door-sign create-room__sign">
            <label className="door-sign__label">
              <span className="door-sign__tag">Oda adı</span>
              <span className="door-sign__plate">
                <textarea
                  ref={nameRef}
                  rows={1}
                  value={name}
                  data-long={textLength(name) > 22 || undefined}
                  onChange={(e) => {
                    const typed = e.target.value.replace(/\s*[\r\n]+\s*/g, ' ')
                    const clean = typed.replace(EMOJI_PARTS, '')
                    const dropped = clean !== typed
                    setEmojiDropped(dropped)
                    // emojinin iki yanındaki boşluklar tek boşluğa iner
                    setName(dropped ? clean.replace(/ {2,}/g, ' ') : clean)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder={fallbackName}
                  aria-invalid={status.tone === 'over' || undefined}
                  aria-describedby="room-name-hint"
                  spellCheck={false}
                />
              </span>
            </label>
            <NameHint id="room-name-hint" status={status} max={NAME_MAX} className="create-room__name-hint" />
          </div>
          <div className="room-frame create-room__stage">
            {/* tema ya da kapasite değişince yeni sahne yumuşakça belirir */}
            <div key={`${theme}-${capacity}`} className="create-preview__scene">
              <Room capacity={capacity} onSpotClick={setSpot} toolbar="compact" hint="Zemindeki halkalar mola noktaları · Sürükle: döndür" />
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
                aria-labelledby={`theme-${key}-name`}
                aria-describedby={`theme-${key}-desc`}
                onClick={() => {
                  setTheme(key)
                  setCapacity((c) => Math.min(c, t.max))
                  setSpot(null)
                }}
              >
                <span className="theme-option__shot">
                  <ThemeShot key={isDark ? 'dark' : 'light'} src={thumbOf(key, isDark)} />
                  <span className="theme-option__check" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                </span>
                {/* ad ve açıklama ayrı: ekran okuyucu adı düğme adı, açıklamayı ek bilgi olarak okur */}
                <span id={`theme-${key}-name`} className="theme-option__name">{t.label}</span>
                <span id={`theme-${key}-desc`} className="theme-option__desc">{t.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* masaüstünde yapışkan raf; telefonda display: contents ile ayarlar akışta, eylem alta yapışır */}
        <div className="create-room__rail">
          {/* geniş ekranda kartlar tek satır ve açıklamasız; seçili temanın açıklaması rafın başında */}
          <p className="create-room__theme-note">
            <span className="create-room__theme-name">{label}</span>
            <span>{THEMES[theme].description}</span>
          </p>
          <div className="create-room__fields">
            <fieldset className="field">
              <legend className="field__label" id="capacity-label">
                Kapasite
              </legend>
              <CapacityStepper value={capacity} max={max} onChange={changeCapacity} />
            </fieldset>

            <fieldset className="field create-room__last" aria-describedby="access-hint">
              <legend className="field__label">Kimler girebilir</legend>
              <div className="choice-row">
                {ACCESS_OPTIONS.map((o) => (
                  <button key={o.id} type="button" aria-pressed={access === o.id} onClick={() => setAccess(o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p id="access-hint" className="field__note create-room__access-hint">
                {ACCESS_OPTIONS.find((o) => o.id === access).hint}
              </p>
            </fieldset>
          </div>

          {/* telefonda yapışkan çubuk: mini önizleme (seçili tema + kişi sayısı, seçim değişince yeniden
              belirir; dokununca canlı sahneye çıkar) ve kırpılmadan iki satıra sarılan özet */}
          <div className="create-room__cta">
            <button type="button" key={`${theme}-${capacity}`} className="create-room__mini" onClick={showStage} aria-label={`Canlı önizlemeye git: ${label}, ${capacity} kişilik`}>
              <ThemeShot key={isDark ? 'dark' : 'light'} src={thumbOf(theme, isDark)} className="create-room__mini-img" />
              <span className="create-room__mini-count" aria-hidden="true">
                <Icon name="body" size={12} />
                {capacity}
              </span>
            </button>
            <p className="create-room__summary">
              <span className="create-room__summary-name">{roomName}</span>
              <span className="create-room__summary-meta">
                {label} · {capacity} kişilik · {ACCESS_OPTIONS.find((o) => o.id === access).label}
              </span>
              {spot && <span className="create-room__spot">Seçilen mola noktası: {spot.label}</span>}
            </p>
            <div className="create-room__error" role="alert">
              {failure && (
                <>
                  <p>{FAILURE_TEXT[failure.reason]}</p>
                  {failure.reason !== 'failed' && (
                    <button type="button" className="link-btn link-btn--strong" onClick={enterForSession}>
                      Kaydetmeden, bu oturumluk gir
                    </button>
                  )}
                </>
              )}
            </div>
            <button type="submit" className="site-btn site-btn--primary site-btn--wide">
              {failure ? 'Tekrar dene' : 'Odayı oluştur ve gir'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
